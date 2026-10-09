const assert = require('assert');
const { runNegotiationForSeller } = require('../services/negotiationEngine');

console.log('===================================================');
console.log('🚀 Running Comprehensive Discount Breakdown & Policy Audit Tests');
console.log('===================================================\n');

// Test 1: Quantity qualifies for a configured bulk discount
function testConfiguredBulkDiscount() {
  console.log('[Test 1] Quantity qualifies for a configured bulk discount slab (50 units vs 25+ slab @ 5%)...');

  const seller = { id: 1, name: 'Tech Supplies' };
  const sellerRules = { max_discount_percent: 20.0, margin_floor_percent: 8.0 };
  const sellerProducts = [{ id: 10, name: 'Dell Keyboard', list_price: 2000, cost_price: 1000, moq: 5 }];
  const sellerSlabs = [{ min_quantity: 25, max_quantity: 100, discount_percent: 5.0 }];

  const request = {
    total_budget: 100000,
    deadline_days: 7,
    items: [{ item_name: 'Dell Keyboard', quantity: 50 }]
  };

  const result = runNegotiationForSeller(seller, sellerRules, sellerProducts, sellerSlabs, request);
  const bd = result.discount_breakdown;

  assert.strictEqual(bd.bulk_discount.applied, true, 'Bulk discount should be applied');
  assert.strictEqual(bd.bulk_discount.percent, 5.0, 'Bulk discount percentage should be 5%');
  assert.strictEqual(bd.bulk_discount.amount, 5000, '5% of ₹100,000 should be ₹5,000');
  assert(bd.bulk_discount.explanation.includes('25+ unit slab'), 'Explanation must mention qualifying slab');

  console.log('  ✓ Test 1 Passed! Bulk discount ₹5,000 applied with explanation:', bd.bulk_discount.explanation);
}

// Test 2: Quantity exceeds MOQ but no bulk discount slab exists
function testExceedsMoqNoBulkSlab() {
  console.log('\n[Test 2] Quantity (50 units) exceeds MOQ (5) but no bulk discount slab exists...');

  const seller = { id: 1, name: 'Tech Supplies' };
  const sellerRules = { max_discount_percent: 20.0, margin_floor_percent: 8.0 };
  const sellerProducts = [{ id: 10, name: 'Dell Keyboard', list_price: 2000, cost_price: 1000, moq: 5 }];
  const sellerSlabs = []; // NO SLABS CONFIGURED!

  const request = {
    total_budget: 100000,
    deadline_days: 7,
    items: [{ item_name: 'Dell Keyboard', quantity: 50 }]
  };

  const result = runNegotiationForSeller(seller, sellerRules, sellerProducts, sellerSlabs, request);
  const bd = result.discount_breakdown;

  assert.strictEqual(bd.bulk_discount.applied, false, 'Bulk discount should NOT apply when no slabs are configured');
  assert.strictEqual(bd.bulk_discount.percent, 0, 'Bulk discount percent should be 0');
  assert.strictEqual(bd.bulk_discount.amount, 0, 'Bulk discount amount must be 0');
  assert(bd.bulk_discount.explanation.includes('no qualifying bulk discount rule is configured') || bd.bulk_discount.explanation.includes('does not qualify'), 'Explanation must cite missing slab');

  console.log('  ✓ Test 2 Passed! 50 units without custom slabs correctly returned ₹0 bulk discount and accurate explanation');
}

