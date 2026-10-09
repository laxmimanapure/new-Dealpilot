const Product = require('../models/Product');
const ProductRule = require('../models/ProductRule');
const User = require('../models/User');
const SellerOffer = require('../models/SellerOffer');
const Negotiation = require('../models/Negotiation');
const { logAuditEvent } = require('./auditService');

function roundToTwo(num) {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Deterministic Product-Rule Matching & Negotiation Engine
 */
async function processRequirementMatchingAndNegotiation(requirement) {
  const reqItems = requirement.items || [];
  if (reqItems.length === 0) {
    return [];
  }

  // 1. Get all active seller products from MongoDB
  const activeProducts = await Product.find({ active: true, stock: { $gt: 0 } }).lean();
  if (activeProducts.length === 0) {
    return [];
  }

  // Group products by sellerId
  const sellerProductMap = {};
  for (const prod of activeProducts) {
    const sId = prod.sellerId.toString();
    if (!sellerProductMap[sId]) {
      sellerProductMap[sId] = [];
    }
    sellerProductMap[sId].push(prod);
  }

  const sellerIds = Object.keys(sellerProductMap);
  const sellers = await User.find({ _id: { $in: sellerIds }, role: 'seller' }).lean();

  // Purge any existing stale offers and negotiation logs for this requirement before recalculating
  await SellerOffer.deleteMany({ requirementId: requirement._id });
  await Negotiation.deleteMany({ requirementId: requirement._id });

  const generatedOffers = [];

  for (const seller of sellers) {
    const sId = seller._id.toString();
    const sellerProds = sellerProductMap[sId] || [];

    let allItemsMatched = true;
    let moqBreachFound = false;
    let moqRejectionReason = '';
    let totalListPrice = 0;
    let totalCostPrice = 0;
    let totalMinAllowedPrice = 0;
    const matchedItems = [];

    // Qualification flags from requirement:
    const promptLower = (requirement.rawPrompt || '').toLowerCase();
    const isAdvancePayQualified = Boolean(
      requirement.isAdvancePayment || 
      requirement.is_advance_payment ||
      promptLower.includes('advance') || 
      promptLower.includes('upfront') || 
      promptLower.includes('100%') || 
      promptLower.includes('prepaid')
    );

    const reqDeadlineDays = requirement.deadlineDays || requirement.deadline_days || 14;

    for (const rItem of reqItems) {
      const query = rItem.item_name.toLowerCase();
      
      const matchedProd = sellerProds.find(p => 
        p.name.toLowerCase().includes(query) ||
        query.includes(p.name.toLowerCase()) ||
        (p.category && query.includes(p.category.toLowerCase()))
      );

      if (!matchedProd || matchedProd.stock < rItem.quantity) {
        allItemsMatched = false;
        break;
      }

      // Fetch product-specific rule from MongoDB
      const rule = await ProductRule.findOne({ productId: matchedProd._id }).lean();

      // MOQ Check: Enforce minimum order quantity
      const minQtyRule = rule ? (rule.minimumQuantity ?? rule.minimum_quantity) : undefined;
      const effectiveMOQ = (minQtyRule !== undefined && minQtyRule !== null) 
        ? Math.max(minQtyRule, matchedProd.moq || 1) 
        : (matchedProd.moq || 1);

      if (rItem.quantity < effectiveMOQ) {
        moqBreachFound = true;
        moqRejectionReason = `Requested quantity (${rItem.quantity}) is below minimum order quantity (MOQ: ${effectiveMOQ}) for product "${matchedProd.name}".`;
      }

      const itemListPrice = roundToTwo(matchedProd.price * rItem.quantity);
      const itemCostPrice = roundToTwo(matchedProd.costPrice * rItem.quantity);
      
      // Determine product minimum price floor
      const minPricePerUnit = (rule && rule.minimumPrice !== undefined) ? rule.minimumPrice : (matchedProd.price * 0.85);
      const itemMinAllowedPrice = roundToTwo(minPricePerUnit * rItem.quantity);

      matchedItems.push({
        productId: matchedProd._id,
        name: matchedProd.name,
        quantity: rItem.quantity,
        effectiveMOQ,
        unitListPrice: matchedProd.price,
        totalListPrice: itemListPrice,
        costPrice: itemCostPrice,
        minAllowedPrice: itemMinAllowedPrice,
        standardLeadTimeDays: matchedProd.standardLeadTimeDays ?? matchedProd.standard_lead_time_days ?? 3,
        rule
      });

      totalListPrice += itemListPrice;
      totalCostPrice += itemCostPrice;
      totalMinAllowedPrice += itemMinAllowedPrice;
    }

    if (!allItemsMatched || matchedItems.length === 0) {
      continue; // Seller cannot fulfill complete requirement
    }

    // Handle MOQ Breach
    if (moqBreachFound) {
      const offer = await SellerOffer.create({
        requirementId: requirement._id,
        sellerId: seller._id,
        items: matchedItems.map(i => ({
          productId: i.productId,
          name: i.name,
          quantity: i.quantity,
          unitListPrice: i.unitListPrice,
          totalListPrice: i.totalListPrice
        })),
        originalAmount: totalListPrice,
        negotiatedAmount: totalListPrice,
        savings: 0,
        leadTimeDays: 7,
        status: 'REJECTED',
        rejectionReason: moqRejectionReason,
        negotiationRounds: [{
          round_number: 1,
          lever_applied: 'MOQ Validation Check',
          calculated_price: totalListPrice,
          accepted: 0,
          rejection_reason: moqRejectionReason,
          explanation: moqRejectionReason
        }],
        isBestDeal: false,
        whyThisDeal: []
      });

      await Negotiation.create({
        requirementId: requirement._id,
        sellerId: seller._id,
        buyerId: requirement.buyerId,
        originalPrice: totalListPrice,
        negotiatedPrice: totalListPrice,
        rulesApplied: matchedItems.map(i => `MOQ check failed for ${i.name}`),
        concessions: [],
        status: 'REJECTED',
        rounds: offer.negotiationRounds
      });

      generatedOffers.push(offer);
      continue;
    }

    // Seller policy constraints across matched products:
    const firstRule = matchedItems[0]?.rule || {};
    const maxDiscountPct = firstRule.maximumDiscountPercent ?? firstRule.max_discount_percent ?? 15.0;
    const maxDiscountAmt = firstRule.maximumDiscountAmount ?? firstRule.max_discount_amount ?? 20000.0;
    const marginFloorPct = firstRule.marginFloorPercent ?? firstRule.margin_floor_percent ?? 8.0;

    // Minimum margin price floor
    const marginFloorPrice = roundToTwo(totalCostPrice / (1 - Math.min(marginFloorPct, 95.0) / 100));
    
    // Absolute Floor = Max(totalMinAllowedPrice, marginFloorPrice)
    const absolutePriceFloor = Math.max(totalMinAllowedPrice, marginFloorPrice);

    // Maximum Discount Cap Price
    const maxDiscByPctPrice = roundToTwo(totalListPrice * (1 - maxDiscountPct / 100));
    const maxDiscByAmtPrice = roundToTwo(totalListPrice - maxDiscountAmt);
    const maxDiscountCapPrice = Math.max(maxDiscByPctPrice, maxDiscByAmtPrice);

    // Enforced Seller Price Floor (Can NEVER negotiate below this)
    const effectiveMinAllowedPrice = Math.max(absolutePriceFloor, maxDiscountCapPrice);

    let currentPrice = totalListPrice;
    const stdLeadTime = matchedItems[0]?.standardLeadTimeDays || 3;
    let currentLeadTime = stdLeadTime;
    const rounds = [];
    let isAgreed = false;
    let rejectionReason = null;

    // Round 1: Bulk Quantity Discount (Explicit Seller Slabs Only)
    let round1DiscountPct = 0;
    let matchingSlab = null;
    let explicitBulkDiscountFound = false;

    const primaryItem = matchedItems[0];
    const primaryMOQ = primaryItem?.effectiveMOQ || 1;
    const primaryQty = primaryItem?.quantity || 1;

    for (const item of matchedItems) {
      const slabs = item.rule?.bulkDiscountRules || item.rule?.bulk_discount_rules || [];
      if (Array.isArray(slabs) && slabs.length > 0) {
        for (const b of slabs) {
          const minQ = b.minQuantity ?? b.min_quantity;
          const maxQ = (b.maxQuantity !== null && b.maxQuantity !== undefined && b.maxQuantity !== '') ? (b.maxQuantity ?? b.max_quantity) : null;
          const discPct = b.discountPercent ?? b.discount_percent ?? 0;
          if (minQ && item.quantity >= minQ && (!maxQ || item.quantity <= maxQ)) {
            if (discPct > round1DiscountPct) {
              round1DiscountPct = discPct;
              matchingSlab = { minQuantity: minQ, maxQuantity: maxQ, discountPercent: discPct };
            }
            explicitBulkDiscountFound = true;
          }
        }
      }
    }

    round1DiscountPct = Math.min(round1DiscountPct, maxDiscountPct);

    let round1Price = roundToTwo(totalListPrice * (1 - round1DiscountPct / 100));
    if (round1Price < effectiveMinAllowedPrice) {
      round1Price = effectiveMinAllowedPrice;
    }

    const round1DiscountAmount = roundToTwo(totalListPrice - round1Price);
    const round1MarginPct = round1Price > 0 ? roundToTwo(((round1Price - totalCostPrice) / round1Price) * 100) : 0;

    let round1Explanation = '';
    if (explicitBulkDiscountFound && round1DiscountAmount > 0) {
      round1Explanation = `Bulk discount: Qualified for seller's ${matchingSlab.minQuantity}+ unit slab — ${matchingSlab.discountPercent}%.`;
    } else if (explicitBulkDiscountFound && round1DiscountAmount === 0) {
      round1Explanation = `Bulk discount: Qualified for volume discount (${matchingSlab.discountPercent}%) but capped at ₹0 by seller margin floor (${marginFloorPct}%) or minimum price floor.`;
    } else {
      round1Explanation = `Bulk discount: No bulk discount applied because no qualifying bulk discount rule is configured.`;
    }

    rounds.push({
      round_number: 1,
      lever_applied: explicitBulkDiscountFound ? 'Configured Seller Bulk Discount Rule' : 'Volume Quantity Discount',
      calculated_price: round1Price,
      discount_percent: round1DiscountAmount > 0 ? roundToTwo((round1DiscountAmount / totalListPrice) * 100) : 0,
      total_discount_amount: round1DiscountAmount,
      seller_margin_percent: round1MarginPct,
      accepted: round1DiscountAmount > 0 ? 1 : 0,
      explanation: round1Explanation
    });

    currentPrice = round1Price;

    // Round 2: Advance Payment Discount
    const earlyPayDiscountPct = firstRule.earlyPaymentDiscount ?? firstRule.early_payment_discount ?? firstRule.advance_pay_extra_discount_percent ?? 0;

    let round2Price = currentPrice;
    let round2DiscountAmount = 0;
    let isRound2Applied = false;
    let round2Explanation = '';

    if (isAdvancePayQualified && earlyPayDiscountPct > 0) {
      let r2Calc = roundToTwo(currentPrice * (1 - earlyPayDiscountPct / 100));
      if (r2Calc < effectiveMinAllowedPrice) {
        r2Calc = effectiveMinAllowedPrice;
      }
      round2DiscountAmount = roundToTwo(currentPrice - r2Calc);
      round2Price = r2Calc;
      isRound2Applied = round2DiscountAmount > 0;

      if (isRound2Applied) {
        round2Explanation = `Advance payment discount: Qualified for 100% advance payment discount of ${earlyPayDiscountPct}%.`;
      } else {
        round2Explanation = `Advance payment discount: Qualified for ${earlyPayDiscountPct}% advance payment discount but capped by seller minimum price floor / margin floor.`;
      }
    } else if (!isAdvancePayQualified) {
      round2Explanation = `Advance payment discount: Not applied because upfront payment terms were not requested by buyer.`;
    } else {
      round2Explanation = `Advance payment discount: Not applied because seller has no active advance payment discount policy.`;
    }

    const round2MarginPct = round2Price > 0 ? roundToTwo(((round2Price - totalCostPrice) / round2Price) * 100) : 0;

    rounds.push({
      round_number: 2,
      lever_applied: '100% Advance Payment Discount',
      calculated_price: round2Price,
      discount_percent: isRound2Applied ? earlyPayDiscountPct : 0,
      total_discount_amount: round2DiscountAmount,
      seller_margin_percent: round2MarginPct,
      accepted: isRound2Applied ? 1 : 0,
      explanation: round2Explanation
    });

    currentPrice = round2Price;

    // Round 3: Extended Delivery / Lead Time Discount
    const extraLeadDaysConfig = firstRule.leadTimeExtensionDays ?? firstRule.max_lead_time_extension_days ?? firstRule.lead_time_extension_days ?? 7;
    const leadTimeDiscountMaxPct = firstRule.leadTimeExtraDiscount ?? firstRule.lead_time_extra_discount_percent ?? 0;

    let round3Price = currentPrice;
    let round3DiscountAmount = 0;
    let isRound3Applied = false;
    let round3Explanation = '';
    const extraDaysGiven = reqDeadlineDays > stdLeadTime ? (reqDeadlineDays - stdLeadTime) : 0;

    if (extraDaysGiven > 0 && leadTimeDiscountMaxPct > 0) {
      let effectiveLeadDiscountPct = roundToTwo(
        Math.min(leadTimeDiscountMaxPct, (extraDaysGiven / Math.max(1, extraLeadDaysConfig)) * leadTimeDiscountMaxPct)
      );
      effectiveLeadDiscountPct = Math.max(0.5, effectiveLeadDiscountPct);

      let r3Calc = roundToTwo(currentPrice * (1 - effectiveLeadDiscountPct / 100));
      if (r3Calc < effectiveMinAllowedPrice) {
        r3Calc = effectiveMinAllowedPrice;
      }
      round3DiscountAmount = roundToTwo(currentPrice - r3Calc);
      round3Price = r3Calc;
      isRound3Applied = round3DiscountAmount > 0;
      currentLeadTime = reqDeadlineDays;

      if (isRound3Applied) {
        round3Explanation = `Delivery discount: Qualified for flexible delivery discount (${effectiveLeadDiscountPct}% for ${extraDaysGiven} days extra delivery window).`;
      } else {
        round3Explanation = `Delivery discount: Qualified for ${effectiveLeadDiscountPct}% delivery extension discount but capped by seller minimum price floor / margin floor.`;
      }
    } else if (leadTimeDiscountMaxPct === 0) {
      round3Explanation = `Delivery discount: Not applied because seller has no active flexible delivery discount policy.`;
    } else {
      round3Explanation = `Delivery discount: Not applied because buyer delivery timeframe (${reqDeadlineDays} days) does not exceed standard lead time (${stdLeadTime} days).`;
    }

    const round3MarginPct = round3Price > 0 ? roundToTwo(((round3Price - totalCostPrice) / round3Price) * 100) : 0;

    rounds.push({
      round_number: 3,
      lever_applied: `Extended Delivery Window (+${extraDaysGiven} Days)`,
      calculated_price: round3Price,
      discount_percent: isRound3Applied ? roundToTwo((round3DiscountAmount / round2Price) * 100) : 0,
      total_discount_amount: round3DiscountAmount,
      seller_margin_percent: round3MarginPct,
      accepted: isRound3Applied ? 1 : 0,
      explanation: round3Explanation
    });

    currentPrice = round3Price;

    if (currentPrice <= requirement.targetBudget) {
      isAgreed = true;
    } else {
      isAgreed = false;
      rejectionReason = `Final negotiated price of ₹${currentPrice.toLocaleString('en-IN')} exceeds buyer target budget of ₹${requirement.targetBudget.toLocaleString('en-IN')}`;
    }

    const totalDiscountAmount = roundToTwo(round1DiscountAmount + round2DiscountAmount + round3DiscountAmount);
    const savings = totalDiscountAmount;

    const totalRequestedUnits = matchedItems.reduce((s, i) => s + i.quantity, 0);
    const qtyAboveMoq = Math.max(0, primaryQty - primaryMOQ);

    const discountBreakdown = {
      totalRequestedUnits,
      listPriceTotal: totalListPrice,
      bulkDiscount: {
        applied: Boolean(round1DiscountAmount > 0),
        percent: round1DiscountAmount > 0 ? roundToTwo((round1DiscountAmount / totalListPrice) * 100) : 0,
        amount: round1DiscountAmount,
        explanation: round1Explanation,
        reason: round1Explanation,
        moq: primaryMOQ,
        qtyAboveMoq
      },
      leadTimeDiscount: {
        applied: isRound3Applied,
        percent: isRound3Applied ? roundToTwo((round3DiscountAmount / round2Price) * 100) : 0,
        amount: round3DiscountAmount,
        explanation: round3Explanation,
        reason: round3Explanation,
        extraDays: extraDaysGiven
      },
      advancePayDiscount: {
        applied: isRound2Applied,
        percent: isRound2Applied ? earlyPayDiscountPct : 0,
        amount: round2DiscountAmount,
        explanation: round2Explanation,
        reason: round2Explanation
      },
      totalDiscountAmount: savings,
      finalNegotiatedTotal: roundToTwo(totalListPrice - savings)
    };

    // Create SellerOffer in MongoDB
    const offer = await SellerOffer.create({
      requirementId: requirement._id,
      sellerId: seller._id,
      items: matchedItems.map(i => ({
        productId: i.productId,
        name: i.name,
        quantity: i.quantity,
        unitListPrice: i.unitListPrice,
        totalListPrice: i.totalListPrice
      })),
      originalAmount: totalListPrice,
      negotiatedAmount: currentPrice,
      savings,
      leadTimeDays: currentLeadTime,
      status: isAgreed ? 'VALID' : 'OVER_BUDGET',
      rejectionReason: rejectionReason || null,
      negotiationRounds: rounds,
      discountBreakdown,
      isBestDeal: false,
      whyThisDeal: []
    });

    // Create Negotiation Audit Record
    await Negotiation.create({
      requirementId: requirement._id,
      sellerId: seller._id,
      buyerId: requirement.buyerId,
      originalPrice: totalListPrice,
      negotiatedPrice: currentPrice,
      rulesApplied: matchedItems.map(i => `Enforced minimum price floor (₹${i.minAllowedPrice}), margin floor (${marginFloorPct}%), and max discount cap (${maxDiscountPct}%)`),
      concessions: rounds.filter(r => r.accepted === 1).map(r => r.lever_applied),
      status: isAgreed ? 'AGREED' : 'REJECTED',
      rounds
    });

    await logAuditEvent({
      requestId: requirement._id,
      userId: requirement.buyerId,
      actor: `DealPilot Engine`,
      action: 'SELLER_MATCHED_AND_NEGOTIATED',
      details: { sellerName: seller.companyName || seller.name, originalAmount: totalListPrice, negotiatedAmount: currentPrice, status: offer.status },
      policyResult: 'APPROVED'
    });

    generatedOffers.push(offer);
  }

  // DYNAMIC RANKING & BEST DEAL SELECTION
  if (generatedOffers.length > 0) {
    const validOffers = generatedOffers.filter(o => o.status === 'VALID');
    
    let bestOffer = null;
    if (validOffers.length > 0) {
      validOffers.sort((a, b) => a.negotiatedAmount - b.negotiatedAmount);
      bestOffer = validOffers[0];
    } else {
      generatedOffers.sort((a, b) => a.negotiatedAmount - b.negotiatedAmount);
      bestOffer = generatedOffers[0];
    }

    if (bestOffer) {
      const sellerDoc = await User.findById(bestOffer.sellerId).select('name companyName').lean();
      const sellerName = sellerDoc ? (sellerDoc.companyName || sellerDoc.name) : 'Matched Seller';

      bestOffer.isBestDeal = true;
      bestOffer.whyThisDeal = [
        `All requested items verified against product MOQ & stock`,
        bestOffer.status === 'VALID' ? `Within buyer target budget of ₹${requirement.targetBudget.toLocaleString('en-IN')}` : `Closest valid offer to buyer budget`,
        `Seller margin floor & maximum discount policies fully verified`,
        `Lowest negotiated price of ₹${bestOffer.negotiatedAmount.toLocaleString('en-IN')} (Saved ₹${bestOffer.savings.toLocaleString('en-IN')})`
      ];
      await bestOffer.save();
    }
  }

  return generatedOffers;
}

function runNegotiationForSeller(seller, sellerRules, sellerProducts, sellerSlabs, request) {
  const reqItems = request.items || [];
  let totalListPrice = 0;
  let totalCostPrice = 0;

  for (const item of reqItems) {
    const prod = sellerProducts.find(p => p.name.toLowerCase().includes(item.item_name.toLowerCase()) || item.item_name.toLowerCase().includes(p.name.toLowerCase()));
    if (prod) {
      // Check MOQ
      const effectiveMOQ = prod.moq || 1;
      if (item.quantity < effectiveMOQ) {
        return {
          status: 'rejected',
          rejection_reason: `MOQ breach: Requested quantity (${item.quantity}) is below minimum order quantity (MOQ: ${effectiveMOQ}) for product "${prod.name}".`,
          rounds: [{ round_number: 1, calculated_price: 0, accepted: 0, rejection_reason: `Requested quantity below MOQ (${effectiveMOQ})` }]
        };
      }
      totalListPrice += (prod.price ?? prod.list_price) * item.quantity;
      totalCostPrice += (prod.costPrice ?? prod.cost_price ?? ((prod.price ?? prod.list_price) * 0.7)) * item.quantity;
    }
  }

  const rulesObj = sellerRules || {};
  const maxDiscountPct = rulesObj.maximumDiscountPercent ?? rulesObj.max_discount_percent ?? 15.0;
  const maxDiscountAmt = rulesObj.maximumDiscountAmount ?? rulesObj.max_discount_amount ?? 20000.0;
  const marginFloorPct = rulesObj.marginFloorPercent ?? rulesObj.margin_floor_percent ?? 8.0;

  const initialMargin = totalListPrice > 0 ? roundToTwo(((totalListPrice - totalCostPrice) / totalListPrice) * 100) : 0;
  if (initialMargin < marginFloorPct) {
    return {
      status: 'rejected',
      rejection_reason: `Margin floor breach: Product list price margin (${initialMargin}%) is below minimum required margin floor (${marginFloorPct}%).`,
      rounds: [{ round_number: 1, calculated_price: totalListPrice, accepted: 0, seller_margin_percent: initialMargin, rejection_reason: `Margin floor breach (${initialMargin}% < ${marginFloorPct}%)` }]
    };
  }

  // Margin Floor Price
  const marginFloorPrice = roundToTwo(totalCostPrice / (1 - Math.min(marginFloorPct, 95.0) / 100));

  // Max Discount Cap Price
  const maxDiscByPctPrice = roundToTwo(totalListPrice * (1 - maxDiscountPct / 100));
  const maxDiscByAmtPrice = roundToTwo(totalListPrice - maxDiscountAmt);
  const maxDiscountCapPrice = Math.max(maxDiscByPctPrice, maxDiscByAmtPrice);

  const effectiveMinPrice = Math.max(marginFloorPrice, maxDiscountCapPrice);

  let currentPrice = totalListPrice;
  const rounds = [];
  let status = 'rejected';
  let rejectionReason = null;

  // Round 1: Volume Slab (Explicit Slabs Only - Both camelCase and snake_case supported)
  let slabDiscountPct = 0;
  let matchingSlab = null;
  let explicitBulkDiscountFound = false;

  const primaryItem = reqItems[0];
  const primaryProd = primaryItem ? sellerProducts.find(p => p.name.toLowerCase().includes(primaryItem.item_name.toLowerCase()) || primaryItem.item_name.toLowerCase().includes(p.name.toLowerCase())) : null;
  const primaryMOQ = primaryProd ? (primaryProd.moq || 1) : 1;
  const primaryQty = primaryItem?.quantity || 1;

  const allSlabs = (sellerSlabs && sellerSlabs.length > 0)
    ? sellerSlabs
    : (rulesObj.bulkDiscountRules || rulesObj.bulk_discount_rules || []);

  if (Array.isArray(allSlabs) && allSlabs.length > 0) {
    for (const s of allSlabs) {
      const minQ = s.minQuantity ?? s.min_quantity;
      const maxQ = (s.maxQuantity !== null && s.maxQuantity !== undefined && s.maxQuantity !== '') ? (s.maxQuantity ?? s.max_quantity) : null;
      const discPct = s.discountPercent ?? s.discount_percent ?? 0;
      if (minQ && reqItems.some(i => i.quantity >= minQ && (!maxQ || i.quantity <= maxQ))) {
        if (discPct > slabDiscountPct) {
          slabDiscountPct = discPct;
          matchingSlab = { min_quantity: minQ, max_quantity: maxQ, discount_percent: discPct };
        }
        explicitBulkDiscountFound = true;
      }
    }
  }

  slabDiscountPct = Math.min(slabDiscountPct, maxDiscountPct);

  let r1Price = roundToTwo(totalListPrice * (1 - slabDiscountPct / 100));
  if (r1Price < effectiveMinPrice) {
    r1Price = effectiveMinPrice;
  }

  const r1Margin = r1Price > 0 ? roundToTwo(((r1Price - totalCostPrice) / r1Price) * 100) : 0;
  const r1DiscAmt = roundToTwo(totalListPrice - r1Price);

  let r1Explanation = '';
  if (explicitBulkDiscountFound && r1DiscAmt > 0) {
    r1Explanation = `Bulk discount: Qualified for seller's ${matchingSlab.min_quantity}+ unit slab — ${matchingSlab.discount_percent}%.`;
  } else if (explicitBulkDiscountFound && r1DiscAmt === 0) {
    r1Explanation = `Bulk discount: Qualified for volume discount (${matchingSlab.discount_percent}%) but capped at ₹0 by seller margin floor (${marginFloorPct}%).`;
  } else {
    r1Explanation = `Bulk discount: No bulk discount applied because no qualifying bulk discount rule is configured.`;
  }

  if (r1Margin < marginFloorPct || r1DiscAmt > maxDiscountAmt) {
    return {
      status: 'rejected',
      rejection_reason: `Margin floor breach: Calculated margin (${r1Margin}%) is below minimum required margin floor (${marginFloorPct}%).`,
      rounds: [{ round_number: 1, calculated_price: r1Price, accepted: 0, seller_margin_percent: r1Margin, explanation: r1Explanation }]
    };
  }

  rounds.push({
    round_number: 1,
    lever_applied: explicitBulkDiscountFound ? 'Configured Seller Bulk Discount Rule' : 'Volume Quantity Discount',
    calculated_price: r1Price,
    discount_percent: r1DiscAmt > 0 ? roundToTwo((r1DiscAmt / totalListPrice) * 100) : 0,
    total_discount_amount: r1DiscAmt,
    seller_margin_percent: r1Margin,
    accepted: r1DiscAmt > 0 ? 1 : 0,
    explanation: r1Explanation
  });

  currentPrice = r1Price;

  // Round 2: Advance Payment
  const isAdvance = Boolean(
    request.isAdvancePayment ||
    request.is_advance_payment ||
    (request.raw_prompt && request.raw_prompt.toLowerCase().includes('advance')) ||
    (request.rawPrompt && request.rawPrompt.toLowerCase().includes('advance'))
  );
  const advDiscountPct = rulesObj.earlyPaymentDiscount ?? rulesObj.early_payment_discount ?? rulesObj.advance_pay_extra_discount_percent ?? 0;

  let r2Price = currentPrice;
  let r2DiscAmt = 0;
  let isR2Applied = false;
  let r2Explanation = '';

  if (isAdvance && advDiscountPct > 0) {
    let r2Calc = roundToTwo(currentPrice * (1 - advDiscountPct / 100));
    if (r2Calc < effectiveMinPrice) r2Calc = effectiveMinPrice;

    r2DiscAmt = roundToTwo(currentPrice - r2Calc);
    r2Price = r2Calc;
    isR2Applied = r2DiscAmt > 0;

    if (isR2Applied) {
      r2Explanation = `Advance payment discount: Qualified for 100% advance payment discount of ${advDiscountPct}%.`;
    } else {
      r2Explanation = `Advance payment discount: Qualified for ${advDiscountPct}% advance payment discount but capped by seller minimum price floor / margin floor.`;
    }
  } else if (!isAdvance) {
    r2Explanation = `Advance payment discount: Not applied because upfront payment terms were not requested by buyer.`;
  } else {
    r2Explanation = `Advance payment discount: Not applied because seller has no active advance payment discount policy.`;
  }

  const r2Margin = r2Price > 0 ? roundToTwo(((r2Price - totalCostPrice) / r2Price) * 100) : 0;

  rounds.push({
    round_number: 2,
    lever_applied: '100% Advance Payment Discount',
    calculated_price: r2Price,
    discount_percent: isR2Applied ? advDiscountPct : 0,
    total_discount_amount: r2DiscAmt,
    seller_margin_percent: r2Margin,
    accepted: isR2Applied ? 1 : 0,
    explanation: r2Explanation
  });

  currentPrice = r2Price;

  // Round 3: Extended Lead Time
  const reqDeadline = request.deadlineDays || request.deadline_days || 14;
  const leadDiscountMaxPct = rulesObj.leadTimeExtraDiscount ?? rulesObj.lead_time_extra_discount ?? rulesObj.lead_time_extra_discount_percent ?? 0;
  const leadExtDaysConfig = rulesObj.leadTimeExtensionDays ?? rulesObj.max_lead_time_extension_days ?? rulesObj.lead_time_extension_days ?? 7;
  const stdLeadDays = rulesObj.standardLeadTimeDays ?? rulesObj.standard_lead_time_days ?? sellerProducts[0]?.standardLeadTimeDays ?? sellerProducts[0]?.standard_lead_time_days ?? 3;

  let r3Price = currentPrice;
  let r3DiscAmt = 0;
  let isR3Applied = false;
  let r3Explanation = '';
  const extraDaysGiven = reqDeadline > stdLeadDays ? (reqDeadline - stdLeadDays) : 0;

  if (extraDaysGiven > 0 && leadDiscountMaxPct > 0) {
    let effectiveLeadDiscountPct = roundToTwo(
      Math.min(leadDiscountMaxPct, (extraDaysGiven / Math.max(1, leadExtDaysConfig)) * leadDiscountMaxPct)
    );
    effectiveLeadDiscountPct = Math.max(0.5, effectiveLeadDiscountPct);

    let r3Calc = roundToTwo(currentPrice * (1 - effectiveLeadDiscountPct / 100));
    if (r3Calc < effectiveMinPrice) r3Calc = effectiveMinPrice;

    r3DiscAmt = roundToTwo(currentPrice - r3Calc);
    r3Price = r3Calc;
    isR3Applied = r3DiscAmt > 0;

    if (isR3Applied) {
      r3Explanation = `Delivery discount: Qualified for flexible delivery discount (${effectiveLeadDiscountPct}% for ${extraDaysGiven} days extra delivery window).`;
    } else {
      r3Explanation = `Delivery discount: Qualified for ${effectiveLeadDiscountPct}% delivery extension discount but capped by seller minimum price floor / margin floor.`;
    }
  } else if (leadDiscountMaxPct === 0) {
    r3Explanation = `Delivery discount: Not applied because seller has no active flexible delivery discount policy.`;
  } else {
    r3Explanation = `Delivery discount: Not applied because buyer delivery timeframe (${reqDeadline} days) does not exceed standard lead time (${stdLeadDays} days).`;
  }

  const r3Margin = r3Price > 0 ? roundToTwo(((r3Price - totalCostPrice) / r3Price) * 100) : 0;

  rounds.push({
    round_number: 3,
    lever_applied: `Extended Delivery Window (+${extraDaysGiven} Days)`,
    calculated_price: r3Price,
    discount_percent: isR3Applied ? roundToTwo((r3DiscAmt / r2Price) * 100) : 0,
    total_discount_amount: r3DiscAmt,
    seller_margin_percent: r3Margin,
    accepted: isR3Applied ? 1 : 0,
    explanation: r3Explanation
  });

  currentPrice = r3Price;

  const targetBudget = request.targetBudget ?? request.total_budget ?? Infinity;
  if (currentPrice <= targetBudget) {
    status = 'agreed';
  } else {
    status = 'rejected';
    rejectionReason = `Final price ₹${currentPrice} exceeds buyer target budget ₹${targetBudget}`;
  }

  const totalRequestedUnits = reqItems.reduce((s, i) => s + (i.quantity || 1), 0);
  const qtyAboveMoq = Math.max(0, primaryQty - primaryMOQ);

  const totalDiscAmount = roundToTwo(r1DiscAmt + r2DiscAmt + r3DiscAmt);

  const discount_breakdown = {
    total_requested_units: totalRequestedUnits,
    list_price_total: totalListPrice,
    bulk_discount: {
      applied: Boolean(r1DiscAmt > 0),
      percent: r1DiscAmt > 0 ? roundToTwo((r1DiscAmt / totalListPrice) * 100) : 0,
      amount: r1DiscAmt,
      explanation: r1Explanation,
      reason: r1Explanation,
      moq: primaryMOQ,
      qtyAboveMoq
    },
    lead_time_discount: {
      applied: isR3Applied,
      percent: isR3Applied ? roundToTwo((r3DiscAmt / r2Price) * 100) : 0,
      amount: r3DiscAmt,
      explanation: r3Explanation,
      reason: r3Explanation,
      extraDays: extraDaysGiven
    },
    advance_pay_discount: {
      applied: isR2Applied,
      percent: isR2Applied ? advDiscountPct : 0,
      amount: r2DiscAmt,
      explanation: r2Explanation,
      reason: r2Explanation
    },
    total_discount_amount: totalDiscAmount,
    final_negotiated_total: roundToTwo(totalListPrice - totalDiscAmount)
  };

  return {
    status,
    final_price: currentPrice,
    rounds,
    discount_breakdown,
    rejection_reason: rejectionReason
  };
}

module.exports = {
  roundToTwo,
  processRequirementMatchingAndNegotiation,
  runNegotiationForSeller
};
