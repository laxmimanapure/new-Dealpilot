const assert = require('assert');
const { runNegotiationForSeller } = require('../services/negotiationEngine');

function roundToTwo(num) {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

console.log('===================================================');
console.log('🚀 Running Pricing Basis, MOQ & Budget Unit Tests');
console.log('===================================================\n');

// Test 1: 30 pencils at ₹50 per unit with 5% discount
function testPencilsPricing30Units() {
  console.log('[Test 1] Testing 30 pencils at ₹50 list price (Unit Cost ₹20, MOQ 5)...');

  const seller = { id: 1, name: 'Stationery Supplier' };
  const sellerRules = {
    max_discount_percent: 15.0,
    margin_floor_percent: 8.0,
    advance_pay_extra_discount_percent: 2.0,
    lead_time_extra_discount_percent: 1.0
  };

  const sellerProducts = [
    { id: 10, name: 'Pencil', list_price: 50, cost_price: 20, moq: 5 }
  ];

  const sellerSlabs = [
    { min_quantity: 20, max_quantity: 100, discount_percent: 5.0 }
  ];

  const request = {
    total_budget: 2000,
    deadline_days: 3,
    items: [
      { item_name: 'Pencil', quantity: 30 }
    ]
  };

  const result = runNegotiationForSeller(seller, sellerRules, sellerProducts, sellerSlabs, request);

  assert.strictEqual(result.status, 'agreed', 'Negotiation should be agreed');
  
  // List price total = 50 * 30 = 1500
  const expectedListTotal = 1500;
  // 5% discount on 1500 = 1425
  const expectedNegotiatedTotal = 1425;
  const expectedSavings = 75;

  assert.strictEqual(result.rounds[0].calculated_price, expectedNegotiatedTotal, `Calculated price should be ₹${expectedNegotiatedTotal}`);
  assert.strictEqual(result.final_price, expectedNegotiatedTotal, `Final price should be ₹${expectedNegotiatedTotal}`);
  
  console.log(`  ✓ Test 1 Passed! List Total: ₹${expectedListTotal} | Negotiated: ₹${result.final_price} | Savings: ₹${expectedListTotal - result.final_price}`);
}

// Test 2: Quantity below MOQ (2 pencils when MOQ is 5)
function testQuantityBelowMOQ() {
  console.log('\n[Test 2] Testing quantity below MOQ (2 pencils vs MOQ 5)...');

  const seller = { id: 1, name: 'Stationery Supplier' };
  const sellerRules = { margin_floor_percent: 8.0 };
  const sellerProducts = [
    { id: 10, name: 'Pencil', list_price: 50, cost_price: 20, moq: 5 }
  ];

  const request = {
    total_budget: 500,
    deadline_days: 7,
    items: [
      { item_name: 'Pencil', quantity: 2 }
    ]
  };

  const result = runNegotiationForSeller(seller, sellerRules, sellerProducts, [], request);

  assert.strictEqual(result.status, 'rejected', 'Must reject quantity below MOQ');
  assert(result.rejection_reason.includes('MOQ breach'), 'Rejection message must explicitly state MOQ breach');

  console.log('  ✓ Test 2 Passed! Correctly rejected below-MOQ request');
}

// Test 3: Quantity equal to MOQ (5 pencils vs MOQ 5)
function testQuantityEqualToMOQ() {
  console.log('\n[Test 3] Testing quantity equal to MOQ (5 pencils vs MOQ 5)...');

  const seller = { id: 1, name: 'Stationery Supplier' };
  const sellerRules = { margin_floor_percent: 8.0 };
  const sellerProducts = [
    { id: 10, name: 'Pencil', list_price: 50, cost_price: 20, moq: 5 }
  ];

  const request = {
    total_budget: 500,
    deadline_days: 3,
    items: [
      { item_name: 'Pencil', quantity: 5 }
    ]
  };

  const sellerSlabs = [
    { min_quantity: 5, discount_percent: 5.0 }
  ];

  const result = runNegotiationForSeller(seller, sellerRules, sellerProducts, sellerSlabs, request);

  assert.strictEqual(result.status, 'agreed', 'Equal to MOQ should pass');
  assert.strictEqual(result.final_price, 237.5, '5 pencils at 50 list = 250, 5% discount = 237.5');

  console.log('  ✓ Test 3 Passed! Equal to MOQ request succeeded with price ₹' + result.final_price);
}

// Test 4: Budget target ₹400 vs ₹1000
function testBudgetTargetPreservation() {
  console.log('\n[Test 4] Testing target budget preservation (₹400 vs ₹1000)...');

  const seller = { id: 1, name: 'Stationery Supplier' };
  const sellerRules = { margin_floor_percent: 8.0 };
  const sellerProducts = [
    { id: 10, name: 'Pencil', list_price: 50, cost_price: 20, moq: 5 }
  ];

  // 30 pencils at 50 list = 1500. Negotiated = 1425. If budget is 400, it MUST be rejected as over-budget!
  const requestOverBudget = {
    total_budget: 400,
    deadline_days: 7,
    items: [
      { item_name: 'Pencil', quantity: 30 }
    ]
  };

  const resultOverBudget = runNegotiationForSeller(seller, sellerRules, sellerProducts, [], requestOverBudget);

  assert.strictEqual(resultOverBudget.status, 'rejected', '30 pencils at ₹1425 must be rejected when budget is ₹400');
  assert(resultOverBudget.rejection_reason.includes('exceeds buyer target budget'), 'Reason must cite budget breach');

  console.log('  ✓ Test 4 Passed! Target budget ₹400 correctly rejected offer exceeding budget');
}

// Test 5: Multiple products with different quantities
function testMultipleProductsPricing() {
  console.log('\n[Test 5] Testing multiple products (10 pens @ ₹20, 5 notebooks @ ₹100)...');

  const seller = { id: 1, name: 'Multi-Product Supplier' };
  const sellerRules = { margin_floor_percent: 8.0 };
  const sellerProducts = [
    { id: 1, name: 'Pens', list_price: 20, cost_price: 10, moq: 1 },
    { id: 2, name: 'Notebooks', list_price: 100, cost_price: 60, moq: 1 }
  ];

  const request = {
    total_budget: 1000,
    deadline_days: 7,
    items: [
      { item_name: 'Pens', quantity: 10 },
      { item_name: 'Notebooks', quantity: 5 }
    ]
  };

  const sellerSlabs = [{ min_quantity: 5, discount_percent: 5.0 }];
  const result = runNegotiationForSeller(seller, sellerRules, sellerProducts, sellerSlabs, request);

  assert.strictEqual(result.status, 'agreed', 'Multi-item requirement should succeed');
  assert(result.final_price < 700, 'Final negotiated price should be discounted below ₹700 list price');

  console.log('  ✓ Test 5 Passed! Multi-item total list ₹700 negotiated to ₹' + result.final_price);
}

try {
  testPencilsPricing30Units();
  testQuantityBelowMOQ();
  testQuantityEqualToMOQ();
  testBudgetTargetPreservation();
  testMultipleProductsPricing();

  console.log('\n===================================================');
  console.log('✅ ALL PRICING, MOQ & BUDGET TESTS PASSED! (5/5)');
  console.log('===================================================\n');
} catch (err) {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
}