// Test 3: A 25-day delivery window qualifies for configured delivery discount
function testDeliveryDiscountQualifies() {
  console.log('\n[Test 3] 25-day delivery window qualifies for configured delivery discount (3 std + 7 ext = 10 days required)...');

  const seller = { id: 1, name: 'Logistics Partner' };
  const sellerRules = {
    max_discount_percent: 20.0,
    margin_floor_percent: 8.0,
    lead_time_extra_discount_percent: 2.0,
    max_lead_time_extension_days: 7,
    standard_lead_time_days: 3
  };
  const sellerProducts = [{ id: 10, name: 'Dell Keyboard', list_price: 2000, cost_price: 1000, moq: 1, standardLeadTimeDays: 3 }];

  const request = {
    total_budget: 100000,
    deadline_days: 25, // 25 days >= 10 required
    items: [{ item_name: 'Dell Keyboard', quantity: 10 }]
  };

  const result = runNegotiationForSeller(seller, sellerRules, sellerProducts, [], request);
  const bd = result.discount_breakdown;

  assert.strictEqual(bd.lead_time_discount.applied, true, 'Delivery discount should apply');
  assert.strictEqual(bd.lead_time_discount.percent, 2.0, 'Delivery discount percent should be 2.0%');
  assert.strictEqual(bd.lead_time_discount.amount, 400, '2% of ₹20,000 baseline = ₹400');

  console.log('  ✓ Test 3 Passed! Delivery discount ₹400 applied with explanation:', bd.lead_time_discount.explanation);
}

// Test 4: A 25-day delivery window does NOT qualify under another policy
function testDeliveryDiscountDoesNotQualify() {
  console.log('\n[Test 4] 25-day delivery window when seller has no active delivery discount policy (pct = 0)...');

  const seller = { id: 1, name: 'Strict Seller' };
  const sellerRules = {
    max_discount_percent: 20.0,
    margin_floor_percent: 8.0,
    lead_time_extra_discount_percent: 0.0 // Policy disabled
  };
  const sellerProducts = [{ id: 10, name: 'Dell Keyboard', list_price: 2000, cost_price: 1000, moq: 1 }];

  const request = {
    total_budget: 100000,
    deadline_days: 25,
    items: [{ item_name: 'Dell Keyboard', quantity: 10 }]
  };

  const result = runNegotiationForSeller(seller, sellerRules, sellerProducts, [], request);
  const bd = result.discount_breakdown;

  assert.strictEqual(bd.lead_time_discount.applied, false, 'Delivery discount should NOT apply when policy is 0');
  assert.strictEqual(bd.lead_time_discount.amount, 0, 'Delivery discount amount should be 0');
  assert(bd.lead_time_discount.explanation.includes('no active flexible delivery discount policy'), 'Explanation must cite missing policy');

  console.log('  ✓ Test 4 Passed! Delivery discount correctly skipped when seller policy is 0');
}

// Test 5: Advance payment is accepted and rejected
function testAdvancePaymentAcceptedAndRejected() {
  console.log('\n[Test 5] Advance payment qualification (accepted vs rejected)...');

  const seller = { id: 1, name: 'Payment Seller' };
  const sellerRules = { max_discount_percent: 20.0, margin_floor_percent: 8.0, advance_pay_extra_discount_percent: 3.0 };
  const sellerProducts = [{ id: 10, name: 'Dell Keyboard', list_price: 2000, cost_price: 1000, moq: 1 }];

  // Case A: Accepted
  const reqAccepted = {
    total_budget: 100000,
    deadline_days: 7,
    is_advance_payment: true,
    items: [{ item_name: 'Dell Keyboard', quantity: 10 }]
  };
  const resAccepted = runNegotiationForSeller(seller, sellerRules, sellerProducts, [], reqAccepted);
  assert.strictEqual(resAccepted.discount_breakdown.advance_pay_discount.applied, true, 'Advance pay should be applied when requested');
  assert.strictEqual(resAccepted.discount_breakdown.advance_pay_discount.amount, 600, '3% of ₹20,000 baseline = ₹600');

  // Case B: Rejected/Not requested
  const reqRejected = {
    total_budget: 100000,
    deadline_days: 7,
    is_advance_payment: false,
    items: [{ item_name: 'Dell Keyboard', quantity: 10 }]
  };
  const resRejected = runNegotiationForSeller(seller, sellerRules, sellerProducts, [], reqRejected);
  assert.strictEqual(resRejected.discount_breakdown.advance_pay_discount.applied, false, 'Advance pay should NOT be applied when not requested');
  assert.strictEqual(resRejected.discount_breakdown.advance_pay_discount.amount, 0, 'Advance pay amount should be 0');
  assert(resRejected.discount_breakdown.advance_pay_discount.explanation.includes('not requested'), 'Must cite buyer did not request upfront terms');

  console.log('  ✓ Test 5 Passed! Advance payment correctly granted when requested (₹600) and skipped when omitted (₹0)');
}

