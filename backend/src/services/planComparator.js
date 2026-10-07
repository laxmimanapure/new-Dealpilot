/**
 * DealPilot Procure - Plan Comparator Engine
 * Evaluates agreed negotiation sessions and computes Landed Cost & Plan Ranking.
 * 
 * Landed Cost Formula:
 * Landed cost = negotiated_price + delivery_charge + financing_cost_of_advance_payment - early_payment_benefit
 */

function calculateLandedCost(session, sellerRules) {
  const negotiatedPrice = session.final_price;
  const deliveryCharge = sellerRules.delivery_fee ?? 500;
  
  // Check if advance payment lever was applied in any round
  const hasAdvancePay = session.rounds.some(r => r.accepted && r.lever_applied.includes('Advance Payment'));
  
  // Financing cost calculation: ~10% per annum cost of capital over lead time
  const annualInterestRate = 0.10;
  const leadTimeDays = session.final_lead_time || 7;
  
  const financingCost = hasAdvancePay 
    ? Math.round((negotiatedPrice * annualInterestRate * (leadTimeDays / 365)) * 100) / 100
    : 0;

  // Early payment benefit (0.5% of order if paid in advance)
  const earlyPaymentBenefit = hasAdvancePay 
    ? Math.round((negotiatedPrice * 0.005) * 100) / 100
    : 0;

  const totalLandedCost = Math.round((negotiatedPrice + deliveryCharge + financingCost - earlyPaymentBenefit) * 100) / 100;

  return {
    negotiatedPrice,
    deliveryCharge,
    financingCost,
    earlyPaymentBenefit,
    totalLandedCost,
    leadTimeDays
  };
}

function rankPlans(agreedSessions, sellerRulesMap) {
  if (!agreedSessions || agreedSessions.length === 0) {
    return {
      lowestCostPlan: null,
      fastestDeliveryPlan: null,
      allPlans: []
    };
  }

  const evaluatedPlans = agreedSessions.map(session => {
    const rules = sellerRulesMap[session.seller_id] || {};
    const costBreakdown = calculateLandedCost(session, rules);
    
    return {
      seller_id: session.seller_id,
      seller_name: session.seller_name,
      session_id: session.id,
      ...costBreakdown,
      base_list_price: session.base_list_price,
      total_savings: Math.round((session.base_list_price - session.final_price) * 100) / 100,
      savings_percent: Math.round(((session.base_list_price - session.final_price) / session.base_list_price) * 10000) / 100,
      rounds: session.rounds
    };
  });

  // Sort for Lowest Cost (ascending landed cost)
  const lowestCostPlans = [...evaluatedPlans].sort((a, b) => a.totalLandedCost - b.totalLandedCost);

  // Sort for Fastest Delivery (ascending lead time, tie breaker by landed cost)
  const fastestDeliveryPlans = [...evaluatedPlans].sort((a, b) => {
    if (a.leadTimeDays !== b.leadTimeDays) {
      return a.leadTimeDays - b.leadTimeDays;
    }
    return a.totalLandedCost - b.totalLandedCost;
  });

  const lowestCostPlan = { ...lowestCostPlans[0], plan_type: 'lowest_cost', plan_label: 'Lowest Cost' };
  
  // Make sure fastest delivery plan can be visually distinguished if different
  let fastestDeliveryPlan = { ...fastestDeliveryPlans[0], plan_type: 'fastest_delivery', plan_label: 'Fastest Delivery' };
  
  if (lowestCostPlan.session_id === fastestDeliveryPlan.session_id && evaluatedPlans.length > 1) {
    // If lowest cost is also fastest, label appropriately
    fastestDeliveryPlan = { ...lowestCostPlans[1], plan_type: 'fastest_delivery', plan_label: 'Fastest Delivery' };
  }

  return {
    lowestCostPlan,
    fastestDeliveryPlan,
    allPlans: evaluatedPlans
  };
}

module.exports = {
  calculateLandedCost,
  rankPlans
};
