const assert = require('assert');
const { runNegotiationForSeller } = require('../services/negotiationEngine');

console.log('===================================================');
console.log('🚀 Running Task: Required Quantity & MOQ Validation Test Suite');
console.log('===================================================\n');

function runQuantityTestSuite() {
  const seller = { id: 'seller_301', name: 'Office Depot Partner' };
  const sellerProducts = [
    {
      id: 'prod_pencil_1',
      name: 'Pencils',
      list_price: 10,
      cost_price: 6,
      moq: 10, // Minimum Order Quantity is 10
      stock: 500,
      standardLeadTimeDays: 3
    },
    {
      id: 'prod_notebook_1',
      name: 'Notebooks',
      list_price: 50,
      cost_price: 30,
      moq: 5, // Minimum Order Quantity is 5
      stock: 200,
      standardLeadTimeDays: 3
    }
  ];

  const sellerRules = {
    max_discount_percent: 20.0,
    max_discount_amount: 50000.0,
    margin_floor_percent: 10.0,
    advance_pay_extra_discount_percent: 2.0,
    lead_time_extra_discount_percent: 3.0,
    max_lead_time_extension_days: 5,
    standard_lead_time_days: 3
  };

  const sellerSlabs = [
    { min_quantity: 25, max_quantity: 49, discount_percent: 5.0 },
    { min_quantity: 50, max_quantity: 99, discount_percent: 10.0 }
  ];

  // Test 1: AI extracted 30 pencils, manual override changed quantity to 40
  console.log('[Test 1] Buyer overrides AI-extracted quantity (30 pencils -> 40 pencils)...');
  const req1 = {
    total_budget: 1000,
    deadline_days: 5,
    is_advance_payment: false,
    items: [{ item_name: 'Pencils', quantity: 40 }]
  };

  const res1 = runNegotiationForSeller(seller, sellerRules, sellerProducts, sellerSlabs, req1);
  assert.strictEqual(res1.status, 'agreed', 'Test 1 should agree');
  
  const bd1 = res1.discount_breakdown;
  assert.strictEqual(bd1.total_requested_units, 40, 'Total requested units must be 40 (manual override quantity)');
  assert.strictEqual(bd1.list_price_total, 400, '40 pencils @ ₹10 = ₹400 list price total');
  assert.strictEqual(bd1.bulk_discount.applied, true, 'Bulk discount for 25-49 slab must apply');
  assert.strictEqual(bd1.bulk_discount.percent, 5.0, 'Bulk discount is 5%');
  assert.strictEqual(bd1.bulk_discount.amount, 20, '5% of 400 = ₹20 discount');
  console.log('   ✓ Test 1 Passed! Manually overridden quantity (40 units) was used by negotiation engine. Final Landed: ₹380 (Saved ₹20).\n');

  // Test 2: Multiple products with distinct quantities
  console.log('[Test 2] Buyer submits multiple products with distinct requested quantities (40 Pencils + 10 Notebooks)...');
  const req2 = {
    total_budget: 2000,
    deadline_days: 5,
    is_advance_payment: false,
    items: [
      { item_name: 'Pencils', quantity: 40 },
      { item_name: 'Notebooks', quantity: 10 }
    ]
  };

  const res2 = runNegotiationForSeller(seller, sellerRules, sellerProducts, sellerSlabs, req2);
  assert.strictEqual(res2.status, 'agreed', 'Test 2 should agree');

  const bd2 = res2.discount_breakdown;
  assert.strictEqual(bd2.total_requested_units, 50, 'Total order quantity must sum all product units (40 + 10 = 50)');
  assert.strictEqual(bd2.list_price_total, 900, 'List price total = (40*10) + (10*50) = ₹900');
  console.log('   ✓ Test 2 Passed! Multi-item request correctly calculated sum of 50 total units & ₹900 list price total.\n');

  // Test 3: Quantity below MOQ rejected with clear error message
  console.log('[Test 3] Buyer requests quantity below MOQ (4 pencils < MOQ of 10)...');
  const req3 = {
    total_budget: 1000,
    deadline_days: 5,
    is_advance_payment: false,
    items: [{ item_name: 'Pencils', quantity: 4 }]
  };

  const res3 = runNegotiationForSeller(seller, sellerRules, sellerProducts, sellerSlabs, req3);
  assert.strictEqual(res3.status, 'rejected', 'Quantity below MOQ must be rejected');
  assert(res3.rejection_reason.includes('below minimum order quantity (MOQ: 10)'), 'Rejection reason must cite MOQ requirement');
  console.log(`   ✓ Test 3 Passed! Correctly rejected below-MOQ request with message: "${res3.rejection_reason}"\n`);

  // Test 4: Quantity equal to MOQ accepted
  console.log('[Test 4] Buyer requests quantity exactly equal to MOQ (10 pencils = MOQ 10)...');
  const req4 = {
    total_budget: 1000,
    deadline_days: 5,
    is_advance_payment: false,
    items: [{ item_name: 'Pencils', quantity: 10 }]
  };

  const res4 = runNegotiationForSeller(seller, sellerRules, sellerProducts, sellerSlabs, req4);
  assert.strictEqual(res4.status, 'agreed', 'Quantity equal to MOQ must be accepted');
  assert.strictEqual(res4.discount_breakdown.total_requested_units, 10, '10 units requested');
  console.log('   ✓ Test 4 Passed! Quantity equal to MOQ (10 units) was accepted.\n');

  // Test 5: Quantity above MOQ qualifying for 10% bulk slab
  console.log('[Test 5] Buyer requests 50 pencils (qualifying for 50-99 slab @ 10% discount)...');
  const req5 = {
    total_budget: 1000,
    deadline_days: 5,
    is_advance_payment: false,
    items: [{ item_name: 'Pencils', quantity: 50 }]
  };

  const res5 = runNegotiationForSeller(seller, sellerRules, sellerProducts, sellerSlabs, req5);
  assert.strictEqual(res5.status, 'agreed');
  const bd5 = res5.discount_breakdown;
  assert.strictEqual(bd5.bulk_discount.percent, 10.0, '50 units qualifies for 10% bulk slab');
  assert.strictEqual(bd5.bulk_discount.amount, 50, '10% of 500 = ₹50');
  console.log('   ✓ Test 5 Passed! 50 units correctly qualified for 10% bulk discount (Saved ₹50).\n');

  // Test 6: High quantity (70 units) without custom slabs returns 0 bulk discount (no hardcoded volume fallbacks)
  console.log('[Test 6] Buyer requests 70 units without custom slabs (must return 0 bulk discount)...');
  const res6 = runNegotiationForSeller(seller, sellerRules, sellerProducts, [], {
    total_budget: 1000,
    deadline_days: 3, // Standard lead time
    is_advance_payment: false,
    items: [{ item_name: 'Pencils', quantity: 70 }]
  });
  assert.strictEqual(res6.status, 'agreed');
  const bd6 = res6.discount_breakdown;
  assert.strictEqual(bd6.bulk_discount.applied, false, 'Bulk discount must NOT apply when no slabs exist');
  assert.strictEqual(bd6.bulk_discount.percent, 0, 'Bulk discount percent must be 0');
  assert.strictEqual(bd6.bulk_discount.amount, 0, 'Bulk discount amount must be 0');
  console.log('   ✓ Test 6 Passed! 70 units without custom slabs correctly returned ₹0 bulk discount (no hardcoded fallbacks).\n');

  // Test 7: Flexible delivery window (7 days deadline vs 3 days standard lead time)
  console.log('[Test 7] Buyer offers 7 days delivery window (4 days extra delivery flexibility)...');
  const res7 = runNegotiationForSeller(seller, sellerRules, sellerProducts, [], {
    total_budget: 1000,
    deadline_days: 7, // 4 extra days delivery window
    is_advance_payment: false,
    items: [{ item_name: 'Pencils', quantity: 70 }]
  });
  assert.strictEqual(res7.status, 'agreed');
  const bd7 = res7.discount_breakdown;
  assert.strictEqual(bd7.lead_time_discount.applied, true, 'Flexible delivery discount must apply for 7 days deadline');
  assert(bd7.lead_time_discount.amount > 0, 'Flexible delivery discount amount > 0');
  console.log(`   ✓ Test 7 Passed! 7 days delivery window applied ₹${bd7.lead_time_discount.amount} flexible delivery discount (${bd7.lead_time_discount.explanation}).\n`);

  console.log('===================================================');
  console.log('✅ ALL REQUIRED QUANTITY, VOLUME TIER & DELIVERY TESTS PASSED!');
  console.log('===================================================');
}

runQuantityTestSuite();
