const Product = require('../models/Product');
const ProductRule = require('../models/ProductRule');
const User = require('../models/User');
const SellerOffer = require('../models/SellerOffer');
const Negotiation = require('../models/Negotiation');
const { logAuditEvent } = require('./auditService');
const { calculateLandedCost, rankPlans } = require('./planComparator');

function roundToTwo(num) {
  return Math.round((Number(num || 0) + Number.EPSILON) * 100) / 100;
}

/**
 * Smart Text Normalization and Stemming Helper
 */
function normalizeText(text) {
  if (!text) return '';
  return String(text)
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(
      /\b(i|need|want|for|my|office|the|a|an|please|buy|purchase|looking|require|with|and|in|at|under|units|unit|pcs|pc|pieces|piece|items|item|deliver|delivery|days|day)\b/gi,
      ' '
    )
    .replace(/\s+/g, ' ')
    .trim();
}

function stemWord(word) {
  if (!word) return '';
  let w = String(word).toLowerCase();
  if (w === 'mice') return 'mouse';
  if (w === 'boxes') return 'box';
  if (w === 'benches') return 'bench';
  if (w.endsWith('ies')) return w.slice(0, -3) + 'y';
  if (w.endsWith('es') && !w.endsWith('ces') && !w.endsWith('ses')) return w.slice(0, -2);
  if (w.endsWith('s') && !w.endsWith('ss')) return w.slice(0, -1);
  return w;
}

function matchProductToItem(itemName, product) {
  const normQuery = normalizeText(itemName);
  const normProdName = normalizeText(product.name);
  const normProdCat = normalizeText(product.category || '');

  if (!normQuery || !normProdName) return { matches: false, score: 0 };

  // Direct substring matches
  if (normProdName.includes(normQuery) || normQuery.includes(normProdName)) {
    return { matches: true, score: 100 };
  }

  // Space-collapsed compound word match (e.g. "key boards" <-> "keyboard", "ear phones" <-> "earphones")
  const queryTokens = normQuery.split(' ').map(stemWord).filter(t => t.length > 1 || /\d/.test(t));
  const prodTokens = normProdName.split(' ').map(stemWord).filter(t => t.length > 1 || /\d/.test(t));
  const catTokens = normProdCat.split(' ').map(stemWord).filter(t => t.length > 1 || /\d/.test(t));

  const collapsedQuery = queryTokens.join('');
  const collapsedProd = prodTokens.join('');
  if (
    collapsedQuery.length >= 3 &&
    collapsedProd.length >= 3 &&
    (collapsedProd.includes(collapsedQuery) || collapsedQuery.includes(collapsedProd))
  ) {
    return { matches: true, score: 95 };
  }

  if (normProdCat && (normProdCat.includes(normQuery) || normQuery.includes(normProdCat))) {
    return { matches: true, score: 80 };
  }

  // Tokenized stemmed matching
  const allProdTokens = new Set([...prodTokens, ...catTokens]);

  let matchCount = 0;
  for (const qToken of queryTokens) {
    if (allProdTokens.has(qToken)) {
      matchCount++;
    } else {
      for (const pToken of allProdTokens) {
        if (pToken.includes(qToken) || qToken.includes(pToken)) {
          matchCount++;
          break;
        }
      }
    }
  }

  if (queryTokens.length > 0 && matchCount > 0) {
    const score = (matchCount / queryTokens.length) * 100;
    return { matches: true, score };
  }

  return { matches: false, score: 0 };
}

/**
 * Helper to compute a single product item's policy constraints and price floors
 */
function buildItemNegotiationProfile(prod, rule, requestedQty, fallbackSlabs = null) {
  const qty = Number(requestedQty || 1);
  const unitListPrice = Number(prod.price ?? prod.list_price ?? 0);
  const unitCostPrice = Number(prod.costPrice ?? prod.cost_price ?? (unitListPrice * 0.7));
  const itemListPrice = roundToTwo(unitListPrice * qty);
  const itemCostPrice = roundToTwo(unitCostPrice * qty);

  // Verify rule belongs to this product/seller if IDs are present on both
  let r = rule || {};
  if (
    (r.productId && prod._id && r.productId.toString() !== prod._id.toString()) ||
    (r.sellerId && prod.sellerId && r.sellerId.toString() !== prod.sellerId.toString())
  ) {
    r = {};
  }
  const maxDiscountPct = Number(r.maximumDiscountPercent ?? r.max_discount_percent ?? r.maxDiscountPercent ?? 15.0);
  const maxDiscountAmt = Number(r.maximumDiscountAmount ?? r.max_discount_amount ?? r.maxDiscountAmount ?? 20000.0);
  const marginFloorPct = Number(r.marginFloorPercent ?? r.margin_floor_percent ?? r.minMarginPercent ?? 8.0);
  const negotiationEnabled = r.negotiationEnabled !== false;
  const rawMaxRounds = r.maxRounds ?? r.max_rounds ?? 3;
  const maxRounds = negotiationEnabled ? Math.max(0, Number(rawMaxRounds)) : 0;

  const earlyPayDiscountPct = Number(
    r.earlyPaymentDiscount ?? r.early_payment_discount ?? r.advance_pay_extra_discount_percent ?? 0
  );
  const extraLeadDaysConfig = Number(
    r.leadTimeExtensionDays ?? r.max_lead_time_extension_days ?? r.lead_time_extension_days ?? 7
  );
  const leadTimeDiscountMaxPct = Number(
    r.leadTimeExtraDiscount ?? r.lead_time_extra_discount ?? r.lead_time_extra_discount_percent ?? 0
  );
  const standardLeadTimeDays = Number(
    prod.standardLeadTimeDays ?? prod.standard_lead_time_days ?? r.standardLeadTimeDays ?? r.standard_lead_time_days ?? 3
  );

  const minQtyRule = r.minimumQuantity ?? r.minimum_quantity ?? r.minOrderQuantity;
  const effectiveMOQ = (minQtyRule !== undefined && minQtyRule !== null)
    ? Math.max(Number(minQtyRule), Number(prod.moq || 1))
    : Number(prod.moq || 1);

  const maxQuantityRule = (r.maximumQuantity !== undefined && r.maximumQuantity !== null && r.maximumQuantity !== '')
    ? Number(r.maximumQuantity)
    : null;

  // Minimum unit price floor from explicit rule or product minPriceFloor
  const explicitMinUnit = (r.minimumPrice !== undefined && r.minimumPrice !== null)
    ? Number(r.minimumPrice)
    : (prod.minPriceFloor !== undefined && prod.minPriceFloor !== null ? Number(prod.minPriceFloor) : 0);
  const itemExplicitMinPrice = roundToTwo(explicitMinUnit * qty);

  // Margin floor price
  const itemMarginFloorPrice = roundToTwo(itemCostPrice / (1 - Math.min(marginFloorPct, 95.0) / 100));

  // Max discount caps for this item
  const itemMaxDiscByPctPrice = roundToTwo(itemListPrice * (1 - maxDiscountPct / 100));
  const itemMaxDiscByAmtPrice = Math.max(0, roundToTwo(itemListPrice - maxDiscountAmt));

  const effectiveMinAllowedPrice = roundToTwo(
    Math.max(
      itemCostPrice,
      itemExplicitMinPrice,
      itemMarginFloorPrice,
      itemMaxDiscByPctPrice,
      itemMaxDiscByAmtPrice
    )
  );

  const initialMarginPct = itemListPrice > 0
    ? roundToTwo(((itemListPrice - itemCostPrice) / itemListPrice) * 100)
    : 0;

  const slabs = Array.isArray(prod.slabs) && prod.slabs.length > 0
    ? prod.slabs
    : Array.isArray(r.bulkDiscountRules) && r.bulkDiscountRules.length > 0
    ? r.bulkDiscountRules
    : Array.isArray(r.bulk_discount_rules) && r.bulk_discount_rules.length > 0
    ? r.bulk_discount_rules
    : Array.isArray(r.priceSlabs) && r.priceSlabs.length > 0
    ? r.priceSlabs
    : (Array.isArray(fallbackSlabs) ? fallbackSlabs : []);

  return {
    productId: prod._id || prod.id,
    name: prod.name,
    quantity: qty,
    effectiveMOQ,
    maxQuantityRule,
    unitListPrice,
    unitCostPrice,
    totalListPrice: itemListPrice,
    costPrice: itemCostPrice,
    minAllowedPrice: effectiveMinAllowedPrice,
    effectiveMinAllowedPrice,
    initialMarginPct,
    marginFloorPct,
    maxDiscountPct,
    maxDiscountAmt,
    negotiationEnabled,
    maxRounds,
    earlyPayDiscountPct,
    extraLeadDaysConfig,
    leadTimeDiscountMaxPct,
    standardLeadTimeDays,
    slabs,
    rule: r,
    currentPrice: itemListPrice,
    r1Price: itemListPrice,
    r1DiscountAmt: 0,
    r2Price: itemListPrice,
    r2DiscountAmt: 0,
    r3Price: itemListPrice,
    r3DiscountAmt: 0,
    matchingSlab: null
  };
}