// Test 6: Multiple discounts hit the maximum discount cap
function testMaxDiscountCapEnforcement() {
  console.log('\n[Test 6] Multiple discounts (Bulk 10% + Advance 5% + Delivery 5%) capped at max_discount_percent = 10%...');

  const seller = { id: 1, name: 'Capped Seller' };
  const sellerRules = {
    max_discount_percent: 10.0, // CAPPED AT 10% MAX!
    margin_floor_percent: 5.0,
    advance_pay_extra_discount_percent: 5.0,
    lead_time_extra_discount_percent: 5.0,
    max_lead_time_extension_days: 2
  };
  const sellerProducts = [{ id: 10, name: 'Dell Keyboard', list_price: 2000, cost_price: 500, moq: 1 }];
  const sellerSlabs = [{ min_quantity: 10, max_quantity: 100, discount_percent: 10.0 }];

  const request = {
    total_budget: 100000,
    deadline_days: 10,
    is_advance_payment: true,
    items: [{ item_name: 'Dell Keyboard', quantity: 10 }]
  };

  const result = runNegotiationForSeller(seller, sellerRules, sellerProducts, sellerSlabs, request);
  const bd = result.discount_breakdown;

  // List price = 20,000. 10% max cap = 2,000 max total discount. Minimum allowed price = 18,000.
  assert.strictEqual(bd.list_price_total, 20000, 'List total = 20,000');
  assert.strictEqual(bd.total_discount_amount, 2000, 'Total discount amount must equal exactly 10% cap (₹2,000)');
  assert.strictEqual(bd.final_negotiated_total, 18000, 'Final negotiated total must equal ₹18,000');

  console.log('  ✓ Test 6 Passed! Maximum discount cap of 10% strictly enforced (Total savings: ₹' + bd.total_discount_amount + ')');
}

// Test 7: Margin floor prevents an otherwise eligible discount
function testMarginFloorEnforcement() {
  console.log('\n[Test 7] Seller margin floor (25%) caps discount when cost price is high (Cost: ₹1600, List: ₹2000)...');

  const seller = { id: 1, name: 'High Cost Seller' };
  const sellerRules = {
    max_discount_percent: 30.0,
    margin_floor_percent: 20.0, // Margin floor = 20%. Minimum price = 1600 / (1 - 0.20) = 2000! Zero discount allowed!
    advance_pay_extra_discount_percent: 5.0
  };
  const sellerProducts = [{ id: 10, name: 'Dell Keyboard', list_price: 2000, cost_price: 1600, moq: 1 }];
  const sellerSlabs = [{ min_quantity: 5, max_quantity: 100, discount_percent: 10.0 }];

  const request = {
    total_budget: 100000,
    deadline_days: 7,
    is_advance_payment: true,
    items: [{ item_name: 'Dell Keyboard', quantity: 10 }]
  };

  const result = runNegotiationForSeller(seller, sellerRules, sellerProducts, sellerSlabs, request);
  const bd = result.discount_breakdown;

  // Since cost price is 1600 and margin floor is 20%, minimum price is 1600 / 0.8 = 2000.
  // No discount can be granted without breaching margin floor!
  assert.strictEqual(bd.total_discount_amount, 0, 'Total discount amount must be 0 to protect margin floor');
  assert.strictEqual(bd.final_negotiated_total, 20000, 'Final price must stay at list price total');

  console.log('  ✓ Test 7 Passed! Margin floor strictly protected seller from loss (Final price: ₹' + bd.final_negotiated_total + ')');
}

try {
  testConfiguredBulkDiscount();
  testExceedsMoqNoBulkSlab();
  testDeliveryDiscountQualifies();
  testDeliveryDiscountDoesNotQualify();
  testAdvancePaymentAcceptedAndRejected();
  testMaxDiscountCapEnforcement();
  testMarginFloorEnforcement();

  console.log('\n===================================================');
  console.log('✅ ALL 7 AUDIT & BREAKDOWN TESTS PASSED SUCCESSFULLY!');
  console.log('===================================================\n');
} catch (err) {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
}
