/**
 * DealPilot Procure - Plan Comparator Engine
 * Evaluates agreed negotiation sessions and computes Landed Cost & Plan Ranking.
 * 
 * Landed Cost Formula:
 * Landed cost = negotiated_price + delivery_charge + financing_cost_of_advance_payment - early_payment_benefit
 */

function roundToTwo(num) {
  return Math.round((Number(num || 0) + Number.EPSILON) * 100) / 100;
}

function calculateLandedCost(session, sellerRules = {}) {
  const negotiatedPrice = roundToTwo(
    session?.final_price ?? session?.negotiatedAmount ?? session?.negotiated_amount ?? 0
  );
  const deliveryCharge = roundToTwo(
    sellerRules?.delivery_fee ??
    sellerRules?.deliveryFee ??
    session?.delivery_charge ??
    session?.deliveryCharge ??
    0
  );

  const rounds = session?.rounds || session?.negotiationRounds || [];
  const hasAdvancePay = Boolean(
    session?.discountBreakdown?.advancePayDiscount?.applied ||
    session?.discount_breakdown?.advance_pay_discount?.applied ||
    rounds.some(r => Number(r.accepted) === 1 && r.lever_applied && String(r.lever_applied).includes('Advance Payment'))
  );

  // Financing cost calculation: ~10% per annum cost of capital over lead time
  const annualInterestRate = Number(sellerRules?.annual_interest_rate ?? sellerRules?.annualInterestRate ?? 0.10);
  const leadTimeDays = Number(
    session?.final_lead_time ?? session?.leadTimeDays ?? session?.lead_time_days ?? 7
  );

  const financingCost = hasAdvancePay
    ? roundToTwo(negotiatedPrice * annualInterestRate * (leadTimeDays / 365))
    : 0;

  // Early payment benefit (0.5% of order if paid in advance)
  const earlyPaymentBenefit = hasAdvancePay
    ? roundToTwo(negotiatedPrice * 0.005)
    : 0;

  const totalLandedCost = roundToTwo(negotiatedPrice + deliveryCharge + financingCost - earlyPaymentBenefit);

  return {
    negotiatedPrice,
    deliveryCharge,
    financingCost,
    earlyPaymentBenefit,
    totalLandedCost,
    leadTimeDays
  };
}

function rankPlans(agreedSessions, sellerRulesMap = {}) {
  if (!agreedSessions || agreedSessions.length === 0) {
    return {
      lowestCostPlan: null,
      fastestDeliveryPlan: null,
      allPlans: []
    };
  }

  const evaluatedPlans = agreedSessions.map(session => {
    const sellerId = (session.seller_id ?? session.sellerId?._id ?? session.sellerId ?? '').toString();
    const sessionId = (session.id ?? session._id ?? session.offer_id ?? sellerId).toString();
    const rules = sellerRulesMap[sellerId] || sellerRulesMap[session.seller_id] || session.sellerRules || {};
    const costBreakdown = calculateLandedCost(session, rules);

    const baseListPrice = roundToTwo(
      session.base_list_price ?? session.originalAmount ?? session.original_amount ?? costBreakdown.negotiatedPrice
    );
    const totalSavings = roundToTwo(baseListPrice - costBreakdown.negotiatedPrice);
    const savingsPercent = baseListPrice > 0
      ? Math.round(((baseListPrice - costBreakdown.negotiatedPrice) / baseListPrice) * 10000) / 100
      : 0;

    return {
      seller_id: session.seller_id ?? session.sellerId?._id ?? session.sellerId,
      seller_name: session.seller_name ?? session.sellerName ?? session.sellerId?.companyName ?? session.sellerId?.name ?? 'Seller',
      session_id: session.id ?? session._id ?? session.offer_id ?? sessionId,
      status: session.status || 'VALID',
      ...costBreakdown,
      base_list_price: baseListPrice,
      total_savings: totalSavings,
      savings_percent: savingsPercent,
      rounds: session.rounds || session.negotiationRounds || []
    };
  });

  // Only VALID / agreed offers are eligible for Lowest Cost or Fastest Delivery winner selection
  const eligiblePlans = evaluatedPlans.filter(
    p => p.status === 'VALID' || p.status === 'agreed' || p.status === 'AGREED'
  );

  if (eligiblePlans.length === 0) {
    return {
      lowestCostPlan: null,
      fastestDeliveryPlan: null,
      allPlans: evaluatedPlans
    };
  }

  // Deterministic Sort for Lowest Cost (ascending landed cost -> negotiated price -> lead time -> id)
  const lowestCostPlans = [...eligiblePlans].sort((a, b) => {
    if (a.totalLandedCost !== b.totalLandedCost) return a.totalLandedCost - b.totalLandedCost;
    if (a.negotiatedPrice !== b.negotiatedPrice) return a.negotiatedPrice - b.negotiatedPrice;
    if (a.leadTimeDays !== b.leadTimeDays) return a.leadTimeDays - b.leadTimeDays;
    return String(a.session_id).localeCompare(String(b.session_id));
  });

  // Deterministic Sort for Fastest Delivery (ascending lead time -> landed cost -> negotiated price -> id)
  const fastestDeliveryPlans = [...eligiblePlans].sort((a, b) => {
    if (a.leadTimeDays !== b.leadTimeDays) return a.leadTimeDays - b.leadTimeDays;
    if (a.totalLandedCost !== b.totalLandedCost) return a.totalLandedCost - b.totalLandedCost;
    if (a.negotiatedPrice !== b.negotiatedPrice) return a.negotiatedPrice - b.negotiatedPrice;
    return String(a.session_id).localeCompare(String(b.session_id));
  });

  const lowestCostPlan = {
    ...lowestCostPlans[0],
    plan_type: 'lowest_cost',
    plan_label: 'Lowest Cost'
  };

  const fastestDeliveryPlan = {
    ...fastestDeliveryPlans[0],
    plan_type: 'fastest_delivery',
    plan_label: 'Fastest Delivery'
  };

  return {
    lowestCostPlan,
    fastestDeliveryPlan,
    allPlans: lowestCostPlans
  };
}

module.exports = {
  calculateLandedCost,
  rankPlans
};