/**
 * Core Per-Item & Order-Level Multi-Round Negotiation Calculator
 * Shared between live processRequirementMatchingAndNegotiation and runNegotiationForSeller
 */
function executeMultiItemNegotiation(matchedItems, options) {
  const {
    isAdvancePayQualified,
    reqDeadlineDays,
    targetBudget,
    orderLevelMaxDiscountAmt = null
  } = options;

  const totalListPrice = roundToTwo(matchedItems.reduce((sum, i) => sum + i.totalListPrice, 0));
  const totalCostPrice = roundToTwo(matchedItems.reduce((sum, i) => sum + i.costPrice, 0));

  // Order-level minimum allowed price is the sum of each item's effective minimum allowed price,
  // also respecting any explicit order-level maxDiscountAmt cap if provided.
  let effectiveMinAllowedPrice = roundToTwo(
    matchedItems.reduce((sum, i) => sum + i.effectiveMinAllowedPrice, 0)
  );
  if (orderLevelMaxDiscountAmt !== null && orderLevelMaxDiscountAmt !== undefined && orderLevelMaxDiscountAmt > 0) {
    const orderMaxDiscFloor = Math.max(0, roundToTwo(totalListPrice - Number(orderLevelMaxDiscountAmt)));
    effectiveMinAllowedPrice = Math.max(effectiveMinAllowedPrice, orderMaxDiscFloor);
  }

  const effectiveMaxRounds = matchedItems.length > 0
    ? Math.max(...matchedItems.map(i => i.maxRounds))
    : 0;

  const stdLeadTime = matchedItems.length > 0
    ? Math.max(...matchedItems.map(i => i.standardLeadTimeDays || 3))
    : 3;

  let currentLeadTime = stdLeadTime;
  const rounds = [];

  const primaryItem = matchedItems[0];
  const primaryMOQ = primaryItem?.effectiveMOQ || 1;
  const primaryQty = primaryItem?.quantity || 1;

  // Helper to clamp item prices if an order-level maxDiscountAmt floor was triggered
  function enforceOrderFloorOnItems(priceField, discField, prevPriceField) {
    let sumPrice = roundToTwo(matchedItems.reduce((s, i) => s + i[priceField], 0));
    if (sumPrice < effectiveMinAllowedPrice) {
      let deficit = roundToTwo(effectiveMinAllowedPrice - sumPrice);
      for (let idx = matchedItems.length - 1; idx >= 0 && deficit > 0; idx--) {
        const it = matchedItems[idx];
        const maxIncrease = roundToTwo(it[prevPriceField] - it[priceField]);
        const addBack = Math.min(deficit, maxIncrease);
        if (addBack > 0) {
          it[priceField] = roundToTwo(it[priceField] + addBack);
          it[discField] = roundToTwo(it[prevPriceField] - it[priceField]);
          deficit = roundToTwo(deficit - addBack);
        }
      }
      sumPrice = roundToTwo(matchedItems.reduce((s, i) => s + i[priceField], 0));
    }
    return sumPrice;
  }

  // =========================================================================
  // ROUND 1: Per-Product Bulk Quantity Slab Discount
  // =========================================================================
  let round1Price = totalListPrice;
  let round1DiscountAmount = 0;
  let explicitBulkDiscountFound = false;
  let round1Explanation = '';
  const qualifiedSlabsInfo = [];

  if (effectiveMaxRounds >= 1) {
    for (const item of matchedItems) {
      if (item.maxRounds < 1 || !item.negotiationEnabled) {
        item.r1Price = item.totalListPrice;
        item.r1DiscountAmt = 0;
        item.currentPrice = item.r1Price;
        continue;
      }

      let itemBestDiscPct = 0;
      let itemBestSlab = null;

      if (Array.isArray(item.slabs) && item.slabs.length > 0) {
        for (const s of item.slabs) {
          const minQ = s.minQuantity ?? s.min_quantity;
          const maxQ = (s.maxQuantity !== null && s.maxQuantity !== undefined && s.maxQuantity !== '')
            ? (s.maxQuantity ?? s.max_quantity)
            : ((s.max_quantity !== null && s.max_quantity !== undefined && s.max_quantity !== '') ? s.max_quantity : null);
          const discPct = Number(s.discountPercent ?? s.discount_percent ?? 0);

          if (minQ !== undefined && minQ !== null && item.quantity >= Number(minQ) && (!maxQ || item.quantity <= Number(maxQ))) {
            if (discPct > itemBestDiscPct) {
              itemBestDiscPct = discPct;
              itemBestSlab = {
                minQuantity: Number(minQ),
                maxQuantity: maxQ !== null ? Number(maxQ) : null,
                discountPercent: discPct
              };
            }
          }
        }
      }

      if (itemBestSlab && itemBestDiscPct > 0) {
        explicitBulkDiscountFound = true;
        item.matchingSlab = itemBestSlab;
        qualifiedSlabsInfo.push({ item, slab: itemBestSlab });
      }

      const cappedItemDiscPct = Math.min(itemBestDiscPct, item.maxDiscountPct);
      let rawItemR1 = roundToTwo(item.totalListPrice * (1 - cappedItemDiscPct / 100));
      if (rawItemR1 < item.effectiveMinAllowedPrice) {
        rawItemR1 = item.effectiveMinAllowedPrice;
      }

      item.r1Price = rawItemR1;
      item.r1DiscountAmt = roundToTwo(item.totalListPrice - item.r1Price);
      item.currentPrice = item.r1Price;
    }

    round1Price = enforceOrderFloorOnItems('r1Price', 'r1DiscountAmt', 'totalListPrice');
    for (const item of matchedItems) {
      item.currentPrice = item.r1Price;
    }
    round1DiscountAmount = roundToTwo(totalListPrice - round1Price);

    if (explicitBulkDiscountFound && round1DiscountAmount > 0) {
      const firstQual = qualifiedSlabsInfo[0];
      if (matchedItems.length === 1 || qualifiedSlabsInfo.length === 1) {
        round1Explanation = `Bulk discount: Qualified for seller's ${firstQual.slab.minQuantity}+ unit slab — ${firstQual.slab.discountPercent}%.`;
      } else {
        const details = qualifiedSlabsInfo
          .map(q => `${q.item.name}: ${q.slab.minQuantity}+ unit slab (${q.slab.discountPercent}%)`)
          .join('; ');
        round1Explanation = `Bulk discount: Qualified for seller's ${firstQual.slab.minQuantity}+ unit slab — ${firstQual.slab.discountPercent}% (${details}).`;
      }
    } else if (explicitBulkDiscountFound && round1DiscountAmount === 0) {
      const firstQual = qualifiedSlabsInfo[0];
      round1Explanation = `Bulk discount: Qualified for volume discount (${firstQual.slab.discountPercent}%) but capped at ₹0 by seller margin floor (${firstQual.item.marginFloorPct}%) or minimum price floor.`;
    } else {
      round1Explanation = `Bulk discount: No bulk discount applied because no qualifying bulk discount rule is configured.`;
    }

    const round1MarginPct = round1Price > 0
      ? roundToTwo(((round1Price - totalCostPrice) / round1Price) * 100)
      : 0;

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
  } else {
    round1Explanation = `Bulk discount: Not applied because negotiation is disabled or maxRounds is 0.`;
  }

  let currentPrice = round1Price;

  // =========================================================================
  // ROUND 2: Advance Payment Discount (Per-Product Policy & Floor)
  // =========================================================================
  let round2Price = currentPrice;
  let round2DiscountAmount = 0;
  let isRound2Applied = false;
  let round2Explanation = '';
  const anyItemHasEarlyPayPolicy = matchedItems.some(i => i.earlyPayDiscountPct > 0);
  const configuredEarlyPayPct = matchedItems[0]?.earlyPayDiscountPct || 0;

  if (effectiveMaxRounds >= 2) {
    if (isAdvancePayQualified && anyItemHasEarlyPayPolicy) {
      for (const item of matchedItems) {
        if (item.maxRounds >= 2 && item.negotiationEnabled && item.earlyPayDiscountPct > 0 && item.currentPrice > item.effectiveMinAllowedPrice) {
          let rawItemR2 = roundToTwo(item.currentPrice * (1 - item.earlyPayDiscountPct / 100));
          if (rawItemR2 < item.effectiveMinAllowedPrice) {
            rawItemR2 = item.effectiveMinAllowedPrice;
          }
          item.r2Price = rawItemR2;
          item.r2DiscountAmt = roundToTwo(item.currentPrice - item.r2Price);
        } else {
          item.r2Price = item.currentPrice;
          item.r2DiscountAmt = 0;
        }
      }

      round2Price = enforceOrderFloorOnItems('r2Price', 'r2DiscountAmt', 'r1Price');
      for (const item of matchedItems) {
        item.currentPrice = item.r2Price;
      }
      round2DiscountAmount = roundToTwo(round1Price - round2Price);
      isRound2Applied = round2DiscountAmount > 0;

      if (isRound2Applied) {
        round2Explanation = `Advance payment discount: Qualified for 100% advance payment discount of ${configuredEarlyPayPct}%.`;
      } else {
        round2Explanation = `Advance payment discount: Qualified for ${configuredEarlyPayPct}% advance payment discount but capped by seller minimum price floor / margin floor.`;
      }
    } else {
      for (const item of matchedItems) {
        item.r2Price = item.currentPrice;
        item.r2DiscountAmt = 0;
      }
      if (!isAdvancePayQualified) {
        round2Explanation = `Advance payment discount: Not applied because upfront payment terms were not requested by buyer.`;
      } else {
        round2Explanation = `Advance payment discount: Not applied because seller has no active advance payment discount policy.`;
      }
    }

    const round2MarginPct = round2Price > 0
      ? roundToTwo(((round2Price - totalCostPrice) / round2Price) * 100)
      : 0;

    const effectiveR2Pct = isRound2Applied
      ? (matchedItems.every(i => i.earlyPayDiscountPct === configuredEarlyPayPct && i.r2Price > i.effectiveMinAllowedPrice)
          ? configuredEarlyPayPct
          : roundToTwo((round2DiscountAmount / round1Price) * 100))
      : 0;

    rounds.push({
      round_number: 2,
      lever_applied: '100% Advance Payment Discount',
      calculated_price: round2Price,
      discount_percent: effectiveR2Pct,
      total_discount_amount: round2DiscountAmount,
      seller_margin_percent: round2MarginPct,
      accepted: isRound2Applied ? 1 : 0,
      explanation: round2Explanation
    });
  } else {
    for (const item of matchedItems) {
      item.r2Price = item.currentPrice;
      item.r2DiscountAmt = 0;
    }
    round2Explanation = `Advance payment discount: Not applied because seller maximum negotiation rounds limit (${effectiveMaxRounds}) was reached.`;
  }

  currentPrice = round2Price;

  // =========================================================================
  // ROUND 3: Extended Delivery Window Discount (Per-Product Policy & Floor)
  // =========================================================================
  let round3Price = currentPrice;
  let round3DiscountAmount = 0;
  let isRound3Applied = false;
  let round3Explanation = '';
  const extraDaysGiven = reqDeadlineDays > stdLeadTime ? (reqDeadlineDays - stdLeadTime) : 0;
  const anyItemHasLeadPolicy = matchedItems.some(i => i.leadTimeDiscountMaxPct > 0);
  let reportedLeadPct = 0;

  if (effectiveMaxRounds >= 3) {
    if (extraDaysGiven > 0 && anyItemHasLeadPolicy) {
      for (const item of matchedItems) {
        const itemExtraDays = reqDeadlineDays > item.standardLeadTimeDays
          ? (reqDeadlineDays - item.standardLeadTimeDays)
          : 0;

        if (itemExtraDays > 0 && item.maxRounds >= 3 && item.negotiationEnabled && item.leadTimeDiscountMaxPct > 0 && item.currentPrice > item.effectiveMinAllowedPrice) {
          let effLeadPct = roundToTwo(
            Math.min(
              item.leadTimeDiscountMaxPct,
              (itemExtraDays / Math.max(1, item.extraLeadDaysConfig)) * item.leadTimeDiscountMaxPct
            )
          );
          effLeadPct = Math.min(item.leadTimeDiscountMaxPct, Math.max(0.5, effLeadPct));
          if (reportedLeadPct === 0) reportedLeadPct = effLeadPct;

          let rawItemR3 = roundToTwo(item.currentPrice * (1 - effLeadPct / 100));
          if (rawItemR3 < item.effectiveMinAllowedPrice) {
            rawItemR3 = item.effectiveMinAllowedPrice;
          }
          item.r3Price = rawItemR3;
          item.r3DiscountAmt = roundToTwo(item.currentPrice - item.r3Price);
        } else {
          item.r3Price = item.currentPrice;
          item.r3DiscountAmt = 0;
        }
      }

      round3Price = enforceOrderFloorOnItems('r3Price', 'r3DiscountAmt', 'r2Price');
      for (const item of matchedItems) {
        item.currentPrice = item.r3Price;
      }
      round3DiscountAmount = roundToTwo(round2Price - round3Price);
      isRound3Applied = round3DiscountAmount > 0;

      if (isRound3Applied) {
        currentLeadTime = reqDeadlineDays;
        const pctForMsg = reportedLeadPct || roundToTwo((round3DiscountAmount / round2Price) * 100);
        round3Explanation = `Delivery discount: Qualified for flexible delivery discount (${pctForMsg}% for ${extraDaysGiven} days extra delivery window).`;
      } else {
        round3Explanation = `Delivery discount: Qualified for ${reportedLeadPct}% delivery extension discount but capped by seller minimum price floor / margin floor.`;
      }
    } else {
      for (const item of matchedItems) {
        item.r3Price = item.currentPrice;
        item.r3DiscountAmt = 0;
      }
      if (!anyItemHasLeadPolicy) {
        round3Explanation = `Delivery discount: Not applied because seller has no active flexible delivery discount policy.`;
      } else {
        round3Explanation = `Delivery discount: Not applied because buyer delivery timeframe (${reqDeadlineDays} days) does not exceed standard lead time (${stdLeadTime} days).`;
      }
    }

    const round3MarginPct = round3Price > 0
      ? roundToTwo(((round3Price - totalCostPrice) / round3Price) * 100)
      : 0;

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
  } else {
    for (const item of matchedItems) {
      item.r3Price = item.currentPrice;
      item.r3DiscountAmt = 0;
    }
    round3Explanation = `Delivery discount: Not applied because seller maximum negotiation rounds limit (${effectiveMaxRounds}) was reached.`;
  }

  currentPrice = round3Price;

  const isAgreed = currentPrice <= targetBudget;
  const rejectionReason = isAgreed
    ? null
    : `Final negotiated price of ₹${currentPrice.toLocaleString('en-IN')} exceeds buyer target budget of ₹${targetBudget.toLocaleString('en-IN')}`;

  const totalDiscountAmount = roundToTwo(round1DiscountAmount + round2DiscountAmount + round3DiscountAmount);
  const totalRequestedUnits = matchedItems.reduce((s, i) => s + i.quantity, 0);
  const qtyAboveMoq = Math.max(0, primaryQty - primaryMOQ);

  const effectiveAdvPct = isRound2Applied
    ? (matchedItems.every(i => i.earlyPayDiscountPct === configuredEarlyPayPct && i.r2Price > i.effectiveMinAllowedPrice)
        ? configuredEarlyPayPct
        : roundToTwo((round2DiscountAmount / round1Price) * 100))
    : 0;

  return {
    totalListPrice,
    totalCostPrice,
    effectiveMinAllowedPrice,
    effectiveMaxRounds,
    currentPrice,
    currentLeadTime,
    rounds,
    isAgreed,
    rejectionReason,
    totalDiscountAmount,
    totalRequestedUnits,
    primaryMOQ,
    qtyAboveMoq,
    extraDaysGiven,
    round1DiscountAmount,
    round1Explanation,
    isRound2Applied,
    effectiveAdvPct,
    configuredEarlyPayPct,
    round2DiscountAmount,
    round2Explanation,
    isRound3Applied,
    round3DiscountAmount,
    round3Explanation,
    round2Price
  };
}

