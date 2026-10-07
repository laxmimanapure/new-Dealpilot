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
    const { promptText, raw_prompt, total_budget, deadline_days, items: providedItems } = req.body;

    const textToParse = promptText || raw_prompt;
    if (!textToParse && (!providedItems || providedItems.length === 0)) {
      return res.status(400).json({ error: 'Requirement description or items list is required' });
    }

    let parsedResult = { items: [], total_budget: total_budget || 100000, deadline_days: deadline_days || 14 };

    if (textToParse) {
      // Call Gemini AI service to parse natural language
      parsedResult = await parseBuyerPrompt(textToParse);
    }

    let rawItems = (providedItems && providedItems.length > 0) ? providedItems : parsedResult.items;
    const finalItems = (rawItems || [])
      .map(i => ({
        item_name: String(i.item_name || i.name || 'Item').trim(),
        quantity: Math.max(1, parseInt(i.quantity, 10) || 1),
        estimated_budget: i.estimated_budget ? Number(i.estimated_budget) : null
      }))
      .filter(i => i.item_name.length > 0 && i.quantity >= 1);

    const finalBudget = total_budget ? Number(total_budget) : (parsedResult.total_budget || 100000);
    const finalDeadline = deadline_days ? Number(deadline_days) : (parsedResult.deadline_days || 14);

    if (finalItems.length === 0) {
      return res.status(400).json({ error: 'Could not extract any product items from the requirement prompt.' });
    }

    // Save requirement to MongoDB
    const requirement = await ProcurementRequirement.create({
      buyerId,
      rawPrompt: textToParse || finalItems.map(i => `${i.quantity}x ${i.item_name}`).join(', '),
      parsedSummary: parsedResult.parsed_summary || `Multi-item procurement requirement for ${finalItems.length} products.`,
      items: finalItems,
      targetBudget: finalBudget,
      deadlineDays: finalDeadline,
      status: 'SUBMITTED'
    });

    await logAuditEvent({
      requestId: requirement._id,
      userId: buyerId,
      action: 'REQUIREMENT_SUBMITTED',
      details: { itemsCount: finalItems.length, budget: finalBudget, deadlineDays: finalDeadline },
      policyResult: 'APPROVED'
    });

    // Run deterministic seller matching & product-rule negotiation
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

    const requirement = await ProcurementRequirement.findOne({ _id: requirementId, buyerId }).lean();
    if (!requirement) {
      return res.status(404).json({ error: 'Requirement not found or unauthorized' });
    }

    let offers = await SellerOffer.find({ requirementId })
      .populate('sellerId', 'name companyName email')
      .lean();

    // If offers haven't been generated yet, run matching engine now
    if (offers.length === 0) {
      const reqDoc = await ProcurementRequirement.findById(requirementId);
      if (reqDoc) {
        await processRequirementMatchingAndNegotiation(reqDoc);
        offers = await SellerOffer.find({ requirementId })
          .populate('sellerId', 'name companyName email')
          .lean();
      }
    }

    const formattedPlans = offers.map(o => ({
      offer_id: o._id,
      seller_id: o.sellerId?._id,
      seller_name: o.sellerId?.companyName || o.sellerId?.name || 'Seller',
      seller_email: o.sellerId?.email,
      items: o.items,
      original_amount: o.originalAmount,
      negotiated_amount: o.negotiatedAmount,
      savings: o.savings,
      lead_time_days: o.leadTimeDays,
      status: o.status,
      is_best_deal: Boolean(o.isBestDeal),
      why_this_deal: o.whyThisDeal || [],
      rounds: o.negotiationRounds || []
    }));

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

    // Clean up requirement, offers, and negotiations from MongoDB
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

