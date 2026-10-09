const assert = require('assert');
const { runNegotiationForSeller } = require('../services/negotiationEngine');

console.log('===================================================');
console.log('🚀 Running Task 7: Seller Catalog & Product Policy Engine Tests');
console.log('===================================================\n');

function testProductCatalogNegotiation() {
  console.log('[Test Scenario] Testing product (List: ₹2,000, Cost: ₹1,400, MOQ: 5)...');
  console.log('                 Configured Policy: Slabs (25-49 @ 5%, 50-99 @ 7%), Delivery (2% for >=10 days), Advance Pay (3%)...\n');

  const seller = { id: 'seller_101', name: 'Logistics Hardware Seller' };
  const sellerProducts = [
    {
      id: 'prod_201',
      name: 'Mechanical Ergonomic Keyboard',
      list_price: 2000,
      cost_price: 1400,
      moq: 5,
      standardLeadTimeDays: 3
    }
  ];

  const sellerRules = {
    max_discount_percent: 15.0,
    max_discount_amount: 20000.0,
    margin_floor_percent: 8.0,
    advance_pay_extra_discount_percent: 3.0,
    lead_time_extra_discount_percent: 2.0,
    max_lead_time_extension_days: 7, // 3 std + 7 ext = 10 days required
    standard_lead_time_days: 3
  };

  const sellerSlabs = [
    { min_quantity: 25, max_quantity: 49, discount_percent: 5.0 },
    { min_quantity: 50, max_quantity: 99, discount_percent: 7.0 }
  ];

  // Case 1: Buyer requests 30 units, deadline 12 days, standard payment
  console.log('-> Case 1: Buyer requests 30 units, deadline 12 days, standard payment terms...');
  const req1 = {
    total_budget: 100000,
    deadline_days: 12,
    is_advance_payment: false,
    items: [{ item_name: 'Mechanical Ergonomic Keyboard', quantity: 30 }]
  };

  const res1 = runNegotiationForSeller(seller, sellerRules, sellerProducts, sellerSlabs, req1);
  assert.strictEqual(res1.status, 'agreed', 'Case 1 should agree');

  const bd1 = res1.discount_breakdown;
  assert.strictEqual(bd1.total_requested_units, 30, 'Total requested units = 30');
  assert.strictEqual(bd1.list_price_total, 60000, '30 keyboards @ ₹2,000 = ₹60,000 list price total');

  // Round 1: 5% bulk discount for 25-49 slab on 60,000 = ₹3,000 (New baseline = ₹57,000)
  assert.strictEqual(bd1.bulk_discount.applied, true, 'Bulk discount should apply');
  assert.strictEqual(bd1.bulk_discount.percent, 5.0, 'Bulk discount percent should be 5%');
  assert.strictEqual(bd1.bulk_discount.amount, 3000, 'Bulk discount amount = ₹3,000');
  assert(bd1.bulk_discount.explanation.includes('25+ unit slab'), 'Explanation must cite qualifying slab');

  // Round 2: Advance Pay = false -> 0 discount
  assert.strictEqual(bd1.advance_pay_discount.applied, false, 'Advance pay discount should NOT apply');
  assert.strictEqual(bd1.advance_pay_discount.amount, 0, 'Advance pay amount = 0');
  assert(bd1.advance_pay_discount.explanation.includes('not requested'), 'Explanation must cite advance pay omitted');

  // Round 3: Flexible Delivery = 2% on 57,000 = ₹1,140 (12 days >= 10 required)
  assert.strictEqual(bd1.lead_time_discount.applied, true, 'Flexible delivery discount should apply');
  assert.strictEqual(bd1.lead_time_discount.percent, 2.0, 'Delivery discount percent = 2%');
  assert.strictEqual(bd1.lead_time_discount.amount, 1140, '2% of 57,000 = ₹1,140');

  // Math Reconciliation Check
  assert.strictEqual(bd1.total_discount_amount, 4140, 'Total discount amount = 3000 + 1140 = ₹4,140');
  assert.strictEqual(bd1.final_negotiated_total, 55860, 'Final total = 60000 - 4140 = ₹55,860');

  console.log('   ✓ Case 1 Passed! Bulk: ₹3,000 (5%) + Delivery: ₹1,140 (2%) + Advance: ₹0 = Total Savings: ₹4,140 (Final Landed: ₹55,860)\n');

  // Case 2: Buyer requests 60 units, deadline 5 days (too short for delivery ext), prepaid advance payment
  console.log('-> Case 2: Buyer requests 60 units, deadline 5 days (too short), 100% advance payment...');
  const req2 = {
    total_budget: 200000,
    deadline_days: 3, // 3 days == standard lead time -> Delivery extension skipped
    is_advance_payment: true, // Advance pay qualified
    items: [{ item_name: 'Mechanical Ergonomic Keyboard', quantity: 60 }]
  };

  const res2 = runNegotiationForSeller(seller, sellerRules, sellerProducts, sellerSlabs, req2);
  const bd2 = res2.discount_breakdown;

  assert.strictEqual(bd2.total_requested_units, 60, 'Total requested units = 60');
  assert.strictEqual(bd2.list_price_total, 120000, '60 keyboards @ ₹2,000 = ₹120,000 list total');

  // Round 1: 7% bulk discount for 50-99 slab on 120,000 = ₹8,400 (New baseline = ₹111,600)
  assert.strictEqual(bd2.bulk_discount.applied, true, '7% bulk discount should apply for 60 units');
  assert.strictEqual(bd2.bulk_discount.percent, 7.0, 'Bulk discount percent = 7%');
  assert.strictEqual(bd2.bulk_discount.amount, 8400, '7% of 120,000 = ₹8,400');

  // Round 2: Advance Pay 3% on 111,600 = ₹3,348 (New baseline = ₹108,252)
  assert.strictEqual(bd2.advance_pay_discount.applied, true, 'Advance pay discount should apply');
  assert.strictEqual(bd2.advance_pay_discount.percent, 3.0, 'Advance pay percent = 3%');
  assert.strictEqual(bd2.advance_pay_discount.amount, 3348, '3% of 111,600 = ₹3,348');

  // Round 3: Delivery extension skipped because 5 days < 10 required
  assert.strictEqual(bd2.lead_time_discount.applied, false, 'Delivery discount should NOT apply');
  assert.strictEqual(bd2.lead_time_discount.amount, 0, 'Delivery discount amount = 0');
  assert(bd2.lead_time_discount.explanation.includes('does not'), 'Explanation must cite delivery deadline shortfall');

  // Math Reconciliation Check
  assert.strictEqual(bd2.total_discount_amount, 11748, 'Total discount amount = 8400 + 3348 = ₹11,748');
  assert.strictEqual(bd2.final_negotiated_total, 108252, 'Final total = 120000 - 11748 = ₹108,252');

  console.log('   ✓ Case 2 Passed! Bulk: ₹8,400 (7%) + Advance: ₹3,348 (3%) + Delivery: ₹0 = Total Savings: ₹11,748 (Final Landed: ₹108,252)\n');
}

try {
  testProductCatalogNegotiation();

  console.log('===================================================');
  console.log('✅ ALL PRODUCT CATALOG & POLICY ENGINE TESTS PASSED!');
  console.log('===================================================\n');
} catch (err) {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
}