/**
 * Deterministic Product-Rule Matching & Negotiation Engine (Live Application Flow)
 */
async function processRequirementMatchingAndNegotiation(requirement) {
  const reqItems = requirement.items || [];
  if (reqItems.length === 0) {
    console.log(`⚠️ [MATCHING DIAGNOSTIC] Requirement ${requirement._id} has no requested items.`);
    return [];
  }

  // 1. Get all active seller products from MongoDB
  const activeProducts = await Product.find({ active: { $ne: false } }).lean();
  const activeSellersInDb = await User.find({ role: { $regex: /^seller$/i } }).lean();

  console.log(`\n===================================================`);
  console.log(`🔍 [MATCHING ENGINE DIAGNOSTIC START]`);
  console.log(`   Requirement ID: ${requirement._id}`);
  console.log(`   Buyer ID: ${requirement.buyerId}`);
  console.log(`   Raw Prompt: "${requirement.rawPrompt}"`);
  console.log(`   Target Budget: ₹${requirement.targetBudget}`);
  console.log(`   Deadline Days: ${requirement.deadlineDays || 14}`);
  console.log(`   Active Sellers in DB: ${activeSellersInDb.length}`);
  console.log(`   Active Products in DB: ${activeProducts.length}`);
  console.log(`   Requested Items (${reqItems.length}):`, JSON.stringify(reqItems));
  console.log(`===================================================`);

  if (activeProducts.length === 0 || activeSellersInDb.length === 0) {
    console.log(`⚠️ [MATCHING DIAGNOSTIC] No active products or sellers available in MongoDB.`);
    return [];
  }

  // Map products by sellerId string and by productId string
  const sellerProductMap = {};
  const productByIdMap = {};
  for (const prod of activeProducts) {
    if (prod._id) {
      productByIdMap[prod._id.toString()] = prod;
    }
    if (!prod.sellerId) continue;
    const sId = prod.sellerId.toString();
    if (!sellerProductMap[sId]) {
      sellerProductMap[sId] = [];
    }
    sellerProductMap[sId].push(prod);
  }

  // Find users who are registered sellers
  const sellerIds = Object.keys(sellerProductMap);
  const sellers = activeSellersInDb.filter(s => sellerIds.includes(s._id.toString()));

  // Purge any existing stale offers and negotiation logs for this requirement before recalculating
  await SellerOffer.deleteMany({ requirementId: requirement._id });
  await Negotiation.deleteMany({ requirementId: requirement._id });

  const generatedOffers = [];
  const sellerRulesMap = {};

  for (const seller of sellers) {
    const sId = seller._id.toString();
    const sellerProds = sellerProductMap[sId] || [];
    const sellerName = seller.companyName || seller.name || 'Seller';

    let moqBreachFound = false;
    let moqRejectionReason = '';
    let stockDeficitFound = false;
    let stockRejectionReason = '';
    let missingItemFound = false;
    let missingItemReason = '';
    let marginBreachFound = false;
    let marginRejectionReason = '';

    let totalListPrice = 0;
    const matchedItems = [];

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
      const reqProdIdStr = (rItem.productId || rItem.product_id) ? String(rItem.productId || rItem.product_id) : null;
      const refProd = reqProdIdStr ? productByIdMap[reqProdIdStr] : null;
      const effectiveSearchName = rItem.item_name || refProd?.name || '';

      const candidateMatches = sellerProds
        .map(p => {
          const pIdStr = p._id ? p._id.toString() : '';
          if (reqProdIdStr && pIdStr === reqProdIdStr) {
            return {
              prod: p,
              res: { matches: true, score: 1000, isExactProductId: true }
            };
          }
          const nameMatch = matchProductToItem(effectiveSearchName, p);
          const refMatch = refProd && refProd.name !== effectiveSearchName
            ? matchProductToItem(refProd.name, p)
            : { matches: false, score: 0 };
          const bestRes = refMatch.score > nameMatch.score ? refMatch : nameMatch;
          return {
            prod: p,
            res: { ...bestRes, isExactProductId: false }
          };
        })
        .filter(m => m.res.matches)
        .sort((a, b) => {
          // 1. Exact productId match takes top priority
          if (a.res.isExactProductId !== b.res.isExactProductId) {
            return a.res.isExactProductId ? -1 : 1;
          }
          // 2. Prefer candidate products that satisfy both stock and MOQ for the requested quantity
          const aFulfill = (Number(a.prod.stock ?? 0) >= Number(rItem.quantity) && Number(rItem.quantity) >= Number(a.prod.moq || 1)) ? 1 : 0;
          const bFulfill = (Number(b.prod.stock ?? 0) >= Number(rItem.quantity) && Number(rItem.quantity) >= Number(b.prod.moq || 1)) ? 1 : 0;
          if (aFulfill !== bFulfill) {
            return bFulfill - aFulfill;
          }
          // 3. Higher match score
          if (b.res.score !== a.res.score) {
            return b.res.score - a.res.score;
          }
          // 4. Lower unit list price
          return (Number(a.prod.price || 0)) - (Number(b.prod.price || 0));
        });

      const matchedProd = candidateMatches[0]?.prod;

      if (!matchedProd) {
        missingItemFound = true;
        missingItemReason = `Seller "${sellerName}" has no product matching requested item "${effectiveSearchName}".`;
        console.log(`   ❌ [Seller ${sellerName}] ${missingItemReason}`);
        continue;
      }

      if (matchedProd.stock < rItem.quantity) {
        stockDeficitFound = true;
        stockRejectionReason = `Stock deficit: Requested ${rItem.quantity} units of "${matchedProd.name}", but seller "${sellerName}" only has ${matchedProd.stock} units in stock.`;
        console.log(`   ❌ [Seller ${sellerName}] ${stockRejectionReason}`);
      }

      const rawRule = await ProductRule.findOne({ productId: matchedProd._id }).lean();
      const rule = (
        rawRule &&
        (!rawRule.sellerId || !matchedProd.sellerId || rawRule.sellerId.toString() === matchedProd.sellerId.toString())
      )
        ? rawRule
        : null;
      if (rule && !sellerRulesMap[sId]) {
        sellerRulesMap[sId] = rule;
      }

      const itemProfile = buildItemNegotiationProfile(matchedProd, rule, rItem.quantity);

      if (rItem.quantity < itemProfile.effectiveMOQ) {
        moqBreachFound = true;
        moqRejectionReason = `MOQ breach: Requested quantity (${rItem.quantity}) is below minimum order quantity (MOQ: ${itemProfile.effectiveMOQ}) for product "${matchedProd.name}".`;
        console.log(`   ❌ [Seller ${sellerName}] ${moqRejectionReason}`);
      } else if (itemProfile.maxQuantityRule !== null && rItem.quantity > itemProfile.maxQuantityRule) {
        moqBreachFound = true;
        moqRejectionReason = `Maximum quantity breach: Requested quantity (${rItem.quantity}) exceeds seller maximum order quantity (${itemProfile.maxQuantityRule}) for product "${matchedProd.name}".`;
        console.log(`   ❌ [Seller ${sellerName}] ${moqRejectionReason}`);
      }

      if (itemProfile.initialMarginPct < itemProfile.marginFloorPct) {
        marginBreachFound = true;
        marginRejectionReason = `Margin floor breach: Product "${matchedProd.name}" list price margin (${itemProfile.initialMarginPct}%) is below minimum required margin floor (${itemProfile.marginFloorPct}%).`;
        console.log(`   ❌ [Seller ${sellerName}] ${marginRejectionReason}`);
      } else if (itemProfile.effectiveMinAllowedPrice > itemProfile.totalListPrice) {
        marginBreachFound = true;
        marginRejectionReason = `Policy floor breach: Configured minimum price floor (₹${itemProfile.effectiveMinAllowedPrice}) exceeds list price (₹${itemProfile.totalListPrice}) for product "${matchedProd.name}".`;
        console.log(`   ❌ [Seller ${sellerName}] ${marginRejectionReason}`);
      }

      matchedItems.push(itemProfile);
      totalListPrice = roundToTwo(totalListPrice + itemProfile.totalListPrice);
    }

    if (matchedItems.length === 0) {
      console.log(`   ⚠️ [Seller ${sellerName}] Rejection: 0 candidate products matched prompt items.`);
      continue;
    }

    // Handle Stock Deficit, Missing Items, MOQ Breach, or Policy Margin Floor Breach
    if (stockDeficitFound || missingItemFound || moqBreachFound || marginBreachFound) {
      const rejReason = stockDeficitFound
        ? stockRejectionReason
        : missingItemFound
        ? missingItemReason
        : moqBreachFound
        ? moqRejectionReason
        : marginRejectionReason;

      const leverName = stockDeficitFound || missingItemFound
        ? 'Catalog & Stock Validation'
        : moqBreachFound
        ? 'MOQ Validation Check'
        : 'Seller Margin & Policy Floor Validation';

      const minAllowedSum = roundToTwo(matchedItems.reduce((s, i) => s + i.effectiveMinAllowedPrice, 0));

      const offer = await SellerOffer.create({
        requirementId: requirement._id,
        sellerId: seller._id,
        items: matchedItems.map(i => ({
          productId: i.productId,
          name: i.name,
          quantity: i.quantity,
          unitListPrice: i.unitListPrice,
          totalListPrice: i.totalListPrice,
          unitNegotiatedPrice: i.unitListPrice,
          totalNegotiatedPrice: i.totalListPrice,
          minAllowedPrice: i.effectiveMinAllowedPrice
        })),
        originalAmount: totalListPrice,
        negotiatedAmount: totalListPrice,
        minAllowedPrice: minAllowedSum,
        landedCost: totalListPrice,
        landedCostBreakdown: {
          negotiatedPrice: totalListPrice,
          deliveryCharge: 0,
          financingCost: 0,
          earlyPaymentBenefit: 0,
          totalLandedCost: totalListPrice,
          leadTimeDays: 7
        },
        savings: 0,
        leadTimeDays: 7,
        status: 'REJECTED',
        rejectionReason: rejReason,
        negotiationRounds: [{
          round_number: 1,
          lever_applied: leverName,
          calculated_price: totalListPrice,
          accepted: 0,
          rejection_reason: rejReason,
          explanation: rejReason
        }],
        isBestDeal: false,
        isFastestDelivery: false,
        whyThisDeal: []
      });

      await Negotiation.create({
        requirementId: requirement._id,
        sellerId: seller._id,
        buyerId: requirement.buyerId,
        originalPrice: totalListPrice,
        negotiatedPrice: totalListPrice,
        rulesApplied: [rejReason],
        concessions: [],
        status: 'REJECTED',
        rounds: offer.negotiationRounds
      });

      await logAuditEvent({
        requestId: requirement._id,
        userId: requirement.buyerId,
        actor: `DealPilot Engine`,
        action: 'SELLER_OFFER_REJECTED_BY_POLICY',
        details: { sellerName, originalAmount: totalListPrice, status: 'REJECTED', reason: rejReason },
        policyResult: 'REJECTED'
      });

      generatedOffers.push(offer);
      console.log(`   📝 [Seller ${sellerName}] Offer created with REJECTED status. Reason: ${rejReason}`);
      continue;
    }

    const negResult = executeMultiItemNegotiation(matchedItems, {
      isAdvancePayQualified,
      reqDeadlineDays,
      targetBudget: requirement.targetBudget
    });

    const discountBreakdown = {
      totalRequestedUnits: negResult.totalRequestedUnits,
      listPriceTotal: negResult.totalListPrice,
      bulkDiscount: {
        applied: Boolean(negResult.round1DiscountAmount > 0),
        percent: negResult.round1DiscountAmount > 0
          ? roundToTwo((negResult.round1DiscountAmount / negResult.totalListPrice) * 100)
          : 0,
        amount: negResult.round1DiscountAmount,
        explanation: negResult.round1Explanation,
        reason: negResult.round1Explanation,
        moq: negResult.primaryMOQ,
        qtyAboveMoq: negResult.qtyAboveMoq
      },
      leadTimeDiscount: {
        applied: negResult.isRound3Applied,
        percent: negResult.isRound3Applied
          ? roundToTwo((negResult.round3DiscountAmount / negResult.round2Price) * 100)
          : 0,
        amount: negResult.round3DiscountAmount,
        explanation: negResult.round3Explanation,
        reason: negResult.round3Explanation,
        extraDays: negResult.extraDaysGiven
      },
      advancePayDiscount: {
        applied: negResult.isRound2Applied,
        percent: negResult.isRound2Applied ? negResult.effectiveAdvPct : 0,
        configuredPercent: negResult.configuredEarlyPayPct,
        amount: negResult.round2DiscountAmount,
        explanation: negResult.round2Explanation,
        reason: negResult.round2Explanation
      },
      totalDiscountAmount: negResult.totalDiscountAmount,
      finalNegotiatedTotal: roundToTwo(negResult.totalListPrice - negResult.totalDiscountAmount)
    };

    const landedCostBreakdown = calculateLandedCost(
      {
        final_price: negResult.currentPrice,
        final_lead_time: negResult.currentLeadTime,
        rounds: negResult.rounds,
        discountBreakdown
      },
      sellerRulesMap[sId] || {}
    );

    const offerStatus = negResult.isAgreed ? 'VALID' : 'OVER_BUDGET';

    const offer = await SellerOffer.create({
      requirementId: requirement._id,
      sellerId: seller._id,
      items: matchedItems.map(i => ({
        productId: i.productId,
        name: i.name,
        quantity: i.quantity,
        unitListPrice: i.unitListPrice,
        totalListPrice: i.totalListPrice,
        unitNegotiatedPrice: roundToTwo(i.currentPrice / i.quantity),
        totalNegotiatedPrice: i.currentPrice,
        minAllowedPrice: i.effectiveMinAllowedPrice
      })),
      originalAmount: negResult.totalListPrice,
      negotiatedAmount: negResult.currentPrice,
      minAllowedPrice: negResult.effectiveMinAllowedPrice,
      landedCost: landedCostBreakdown.totalLandedCost,
      landedCostBreakdown,
      savings: negResult.totalDiscountAmount,
      leadTimeDays: negResult.currentLeadTime,
      status: offerStatus,
      rejectionReason: negResult.rejectionReason || null,
      negotiationRounds: negResult.rounds,
      discountBreakdown,
      isBestDeal: false,
      isFastestDelivery: false,
      whyThisDeal: []
    });

    await Negotiation.create({
      requirementId: requirement._id,
      sellerId: seller._id,
      buyerId: requirement.buyerId,
      originalPrice: negResult.totalListPrice,
      negotiatedPrice: negResult.currentPrice,
      rulesApplied: matchedItems.map(
        i => `Product "${i.name}": enforced min price floor (₹${i.effectiveMinAllowedPrice}), margin floor (${i.marginFloorPct}%), max discount cap (${i.maxDiscountPct}% / ₹${i.maxDiscountAmt}), maxRounds (${i.maxRounds})`
      ),
      concessions: negResult.rounds.filter(r => r.accepted === 1).map(r => r.lever_applied),
      status: negResult.isAgreed ? 'AGREED' : 'REJECTED',
      rounds: negResult.rounds
    });

    await logAuditEvent({
      requestId: requirement._id,
      userId: requirement.buyerId,
      actor: `DealPilot Engine`,
      action: 'SELLER_MATCHED_AND_NEGOTIATED',
      details: {
        sellerName,
        originalAmount: negResult.totalListPrice,
        negotiatedAmount: negResult.currentPrice,
        landedCost: landedCostBreakdown.totalLandedCost,
        status: offer.status
      },
      policyResult: negResult.isAgreed ? 'APPROVED' : 'REJECTED'
    });

    generatedOffers.push(offer);
  }

  // DYNAMIC RANKING & BEST DEAL / FASTEST DELIVERY SELECTION VIA planComparator
  if (generatedOffers.length > 0) {
    const validOffers = generatedOffers.filter(o => o.status === 'VALID');

    if (validOffers.length > 0) {
      const rankingResult = rankPlans(validOffers, sellerRulesMap);
      const lowestCostId = rankingResult.lowestCostPlan?.session_id?.toString();
      const fastestDeliveryId = rankingResult.fastestDeliveryPlan?.session_id?.toString();

      for (const offer of validOffers) {
        const offerIdStr = offer._id.toString();
        const isLowest = offerIdStr === lowestCostId;
        const isFastest = offerIdStr === fastestDeliveryId;

        if (isLowest || isFastest) {
          offer.isBestDeal = isLowest;
          offer.isFastestDelivery = isFastest;
          offer.planType = isLowest && isFastest
            ? 'lowest_cost_and_fastest'
            : isLowest
            ? 'lowest_cost'
            : 'fastest_delivery';
          offer.planLabel = isLowest && isFastest
            ? 'Best Deal • Lowest Cost & Fastest Delivery'
            : isLowest
            ? 'Lowest Cost'
            : 'Fastest Delivery';

          const reasons = [
            `All ${offer.items.length} requested item(s) verified against product MOQ & available stock`,
            `Within buyer target budget of ₹${requirement.targetBudget.toLocaleString('en-IN')}`,
            `Seller margin floor, minimum price floor, and maximum discount caps verified`
          ];
          if (isLowest) {
            reasons.push(
              `Ranked #1 Lowest Landed Cost at ₹${(offer.landedCost || offer.negotiatedAmount).toLocaleString('en-IN')} (Negotiated: ₹${offer.negotiatedAmount.toLocaleString('en-IN')}, Saved ₹${offer.savings.toLocaleString('en-IN')})`
            );
          }
          if (isFastest) {
            reasons.push(`Ranked #1 Fastest Delivery with ${offer.leadTimeDays}-day lead time`);
          }
          offer.whyThisDeal = reasons;
          await offer.save();
        }
      }
    }

    // Deterministic sort of all offers: VALID first, OVER_BUDGET second, REJECTED last; then by landedCost, negotiatedAmount, leadTimeDays
    const statusPriority = { VALID: 0, OVER_BUDGET: 1, REJECTED: 2 };
    generatedOffers.sort((a, b) => {
      const pa = statusPriority[a.status] ?? 3;
      const pb = statusPriority[b.status] ?? 3;
      if (pa !== pb) return pa - pb;
      const la = a.landedCost ?? a.negotiatedAmount ?? 0;
      const lb = b.landedCost ?? b.negotiatedAmount ?? 0;
      if (la !== lb) return la - lb;
      if (a.negotiatedAmount !== b.negotiatedAmount) return a.negotiatedAmount - b.negotiatedAmount;
      return (a.leadTimeDays || 7) - (b.leadTimeDays || 7);
    });
  }

  return generatedOffers;
}

