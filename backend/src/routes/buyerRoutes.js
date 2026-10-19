const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const ProcurementRequirement = require('../models/ProcurementRequirement');
const SellerOffer = require('../models/SellerOffer');
const Negotiation = require('../models/Negotiation');
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const ProductRule = require('../models/ProductRule');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { parseBuyerPrompt } = require('../services/aiService');
const { processRequirementMatchingAndNegotiation, matchProductToItem, buildItemNegotiationProfile } = require('../services/negotiationEngine');
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

    const hasExplicitItems = Array.isArray(providedItems) && providedItems.length > 0;

    if (textToParse && (!hasExplicitItems || !total_budget || !deadline_days)) {
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
    if (hasExplicitItems) {
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

    const activeProducts = await Product.find({ active: { $ne: false } }).lean();
    const allProductRules = activeProducts.length > 0
      ? await ProductRule.find({ productId: { $in: activeProducts.map(p => p._id) } }).lean()
      : [];
    const ruleByProdId = {};
    for (const r of allProductRules) {
      if (r.productId) {
        ruleByProdId[r.productId.toString()] = r;
      }
    }

    const canProductFulfillQty = (prod, qty) => {
      if (!prod) return false;
      const pIdStr = prod._id ? prod._id.toString() : '';
      const rawRule = ruleByProdId[pIdStr] || null;
      const validRule = (
        rawRule &&
        (!rawRule.sellerId || !prod.sellerId || rawRule.sellerId.toString() === prod.sellerId.toString())
      )
        ? rawRule
        : null;
      const prof = buildItemNegotiationProfile(prod, validRule, qty);
      return (
        Number(prod.stock ?? 0) >= qty &&
        qty >= prof.effectiveMOQ &&
        (prof.maxQuantityRule === null || qty <= prof.maxQuantityRule) &&
        prof.initialMarginPct >= prof.marginFloorPct &&
        prof.effectiveMinAllowedPrice <= prof.totalListPrice
      );
    };

    let estimatedItemsTotal = 0;
    let rawItems = hasExplicitItems ? providedItems : parsedResult.items;
    const finalItems = (rawItems || [])
      .map(i => {
        const itemName = String(i.item_name || i.name || 'Item').trim();
        const quantity = parseInt(i.quantity, 10);
        const estimatedBudget = i.estimated_budget ? Number(i.estimated_budget) : null;
        const rawProductId = i.productId || i.product_id || i.id || i._id || null;
        const rawSellerId = i.sellerId || i.seller_id || null;
        const rawCategory = i.category ? String(i.category).trim() : null;

        let resolvedProduct = null;
        if (rawProductId && mongoose.Types.ObjectId.isValid(String(rawProductId))) {
          const byId = activeProducts.find(p => String(p._id) === String(rawProductId));
          if (byId && (!itemName || itemName === 'Item' || matchProductToItem(itemName, byId).matches)) {
            resolvedProduct = byId;
          }
        }

        if ((!resolvedProduct || !canProductFulfillQty(resolvedProduct, quantity)) && itemName) {
          const candidates = activeProducts
            .map(p => {
              const res = matchProductToItem(itemName, p);
              return {
                product: p,
                matches: res.matches,
                score: res.score,
                canFulfill: canProductFulfillQty(p, quantity)
              };
            })
            .filter(c => c.matches && c.score > 0)
            .sort((a, b) => {
              if (a.canFulfill !== b.canFulfill) return a.canFulfill ? -1 : 1;
              if (b.score !== a.score) return b.score - a.score;
              return (a.product.price || 0) - (b.product.price || 0);
            });
          if (candidates.length > 0 && (!resolvedProduct || candidates[0].canFulfill)) {
            resolvedProduct = candidates[0].product;
          }
        }

        // Preserve buyer/analysis item_name so generic multi-seller searches are not narrowed to a single seller's title
        const preservedItemName = (itemName && itemName !== 'Item')
          ? itemName
          : (resolvedProduct ? resolvedProduct.name : itemName);

        const itemObj = {
          item_name: preservedItemName,
          quantity,
          estimated_budget: estimatedBudget
        };

        if (resolvedProduct) {
          itemObj.productId = resolvedProduct._id;
          itemObj.sellerId = (rawSellerId && mongoose.Types.ObjectId.isValid(String(rawSellerId)) && String(resolvedProduct._id) === String(rawProductId))
            ? rawSellerId
            : resolvedProduct.sellerId;
          itemObj.category = resolvedProduct.category || rawCategory || null;
          estimatedItemsTotal += Number(resolvedProduct.price || 0) * quantity;
        } else {
          if (rawProductId && mongoose.Types.ObjectId.isValid(String(rawProductId))) {
            itemObj.productId = rawProductId;
          }
          if (rawSellerId && mongoose.Types.ObjectId.isValid(String(rawSellerId))) {
            itemObj.sellerId = rawSellerId;
          }
          if (rawCategory) {
            itemObj.category = rawCategory;
          }
          estimatedItemsTotal += 1500 * quantity;
        }

        return itemObj;
      })
      .filter(i => i.item_name.length > 0 && i.quantity >= 1);

    const defaultCalculatedBudget = (!parsedResult.has_explicit_budget && estimatedItemsTotal > (parsedResult.total_budget || 100000))
      ? estimatedItemsTotal
      : (parsedResult.total_budget || 100000);
    const finalBudget = total_budget ? Number(total_budget) : defaultCalculatedBudget;
    const finalDeadline = deadline_days ? Number(deadline_days) : (parsedResult.deadline_days || 14);

    if (finalItems.length === 0) {
      return res.status(400).json({ error: 'Could not extract any product items from the requirement prompt.' });
    }

    const defaultSummary = `Requirement for ${finalItems.map(i => `${i.quantity}x ${i.item_name}`).join(', ')} within ₹${finalBudget.toLocaleString('en-IN')} (${finalDeadline} days).`;

    const requirement = await ProcurementRequirement.create({
      buyerId,
      rawPrompt: textToParse || finalItems.map(i => `${i.quantity}x ${i.item_name}`).join(', '),
      parsedSummary: hasExplicitItems ? defaultSummary : (parsedResult.parsed_summary || defaultSummary),
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

    // Deterministic sorting: VALID first, OVER_BUDGET second, REJECTED last; then landedCost, negotiatedAmount, leadTimeDays
    const statusPriority = { VALID: 0, OVER_BUDGET: 1, REJECTED: 2 };
    offers.sort((a, b) => {
      const pa = statusPriority[a.status] ?? 3;
      const pb = statusPriority[b.status] ?? 3;
      if (pa !== pb) return pa - pb;
      const la = a.landedCost ?? a.negotiatedAmount ?? 0;
      const lb = b.landedCost ?? b.negotiatedAmount ?? 0;
      if (la !== lb) return la - lb;
      if (a.negotiatedAmount !== b.negotiatedAmount) return a.negotiatedAmount - b.negotiatedAmount;
      return (a.leadTimeDays || 7) - (b.leadTimeDays || 7);
    });

    const formattedPlans = offers.map(o => {
      const discountRatio = o.originalAmount > 0 ? (o.negotiatedAmount / o.originalAmount) : 1;
      const formattedItems = (o.items || []).map(i => {
        const qty = i.quantity || 1;
        const unitList = i.unitListPrice ?? (qty > 0 ? Math.round(((i.totalListPrice || 0) / qty) * 100) / 100 : 0);
        const totalList = i.totalListPrice ?? (Math.round((unitList * qty) * 100) / 100);
        const totalNegotiated = i.totalNegotiatedPrice ?? (Math.round((totalList * discountRatio) * 100) / 100);
        const unitNegotiated = i.unitNegotiatedPrice ?? (qty > 0 ? Math.round((totalNegotiated / qty) * 100) / 100 : 0);
        return {
          productId: i.productId,
          name: i.name,
          quantity: qty,
          unit_list_price: unitList,
          unit_negotiated_price: unitNegotiated,
          total_list_price: totalList,
          total_negotiated_price: totalNegotiated,
          min_allowed_price: i.minAllowedPrice
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
          configured_percent: bd.advancePayDiscount?.configuredPercent ?? bd.advancePayDiscount?.configured_percent ?? bd.advance_pay_discount?.configured_percent ?? 0,
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
        min_allowed_price: o.minAllowedPrice || 0,
        landed_cost: o.landedCost ?? o.negotiatedAmount,
        landed_cost_breakdown: o.landedCostBreakdown || {
          negotiatedPrice: o.negotiatedAmount,
          deliveryCharge: 0,
          financingCost: 0,
          earlyPaymentBenefit: 0,
          totalLandedCost: o.landedCost ?? o.negotiatedAmount,
          leadTimeDays: o.leadTimeDays
        },
        savings: o.savings,
        lead_time_days: o.leadTimeDays,
        status: o.status,
        rejection_reason: o.rejectionReason,
        is_best_deal: Boolean(o.isBestDeal && o.status === 'VALID'),
        is_fastest_delivery: Boolean(o.isFastestDelivery && o.status === 'VALID'),
        plan_type: o.planType || null,
        plan_label: o.planLabel || null,
        why_this_deal: o.whyThisDeal || [],
        rounds: o.negotiationRounds || [],
        discount_breakdown: discountBreakdownFormatted
      };
    });

    const lowestCostPlan = formattedPlans.find(p => p.is_best_deal) || null;
    const fastestDeliveryPlan = formattedPlans.find(p => p.is_fastest_delivery) || null;

    let noMatchReason = null;
    if (formattedPlans.length === 0) {
      const activeProducts = await Product.find({ active: true }).lean();
      if (activeProducts.length === 0) {
        noMatchReason = 'No active seller products are currently listed in the DealPilot catalog.';
      } else {
        const unmatchedNames = (reqDoc.items || [])
          .filter(rItem => {
            if (rItem.productId && activeProducts.some(p => String(p._id) === String(rItem.productId))) {
              return false;
            }
            return !activeProducts.some(p => matchProductToItem(rItem.item_name, p).matches);
          })
          .map(rItem => `"${rItem.item_name}"`);

        if (unmatchedNames.length > 0) {
          noMatchReason = `No active seller catalog product matched requested item(s): ${unmatchedNames.join(', ')}.`;
        } else {
          noMatchReason = 'No single seller in the catalog carries all requested items in a single bundle.';
        }
      }
    }

    res.json({
      requirement: {
        id: reqDoc._id,
        raw_prompt: reqDoc.rawPrompt,
        parsed_summary: reqDoc.parsedSummary,
        total_budget: reqDoc.targetBudget,
        deadline_days: reqDoc.deadlineDays,
        items: reqDoc.items,
        status: reqDoc.status
      },
      ranking: {
        lowest_cost_plan: lowestCostPlan,
        fastest_delivery_plan: fastestDeliveryPlan
      },
      plans: formattedPlans,
      no_match_reason: noMatchReason
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
