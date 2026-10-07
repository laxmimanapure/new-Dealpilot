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

  const generatedOffers = [];

  for (const seller of sellers) {
    const sId = seller._id.toString();
    const sellerProds = sellerProductMap[sId] || [];

    // Find matching products for all items requested
    let allItemsMatched = true;
    let totalListPrice = 0;
    let totalCostPrice = 0;
    let totalMinAllowedPrice = 0;
    const matchedItems = [];

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

      const itemListPrice = roundToTwo(matchedProd.price * rItem.quantity);
      const itemCostPrice = roundToTwo(matchedProd.costPrice * rItem.quantity);
      
      // Determine product minimum price floor
      const minPricePerUnit = (rule && rule.minimumPrice !== undefined) ? rule.minimumPrice : (matchedProd.price * 0.85);
      const itemMinAllowedPrice = roundToTwo(minPricePerUnit * rItem.quantity);

      matchedItems.push({
        productId: matchedProd._id,
        name: matchedProd.name,
        quantity: rItem.quantity,
        unitListPrice: matchedProd.price,
        totalListPrice: itemListPrice,
        costPrice: itemCostPrice,
        minAllowedPrice: itemMinAllowedPrice,
        rule
      });

      totalListPrice += itemListPrice;
      totalCostPrice += itemCostPrice;
      totalMinAllowedPrice += itemMinAllowedPrice;
    }

    if (!allItemsMatched || matchedItems.length === 0) {
      continue; // Seller cannot fulfill complete requirement
    }

    // Run deterministic multi-lever negotiation for this seller's products
    let currentPrice = totalListPrice;
    let currentLeadTime = 7;
    const rounds = [];
    let isAgreed = false;
    let rejectionReason = null;

    // Round 1: Volume / Bulk Discount
    let round1DiscountPct = 5.0;
    let round1Price = roundToTwo(totalListPrice * (1 - round1DiscountPct / 100));

    // Check minimum price floor constraint across products
    if (round1Price < totalMinAllowedPrice) {
      round1Price = totalMinAllowedPrice;
    }

    rounds.push({
      round_number: 1,
      lever_applied: 'Volume Quantity Discount',
      calculated_price: round1Price,
      discount_percent: roundToTwo(((totalListPrice - round1Price) / totalListPrice) * 100),
      total_discount_amount: roundToTwo(totalListPrice - round1Price),
      seller_margin_percent: roundToTwo(((round1Price - totalCostPrice) / round1Price) * 100),
      accepted: 1,
      explanation: `Applied volume bulk discount of ${round1DiscountPct}% while enforcing product minimum price floors.`
    });

    currentPrice = round1Price;

    if (currentPrice <= requirement.targetBudget) {
      isAgreed = true;
    } else {
      // Round 2: Early Payment Discount
      const round2DiscountPct = 2.0;
      let round2Price = roundToTwo(currentPrice * (1 - round2DiscountPct / 100));

      if (round2Price < totalMinAllowedPrice) {
        round2Price = totalMinAllowedPrice;
      }

      rounds.push({
        round_number: 2,
        lever_applied: '100% Advance Payment Discount',
        calculated_price: round2Price,
        discount_percent: roundToTwo(((totalListPrice - round2Price) / totalListPrice) * 100),
        total_discount_amount: roundToTwo(totalListPrice - round2Price),
        seller_margin_percent: roundToTwo(((round2Price - totalCostPrice) / round2Price) * 100),
        accepted: 1,
        explanation: `Applied 2% advance payment incentive while maintaining seller margin floor.`
      });

      currentPrice = round2Price;
      if (currentPrice <= requirement.targetBudget) {
        isAgreed = true;
      } else {
        // Round 3: Extended Lead Time Discount
        const round3DiscountPct = 1.0;
        let round3Price = roundToTwo(currentPrice * (1 - round3DiscountPct / 100));
        
        if (round3Price < totalMinAllowedPrice) {
          round3Price = totalMinAllowedPrice;
        }

        currentLeadTime += 7;

        rounds.push({
          round_number: 3,
          lever_applied: 'Extended Delivery Window (+7 Days)',
          calculated_price: round3Price,
          discount_percent: roundToTwo(((totalListPrice - round3Price) / totalListPrice) * 100),
          total_discount_amount: roundToTwo(totalListPrice - round3Price),
          seller_margin_percent: roundToTwo(((round3Price - totalCostPrice) / round3Price) * 100),
          accepted: 1,
          explanation: `Agreed to extend delivery window for an extra 1% discount.`
        });

        currentPrice = round3Price;
        if (currentPrice <= requirement.targetBudget) {
          isAgreed = true;
        } else {
          rejectionReason = `Target budget of ₹${requirement.targetBudget.toLocaleString('en-IN')} is below seller minimum price floor of ₹${totalMinAllowedPrice.toLocaleString('en-IN')}`;
        }
      }
    }

    const savings = roundToTwo(totalListPrice - currentPrice);

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
      status: currentPrice <= requirement.targetBudget ? 'VALID' : 'OVER_BUDGET',
      rejectionReason: rejectionReason || null,
      negotiationRounds: rounds,
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
      rulesApplied: matchedItems.map(i => `Product rule enforced for ${i.name} (Min price ₹${i.minAllowedPrice})`),
      concessions: rounds.map(r => r.lever_applied),
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

  // 2. DYNAMIC RANKING & BEST DEAL SELECTION
  if (generatedOffers.length > 0) {
    // Sort valid offers by negotiatedAmount ascending (lowest cost first)
    const validOffers = generatedOffers.filter(o => o.status === 'VALID');
    
    let bestOffer = null;
    if (validOffers.length > 0) {
      validOffers.sort((a, b) => a.negotiatedAmount - b.negotiatedAmount);
      bestOffer = validOffers[0];
    } else {
      // If none under budget, sort by lowest negotiated amount overall
      generatedOffers.sort((a, b) => a.negotiatedAmount - b.negotiatedAmount);
      bestOffer = generatedOffers[0];
    }

    if (bestOffer) {
      const sellerDoc = await User.findById(bestOffer.sellerId).select('name companyName').lean();
      const sellerName = sellerDoc ? (sellerDoc.companyName || sellerDoc.name) : 'Matched Seller';

      bestOffer.isBestDeal = true;
      bestOffer.whyThisDeal = [
        `All ${reqItems.length} requested items fully available in stock`,
        bestOffer.status === 'VALID' ? `Within buyer target budget of ₹${requirement.targetBudget.toLocaleString('en-IN')}` : `Closest valid offer to buyer budget`,
        `All product-specific pricing floors & margin policies verified`,
        `Lowest valid negotiated price of ₹${bestOffer.negotiatedAmount.toLocaleString('en-IN')} (Saved ₹${bestOffer.savings.toLocaleString('en-IN')})`
      ];
      await bestOffer.save();

      await logAuditEvent({
        requestId: requirement._id,
        userId: requirement.buyerId,
        actor: 'Ranking Engine',
        action: 'BEST_DEAL_RANKED',
        details: { winningSeller: sellerName, finalPrice: bestOffer.negotiatedAmount, savings: bestOffer.savings },
        policyResult: 'APPROVED'
      });
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
      totalListPrice += prod.list_price * item.quantity;
      totalCostPrice += prod.cost_price * item.quantity;
    }
  }

  const maxDiscountPct = sellerRules.max_discount_percent || 15.0;
  const maxDiscountAmt = sellerRules.max_discount_amount || 20000.0;
  const marginFloorPct = sellerRules.margin_floor_percent || 8.0;

  let currentPrice = totalListPrice;
  const rounds = [];
  let status = 'rejected';
  let rejectionReason = null;

  // Round 1: Volume Slab
  const slabDiscountPct = 5.0;
  let r1Price = roundToTwo(totalListPrice * (1 - slabDiscountPct / 100));
  const r1Margin = roundToTwo(((r1Price - totalCostPrice) / r1Price) * 100);
  const r1DiscPct = roundToTwo(((totalListPrice - r1Price) / totalListPrice) * 100);
  const r1DiscAmt = roundToTwo(totalListPrice - r1Price);

  if (r1Margin < marginFloorPct || r1DiscPct > maxDiscountPct || r1DiscAmt > maxDiscountAmt) {
    return {
      status: 'rejected',
      rejection_reason: `Margin floor breach: Calculated margin (${r1Margin}%) is below minimum required margin floor (${marginFloorPct}%).`,
      rounds: [{ round_number: 1, calculated_price: r1Price, accepted: 0, seller_margin_percent: r1Margin }]
    };
  }

  rounds.push({
    round_number: 1,
    lever_applied: 'Volume Quantity Discount',
    calculated_price: r1Price,
    discount_percent: r1DiscPct,
    total_discount_amount: r1DiscAmt,
    seller_margin_percent: r1Margin,
    accepted: 1
  });

  currentPrice = r1Price;
  if (currentPrice <= request.total_budget) {
    status = 'agreed';
  } else {
    // Round 2: Advance Payment
    const advDiscountPct = sellerRules.advance_pay_extra_discount_percent || 2.0;
    let r2Price = roundToTwo(currentPrice * (1 - advDiscountPct / 100));
    const r2Margin = roundToTwo(((r2Price - totalCostPrice) / r2Price) * 100);
    const r2DiscPct = roundToTwo(((totalListPrice - r2Price) / totalListPrice) * 100);
    const r2DiscAmt = roundToTwo(totalListPrice - r2Price);

    if (r2Margin < marginFloorPct || r2DiscPct > maxDiscountPct || r2DiscAmt > maxDiscountAmt) {
      return {
        status: 'rejected',
        rejection_reason: `Margin floor breach: Calculated margin (${r2Margin}%) is below minimum required margin floor (${marginFloorPct}%).`,
        rounds
      };
    }

    rounds.push({
      round_number: 2,
      lever_applied: 'Advance Payment',
      calculated_price: r2Price,
      discount_percent: r2DiscPct,
      total_discount_amount: r2DiscAmt,
      seller_margin_percent: r2Margin,
      accepted: 1
    });

    currentPrice = r2Price;
    if (currentPrice <= request.total_budget) {
      status = 'agreed';
    } else {
      // Round 3: Extended Lead Time
      const leadDiscountPct = sellerRules.lead_time_extra_discount_percent || 1.0;
      let r3Price = roundToTwo(currentPrice * (1 - leadDiscountPct / 100));
      const r3Margin = roundToTwo(((r3Price - totalCostPrice) / r3Price) * 100);
      const r3DiscPct = roundToTwo(((totalListPrice - r3Price) / totalListPrice) * 100);
      const r3DiscAmt = roundToTwo(totalListPrice - r3Price);

      if (r3Margin < marginFloorPct || r3DiscPct > maxDiscountPct || r3DiscAmt > maxDiscountAmt) {
        return {
          status: 'rejected',
          rejection_reason: `Margin floor breach: Calculated margin (${r3Margin}%) is below minimum required margin floor (${marginFloorPct}%).`,
          rounds
        };
      }

      rounds.push({
        round_number: 3,
        lever_applied: 'Extended Delivery Window (+7 Days)',
        calculated_price: r3Price,
        discount_percent: r3DiscPct,
        total_discount_amount: r3DiscAmt,
        seller_margin_percent: r3Margin,
        accepted: 1
      });

      currentPrice = r3Price;
      if (currentPrice <= request.total_budget) {
        status = 'agreed';
      } else {
        status = 'rejected';
        rejectionReason = `Final price ₹${currentPrice} exceeds buyer target budget ₹${request.total_budget}`;
      }
    }
  }

  return {
    status,
    final_price: currentPrice,
    rounds,
    rejection_reason: rejectionReason
  };
}

module.exports = {
  roundToTwo,
  processRequirementMatchingAndNegotiation,
  runNegotiationForSeller
};