/**
 * Synchronous Policy Engine Entry Point (Used by Unit & Integration Tests)
 * Uses the exact same per-item buildItemNegotiationProfile & executeMultiItemNegotiation pipeline.
 */
function runNegotiationForSeller(seller, sellerRules, sellerProducts, sellerSlabs, request) {
  const reqItems = request.items || [];
  const rulesObj = sellerRules || {};
  const matchedItems = [];

  for (const item of reqItems) {
    const reqProdIdStr = (item.productId || item.product_id) ? String(item.productId || item.product_id) : null;
    const candidateMatches = (sellerProducts || [])
      .map(p => {
        const pIdStr = (p._id || p.id) ? String(p._id || p.id) : '';
        if (reqProdIdStr && pIdStr === reqProdIdStr) {
          return { prod: p, res: { matches: true, score: 1000, isExactProductId: true } };
        }
        const m = matchProductToItem(item.item_name, p);
        return { prod: p, res: { ...m, isExactProductId: false } };
      })
      .filter(m => m.res.matches)
      .sort((a, b) => {
        if (a.res.isExactProductId !== b.res.isExactProductId) {
          return a.res.isExactProductId ? -1 : 1;
        }
        const aFulfill = (Number(a.prod.stock ?? Infinity) >= Number(item.quantity) && Number(item.quantity) >= Number(a.prod.moq || 1)) ? 1 : 0;
        const bFulfill = (Number(b.prod.stock ?? Infinity) >= Number(item.quantity) && Number(item.quantity) >= Number(b.prod.moq || 1)) ? 1 : 0;
        if (aFulfill !== bFulfill) return bFulfill - aFulfill;
        if (b.res.score !== a.res.score) return b.res.score - a.res.score;
        return (Number(a.prod.price ?? a.prod.list_price ?? 0)) - (Number(b.prod.price ?? b.prod.list_price ?? 0));
      });

    const prod = candidateMatches[0]?.prod;
    if (!prod) {
      return {
        status: 'rejected',
        rejection_reason: `Missing product: Seller has no product matching "${item.item_name}".`,
        rounds: [{ round_number: 1, calculated_price: 0, accepted: 0, rejection_reason: `No matching product for "${item.item_name}"` }]
      };
    }

    if (prod.stock !== undefined && prod.stock !== null && Number(prod.stock) < Number(item.quantity)) {
      return {
        status: 'rejected',
        rejection_reason: `Stock deficit: Requested ${item.quantity} units of "${prod.name}", but seller only has ${prod.stock} units in stock.`,
        rounds: [{ round_number: 1, calculated_price: 0, accepted: 0, rejection_reason: `Insufficient stock (${prod.stock} < ${item.quantity})` }]
      };
    }

    const itemRule = prod.rule || prod.rules || rulesObj;
    const itemProfile = buildItemNegotiationProfile(prod, itemRule, item.quantity, sellerSlabs);

    if (item.quantity < itemProfile.effectiveMOQ) {
      return {
        status: 'rejected',
        rejection_reason: `MOQ breach: Requested quantity (${item.quantity}) is below minimum order quantity (MOQ: ${itemProfile.effectiveMOQ}) for product "${prod.name}".`,
        rounds: [{ round_number: 1, calculated_price: 0, accepted: 0, rejection_reason: `Requested quantity below MOQ (${itemProfile.effectiveMOQ})` }]
      };
    }

    if (itemProfile.maxQuantityRule !== null && item.quantity > itemProfile.maxQuantityRule) {
      return {
        status: 'rejected',
        rejection_reason: `Maximum quantity breach: Requested quantity (${item.quantity}) exceeds seller maximum order quantity (${itemProfile.maxQuantityRule}) for product "${prod.name}".`,
        rounds: [{ round_number: 1, calculated_price: 0, accepted: 0, rejection_reason: `Requested quantity exceeds max quantity (${itemProfile.maxQuantityRule})` }]
      };
    }

    if (itemProfile.initialMarginPct < itemProfile.marginFloorPct) {
      return {
        status: 'rejected',
        rejection_reason: `Margin floor breach: Product list price margin (${itemProfile.initialMarginPct}%) is below minimum required margin floor (${itemProfile.marginFloorPct}%).`,
        rounds: [{ round_number: 1, calculated_price: itemProfile.totalListPrice, accepted: 0, seller_margin_percent: itemProfile.initialMarginPct, rejection_reason: `Margin floor breach (${itemProfile.initialMarginPct}% < ${itemProfile.marginFloorPct}%)` }]
      };
    }

    matchedItems.push(itemProfile);
  }

  const isAdvancePayQualified = Boolean(
    request.isAdvancePayment ||
    request.is_advance_payment ||
    (request.raw_prompt && request.raw_prompt.toLowerCase().includes('advance')) ||
    (request.rawPrompt && request.rawPrompt.toLowerCase().includes('advance'))
  );

  const reqDeadlineDays = request.deadlineDays || request.deadline_days || 14;
  const targetBudget = request.targetBudget ?? request.total_budget ?? Infinity;
  const orderLevelMaxDiscountAmt = rulesObj.maximumDiscountAmount ?? rulesObj.max_discount_amount ?? null;

  const negResult = executeMultiItemNegotiation(matchedItems, {
    isAdvancePayQualified,
    reqDeadlineDays,
    targetBudget,
    orderLevelMaxDiscountAmt
  });

  const status = negResult.isAgreed ? 'agreed' : 'rejected';
  const rejectionReason = negResult.isAgreed
    ? null
    : `Final price ₹${negResult.currentPrice} exceeds buyer target budget ₹${targetBudget}`;

  const discount_breakdown = {
    total_requested_units: negResult.totalRequestedUnits,
    list_price_total: negResult.totalListPrice,
    bulk_discount: {
      applied: Boolean(negResult.round1DiscountAmount > 0),
      percent: negResult.round1DiscountAmount > 0
        ? roundToTwo((negResult.round1DiscountAmount / negResult.totalListPrice) * 100)
        : 0,
      amount: negResult.round1DiscountAmount,
      explanation: negResult.round1Explanation,
      reason: negResult.round1Explanation,
      moq: negResult.primaryMOQ,
      qtyAboveMoq: negResult.qtyAboveMoq
    },
    lead_time_discount: {
      applied: negResult.isRound3Applied,
      percent: negResult.isRound3Applied
        ? roundToTwo((negResult.round3DiscountAmount / negResult.round2Price) * 100)
        : 0,
      amount: negResult.round3DiscountAmount,
      explanation: negResult.round3Explanation,
      reason: negResult.round3Explanation,
      extraDays: negResult.extraDaysGiven
    },
    advance_pay_discount: {
      applied: negResult.isRound2Applied,
      percent: negResult.isRound2Applied ? negResult.effectiveAdvPct : 0,
      configured_percent: negResult.configuredEarlyPayPct,
      amount: negResult.round2DiscountAmount,
      explanation: negResult.round2Explanation,
      reason: negResult.round2Explanation
    },
    total_discount_amount: negResult.totalDiscountAmount,
    final_negotiated_total: roundToTwo(negResult.totalListPrice - negResult.totalDiscountAmount)
  };

  return {
    status,
    final_price: negResult.currentPrice,
    final_lead_time: negResult.currentLeadTime,
    min_allowed_price: negResult.effectiveMinAllowedPrice,
    items: matchedItems.map(i => ({
      productId: i.productId,
      name: i.name,
      quantity: i.quantity,
      unit_list_price: i.unitListPrice,
      total_list_price: i.totalListPrice,
      unit_negotiated_price: roundToTwo(i.currentPrice / i.quantity),
      total_negotiated_price: i.currentPrice,
      min_allowed_price: i.effectiveMinAllowedPrice
    })),
    rounds: negResult.rounds,
    discount_breakdown,
    rejection_reason: rejectionReason
  };
}

module.exports = {
  roundToTwo,
  normalizeText,
  stemWord,
  matchProductToItem,
  buildItemNegotiationProfile,
  executeMultiItemNegotiation,
  processRequirementMatchingAndNegotiation,
  runNegotiationForSeller
};
