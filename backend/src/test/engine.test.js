const assert = require('assert');
const { runNegotiationForSeller } = require('../services/negotiationEngine');
const { rankPlans } = require('../services/planComparator');

console.log('--- Running DealPilot Policy Engine Unit Tests ---');

// Test Case 1: Worked Example from Spec Section 7 (BrightPath Institute & Seller B)
function testWorkedExampleSection7() {
  console.log('\n[Test 1] Testing Worked Example Section 7 (BrightPath Institute & Seller B)...');
  
  const seller = { id: 2, name: 'Suresh Menon', company_name: 'OfficeGear Direct' };
  const sellerRules = {
    max_discount_percent: 10.0,
    max_discount_amount: 10000.0,
    margin_floor_percent: 8.0,
    max_rounds: 5,
    default_lead_time_days: 7,
    volume_lever_enabled: 1,
    advance_pay_lever_enabled: 1,
    advance_pay_extra_discount_percent: 2.0,
    lead_time_lever_enabled: 1,
    max_lead_time_extension_days: 7,
    lead_time_extra_discount_percent: 1.0
  };

  const sellerProducts = [
    { id: 10, name: 'Mechanical Keyboard', list_price: 1200, cost_price: 950, moq: 5, standard_lead_time_days: 5 },
    { id: 11, name: 'Optical Mouse', list_price: 800, cost_price: 600, moq: 5, standard_lead_time_days: 5 },
    { id: 12, name: 'Noise-Cancelling Headset', list_price: 1600, cost_price: 1400, moq: 5, standard_lead_time_days: 5 }
  ];

  const sellerSlabs = [
    { product_id: 10, min_quantity: 25, max_quantity: 100, discount_percent: 5.0 },
    { product_id: 11, min_quantity: 25, max_quantity: 100, discount_percent: 5.0 },
    { product_id: 12, min_quantity: 25, max_quantity: 100, discount_percent: 5.0 }
  ];

  const request = {
    id: 1,
    total_budget: 100000,
    deadline_days: 14,
    items: [
      { item_name: 'Mechanical Keyboard', quantity: 30 },
      { item_name: 'Optical Mouse', quantity: 30 },
      { item_name: 'Noise-Cancelling Headset', quantity: 30 }
    ]
  };

  const result = runNegotiationForSeller(seller, sellerRules, sellerProducts, sellerSlabs, request);

  assert.strictEqual(result.status, 'agreed', 'Seller B negotiation should succeed');
  assert.strictEqual(result.rounds.length, 3, 'Should take exactly 3 rounds');
  
  // Verify Round 1: Volume Slab
  assert.strictEqual(result.rounds[0].calculated_price, 102600, 'Round 1 price should be 102,600');
  
  // Verify Round 2: Advance Pay
  assert.strictEqual(result.rounds[1].calculated_price, 100548, 'Round 2 price should be 100,548');
  
  // Verify Round 3: Delivery Extension
  assert.strictEqual(result.rounds[2].calculated_price, 99542.52, 'Round 3 final price should be ~99,543');
  
  // Verify Policy Floor & Caps
  assert(result.rounds[2].seller_margin_percent >= 8.0, 'Margin must remain above 8% floor');
  assert(result.rounds[2].discount_percent <= 10.0, 'Discount must remain under 10% cap');
  assert(result.rounds[2].total_discount_amount <= 10000.0, 'Discount amount must remain under ₹10,000');

  console.log('✓ Test 1 Passed! Final Price: ₹' + result.final_price + ' | Margin: ' + result.rounds[2].seller_margin_percent + '%');
}

// Test Case 2: Margin Floor Failure Enforcement
function testMarginFloorBreachFailure() {
  console.log('\n[Test 2] Testing Margin Floor Policy Breach Rejection (Seller C)...');

  const seller = { id: 3, name: 'Priya Sharma', company_name: 'Apex IT Solutions' };
  const sellerRules = {
    max_discount_percent: 15.0,
    max_discount_amount: 20000.0,
    margin_floor_percent: 12.0, // High margin floor
    max_rounds: 5,
    default_lead_time_days: 7,
    volume_lever_enabled: 1,
    advance_pay_lever_enabled: 1,
    advance_pay_extra_discount_percent: 3.0,
    lead_time_lever_enabled: 1,
    max_lead_time_extension_days: 7,
    lead_time_extra_discount_percent: 2.0
  };

  const sellerProducts = [
    { id: 20, name: 'Mechanical Keyboard', list_price: 1250, cost_price: 1120, moq: 5, standard_lead_time_days: 7 },
    { id: 21, name: 'Optical Mouse', list_price: 850, cost_price: 760, moq: 5, standard_lead_time_days: 7 },
    { id: 22, name: 'Noise-Cancelling Headset', list_price: 1650, cost_price: 1480, moq: 5, standard_lead_time_days: 7 }
  ];

  const sellerSlabs = [
    { product_id: 20, min_quantity: 25, max_quantity: 100, discount_percent: 4.0 },
    { product_id: 21, min_quantity: 25, max_quantity: 100, discount_percent: 4.0 },
    { product_id: 22, min_quantity: 25, max_quantity: 100, discount_percent: 4.0 }
  ];

  const request = {
    id: 2,
    total_budget: 100000,
    deadline_days: 14,
    items: [
      { item_name: 'Mechanical Keyboard', quantity: 30 },
      { item_name: 'Optical Mouse', quantity: 30 },
      { item_name: 'Noise-Cancelling Headset', quantity: 30 }
    ]
  };

  const result = runNegotiationForSeller(seller, sellerRules, sellerProducts, sellerSlabs, request);

  assert.strictEqual(result.status, 'rejected', 'Seller C negotiation should be REJECTED');
  assert(result.rejection_reason.includes('Margin floor breach'), 'Rejection reason must explicitly cite Margin floor breach');

  console.log('✓ Test 2 Passed! Offer correctly rejected with reason:', result.rejection_reason);
}

try {
  testWorkedExampleSection7();
  testMarginFloorBreachFailure();
  console.log('\n=============================================');
  console.log('ALL UNIT TESTS PASSED SUCCESSFULLY! (100% PASS)');
  console.log('=============================================\n');
} catch (err) {
  console.error('\n❌ UNIT TEST FAILED:', err.message);
  process.exit(1);
}
