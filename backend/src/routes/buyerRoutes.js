const express = require('express');
const router = express.Router();
const ProcurementRequirement = require('../models/ProcurementRequirement');
const SellerOffer = require('../models/SellerOffer');
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { parseBuyerPrompt } = require('../services/aiService');
const { processRequirementMatchingAndNegotiation } = require('../services/negotiationEngine');
const { logAuditEvent } = require('../services/auditService');
const { getDefaultProductImage } = require('../seed');

router.use(authenticateToken);
router.use(requireRole('buyer'));

// GET /api/buyer/summary
router.get('/summary', async (req, res) => {
  try {
    const buyerId = req.user.id;

    const [totalRequests, completedOrdersCount, confirmedOrders] = await Promise.all([
      ProcurementRequirement.countDocuments({ buyerId }),
      Order.countDocuments({ buyerId, orderStatus: 'CONFIRMED' }),
      Order.find({ buyerId, paymentStatus: 'PAID' }).select('finalAmount savings')
    ]);

    const totalSpend = confirmedOrders.reduce((sum, o) => sum + (o.finalAmount || 0), 0);
    const totalBenefits = confirmedOrders.reduce((sum, o) => sum + (o.savings || 0), 0);

    res.json({
      summary: {
        totalSpend,
        totalBenefits,
        completedOrders: completedOrdersCount,
        totalRequests
      }
    });
  } catch (err) {
    console.error('Buyer summary error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/buyer/catalog - Get full buyer product catalog with images, categories, and suppliers
router.get('/catalog', async (req, res) => {
  try {
    const { category, search } = req.query;
    const filter = { active: true };

    if (category && category !== 'All') {
      filter.category = new RegExp(`^${category.trim()}$`, 'i');
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [
        { name: regex },
        { category: regex },
        { description: regex },
        { sku: regex }
      ];
    }

    const products = await Product.find(filter)
      .populate('sellerId', 'name companyName email')
      .sort({ createdAt: -1 })
      .lean();

    const formatted = products.map(p => {
      const img = p.imageUrl || getDefaultProductImage(p.name, p.category);
      return {
        id: p._id,
        _id: p._id,
        name: p.name,
        category: p.category,
        description: p.description,
        sku: p.sku,
        imageUrl: img,
        image: img,
        price: p.price,
        list_price: p.price,
        stock: p.stock,
        unit: p.unit,
        moq: p.moq,
        standard_lead_time_days: p.standardLeadTimeDays,
        seller_id: p.sellerId?._id,
        supplier_name: p.sellerId?.companyName || p.sellerId?.name || 'Verified Supplier',
        supplier_email: p.sellerId?.email,
        created_at: p.createdAt
      };
    });

    res.json({ catalog: formatted, products: formatted });
  } catch (err) {
    console.error('Buyer catalog error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/buyer/requests - List requirements for logged-in buyer
router.get('/requests', async (req, res) => {
  try {
    const buyerId = req.user.id;
    const requirements = await ProcurementRequirement.find({ buyerId })
      .sort({ createdAt: -1 })
      .lean();

    const formatted = requirements.map(r => ({
      id: r._id,
      buyer_id: r.buyerId,
      raw_prompt: r.rawPrompt,
      parsed_summary: r.parsedSummary,
      total_budget: r.targetBudget,
      deadline_days: r.deadlineDays,
      status: r.status,
      items: r.items,
      created_at: r.createdAt
    }));

    res.json({ requests: formatted });
  } catch (err) {
    console.error('Fetch buyer requests error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/buyer/requests - Submit new multi-item requirement
router.post('/requests', async (req, res) => {
  try {
    const buyerId = req.user.id;
    const { promptText, raw_prompt, total_budget, deadline_days, isAdvancePayment, is_advance_payment, items: providedItems } = req.body;
    const isAdvPay = Boolean(isAdvancePayment || is_advance_payment);

    const textToParse = promptText || raw_prompt;
    if (!textToParse && (!providedItems || providedItems.length === 0)) {
      return res.status(400).json({ error: 'Requirement description or items list is required' });
    }

    let parsedResult = { items: [], total_budget: total_budget || 100000, deadline_days: deadline_days || 14 };

    if (textToParse) {
      console.log(`\n===================================================`);
      console.log(`📥 [API DIAGNOSTIC] POST /api/buyer/requests endpoint called`);
      console.log(`   Prompt Text: "${textToParse}"`);

      parsedResult = await parseBuyerPrompt(textToParse);

      console.log(`   AI Engine Used: ${parsedResult.ai_engine}`);
      console.log(`   Is AI Parsed: ${parsedResult.is_ai_parsed}`);
      console.log(`   Extracted Items:`, JSON.stringify(parsedResult.items));
      console.log(`   Extracted Budget: ₹${parsedResult.total_budget}`);
      console.log(`   Extracted Deadline: ${parsedResult.deadline_days} days`);
      console.log(`===================================================\n`);
    }

    // Strict backend validation of provided items and quantities
    if (providedItems && Array.isArray(providedItems) && providedItems.length > 0) {
      for (const i of providedItems) {
        const rawQty = i.quantity;
        const numQty = Number(rawQty);
        const nameStr = String(i.item_name || i.name || '').trim();

        if (!nameStr) {
          return res.status(400).json({ error: 'Product name cannot be empty.' });
        }
        if (rawQty === undefined || rawQty === null || rawQty === '' || isNaN(numQty)) {
          return res.status(400).json({ error: `Quantity for item '${nameStr}' must be a valid number.` });
        }
        if (numQty <= 0) {
          return res.status(400).json({ error: `Quantity for item '${nameStr}' must be a positive integer greater than 0.` });
        }
        if (!Number.isInteger(numQty)) {
          return res.status(400).json({ error: `Quantity for item '${nameStr}' must be a whole integer (no decimals).` });
        }
      }
    }

    let rawItems = (providedItems && providedItems.length > 0) ? providedItems : parsedResult.items;
    const finalItems = (rawItems || [])
      .map(i => ({
        item_name: String(i.item_name || i.name || 'Item').trim(),
        quantity: parseInt(i.quantity, 10),
        estimated_budget: i.estimated_budget ? Number(i.estimated_budget) : null
      }))
      .filter(i => i.item_name.length > 0 && i.quantity >= 1);

    const finalBudget = total_budget ? Number(total_budget) : (parsedResult.total_budget || 100000);
    const finalDeadline = deadline_days ? Number(deadline_days) : (parsedResult.deadline_days || 14);

    if (finalItems.length === 0) {
      return res.status(400).json({ error: 'Could not extract any product items from the requirement prompt.' });
    }

    const requirement = await ProcurementRequirement.create({
      buyerId,
      rawPrompt: textToParse || finalItems.map(i => `${i.quantity}x ${i.item_name}`).join(', '),
      parsedSummary: parsedResult.parsed_summary || `Multi-item procurement requirement for ${finalItems.length} products.`,
      items: finalItems,
      targetBudget: finalBudget,
      deadlineDays: finalDeadline,
      isAdvancePayment: isAdvPay,
      status: 'SUBMITTED'
    });

    await logAuditEvent({
      requestId: requirement._id,
      userId: buyerId,
      action: 'REQUIREMENT_SUBMITTED',
      details: { itemsCount: finalItems.length, budget: finalBudget, deadlineDays: finalDeadline },
      policyResult: 'APPROVED'
    });

    requirement.status = 'MATCHING';
    await requirement.save();

    const offers = await processRequirementMatchingAndNegotiation(requirement);

    requirement.status = offers.length > 0 ? 'OFFER_READY' : 'SUBMITTED';
    await requirement.save();

    res.status(201).json({
      message: 'Procurement requirement created and negotiated successfully',
      requirement: {
        id: requirement._id,
        raw_prompt: requirement.rawPrompt,
        parsed_summary: requirement.parsedSummary,
        total_budget: requirement.targetBudget,
        deadline_days: requirement.deadlineDays,
        items: requirement.items,
        status: requirement.status
      },
      offers_count: offers.length
    });
  } catch (err) {
    console.error('Create requirement error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/buyer/requests/:id/plans - Get ranked seller offers & negotiation comparison
router.get('/requests/:id/plans', async (req, res) => {
  try {
    const buyerId = req.user.id;
    const requirementId = req.params.id;

    const reqDoc = await ProcurementRequirement.findOne({ _id: requirementId, buyerId });
    if (!reqDoc) {
      return res.status(404).json({ error: 'Requirement not found or unauthorized' });
    }

    // Always re-run requirement matching & negotiation to refresh volume and delivery discounts
    await processRequirementMatchingAndNegotiation(reqDoc);

    const offers = await SellerOffer.find({ requirementId })
      .populate('sellerId', 'name companyName email')
      .lean();

    const formattedPlans = offers.map(o => {
      const discountRatio = o.originalAmount > 0 ? (o.negotiatedAmount / o.originalAmount) : 1;
      const formattedItems = (o.items || []).map(i => {
        const qty = i.quantity || 1;
        const unitList = i.unitListPrice || (qty > 0 ? Math.round(((i.totalListPrice || 0) / qty) * 100) / 100 : 0);
        const totalList = i.totalListPrice || (Math.round((unitList * qty) * 100) / 100);
        const unitNegotiated = Math.round((unitList * discountRatio) * 100) / 100;
        const totalNegotiated = Math.round((totalList * discountRatio) * 100) / 100;
        return {
          productId: i.productId,
          name: i.name,
          quantity: qty,
          unit_list_price: unitList,
          unit_negotiated_price: unitNegotiated,
          total_list_price: totalList,
          total_negotiated_price: totalNegotiated
        };
      });

      const totalRequestedUnits = formattedItems.reduce((acc, it) => acc + (it.quantity || 1), 0);
      const bd = o.discountBreakdown || {};

      const discountBreakdownFormatted = {
        total_requested_units: bd.totalRequestedUnits || bd.total_requested_units || totalRequestedUnits,
        list_price_total: bd.listPriceTotal || bd.list_price_total || o.originalAmount,
        bulk_discount: {
          applied: Boolean(bd.bulkDiscount?.applied ?? bd.bulk_discount?.applied ?? false),
          percent: bd.bulkDiscount?.percent ?? bd.bulk_discount?.percent ?? 0,
          amount: bd.bulkDiscount?.amount ?? bd.bulk_discount?.amount ?? 0,
          explanation: bd.bulkDiscount?.explanation || bd.bulkDiscount?.reason || bd.bulk_discount?.explanation || bd.bulk_discount?.reason || 'No bulk discount applied because no qualifying bulk discount rule is configured.'
        },
        lead_time_discount: {
          applied: Boolean(bd.leadTimeDiscount?.applied ?? bd.lead_time_discount?.applied ?? false),
          percent: bd.leadTimeDiscount?.percent ?? bd.lead_time_discount?.percent ?? 0,
          amount: bd.leadTimeDiscount?.amount ?? bd.lead_time_discount?.amount ?? 0,
          explanation: bd.leadTimeDiscount?.explanation || bd.leadTimeDiscount?.reason || bd.lead_time_discount?.explanation || bd.lead_time_discount?.reason || 'No flexible delivery discount applied.'
        },
        advance_pay_discount: {
          applied: Boolean(bd.advancePayDiscount?.applied ?? bd.advance_pay_discount?.applied ?? false),
          percent: bd.advancePayDiscount?.percent ?? bd.advance_pay_discount?.percent ?? 0,
          amount: bd.advancePayDiscount?.amount ?? bd.advance_pay_discount?.amount ?? 0,
          explanation: bd.advancePayDiscount?.explanation || bd.advancePayDiscount?.reason || bd.advance_pay_discount?.explanation || bd.advance_pay_discount?.reason || 'No advance payment discount applied.'
        },
        total_discount_amount: bd.totalDiscountAmount ?? bd.total_discount_amount ?? (o.savings || 0),
        final_negotiated_total: bd.finalNegotiatedTotal ?? bd.final_negotiated_total ?? o.negotiatedAmount
      };

      return {
        offer_id: o._id,
        seller_id: o.sellerId?._id,
        seller_name: o.sellerId?.companyName || o.sellerId?.name || 'Seller',
        seller_email: o.sellerId?.email,
        items: formattedItems,
        total_requested_units: totalRequestedUnits,
        original_amount: o.originalAmount,
        negotiated_amount: o.negotiatedAmount,
        savings: o.savings,
        lead_time_days: o.leadTimeDays,
        status: o.status,
        rejection_reason: o.rejectionReason,
        is_best_deal: Boolean(o.isBestDeal),
        why_this_deal: o.whyThisDeal || [],
        rounds: o.negotiationRounds || [],
        discount_breakdown: discountBreakdownFormatted
      };
    });

    res.json({
      requirement: {
        id: requirement._id,
        raw_prompt: requirement.rawPrompt,
        parsed_summary: requirement.parsedSummary,
        total_budget: requirement.targetBudget,
        deadline_days: requirement.deadlineDays,
        items: requirement.items,
        status: requirement.status
      },
      plans: formattedPlans
    });
  } catch (err) {
    console.error('Fetch plans error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/buyer/suppliers - View real registered sellers in MongoDB
router.get('/suppliers', async (req, res) => {
  try {
    const sellers = await User.find({ role: 'seller' })
      .select('name companyName email createdAt')
      .lean();

    const formatted = await Promise.all(sellers.map(async s => {
      const activeProductsCount = await Product.countDocuments({ sellerId: s._id, active: true });
      const completedOrdersCount = await Order.countDocuments({ sellerId: s._id, orderStatus: 'CONFIRMED' });
      return {
        id: s._id,
        company_name: s.companyName || s.name,
        contact_name: s.name,
        email: s.email,
        active_products: activeProductsCount,
        completed_orders: completedOrdersCount,
        joined_at: s.createdAt
      };
    }));

    res.json({ suppliers: formatted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/buyer/requests/:id - Delete a procurement requirement / negotiation
router.delete('/requests/:id', async (req, res) => {
  try {
    const buyerId = req.user.id;
    const requirementId = req.params.id;

    const requirement = await ProcurementRequirement.findOne({ _id: requirementId, buyerId });
    if (!requirement) {
      return res.status(404).json({ error: 'Negotiation request not found or unauthorized' });
    }

    await Promise.all([
      ProcurementRequirement.deleteOne({ _id: requirementId, buyerId }),
      SellerOffer.deleteMany({ requirementId }),
      Negotiation.deleteMany({ requirementId })
    ]);

    await logAuditEvent({
      requestId: requirementId,
      userId: buyerId,
      action: 'REQUIREMENT_DELETED',
      details: { requirementId },
      policyResult: 'APPROVED'
    });

    res.json({ message: 'Negotiation removed successfully', id: requirementId });
  } catch (err) {
    console.error('Delete requirement error:', err);
    res.status(500).json({ error: err.message || 'Failed to remove negotiation' });
  }
});

module.exports = router;
