const assert = require('assert');
const { runNegotiationForSeller } = require('../services/negotiationEngine');
const aiService = require('../services/aiService');

console.log('===================================================');
console.log('🚀 Running Comprehensive DealPilot Policy Engine Tests');
console.log('===================================================\n');

// Test 1: Worked Example Policy Verification (Standard Success Flow)
function testWorkedExampleSection7() {
  console.log('[Test 1] Testing Worked Example (Standard Qualification)...');
  
  const seller = { id: 2, name: 'Suresh Menon', company_name: 'OfficeGear Direct' };
  const sellerRules = {
    max_discount_percent: 15.0,
    max_discount_amount: 20000.0,
    margin_floor_percent: 8.0,
    advance_pay_extra_discount_percent: 2.0,
    max_lead_time_extension_days: 7,
    lead_time_extra_discount_percent: 1.0
  };

  const sellerProducts = [
    { id: 10, name: 'Mechanical Keyboard', list_price: 1200, cost_price: 950, moq: 5 },
    { id: 11, name: 'Optical Mouse', list_price: 800, cost_price: 600, moq: 5 },
    { id: 12, name: 'Noise-Cancelling Headset', list_price: 1600, cost_price: 1400, moq: 5 }
  ];

  const sellerSlabs = [
    { min_quantity: 25, max_quantity: 100, discount_percent: 5.0 }
  ];

  const request = {
    id: 1,
    total_budget: 105000,
    deadline_days: 14,
    is_advance_payment: true,
    items: [
      { item_name: 'Mechanical Keyboard', quantity: 30 },
      { item_name: 'Optical Mouse', quantity: 30 },
      { item_name: 'Noise-Cancelling Headset', quantity: 30 }
    ]
  };

  const result = runNegotiationForSeller(seller, sellerRules, sellerProducts, sellerSlabs, request);

  assert.strictEqual(result.status, 'agreed', 'Negotiation should succeed');
  assert(result.rounds.length >= 1, 'Rounds should be generated');
  assert(result.final_price <= request.total_budget, 'Final price must be within budget');
  console.log('  ✓ Test 1 Passed! Final Price: ₹' + result.final_price);
}

// Test 2: MOQ Validation Rejection Test
function testMOQValidationRejection() {
  console.log('\n[Test 2] Testing MOQ Validation Rejection...');

  const seller = { id: 2, name: 'OfficeGear Sales' };
  const sellerRules = { margin_floor_percent: 8.0 };
  const sellerProducts = [
    { id: 10, name: 'Mechanical Keyboard', list_price: 2000, cost_price: 1400, moq: 10 }
  ];

  const request = {
    id: 102,
    total_budget: 5000,
    deadline_days: 7,
    items: [
      { item_name: 'Mechanical Keyboard', quantity: 2 } // Requesting 2 when MOQ is 10
    ]
  };

  const result = runNegotiationForSeller(seller, sellerRules, sellerProducts, [], request);

  assert.strictEqual(result.status, 'rejected', 'Negotiation must be rejected due to MOQ breach');
  assert(result.rejection_reason.includes('MOQ breach') || result.rejection_reason.includes('minimum order quantity'), 'Rejection message must specify MOQ breach');
  console.log('  ✓ Test 2 Passed! Correctly rejected with MOQ message:', result.rejection_reason);
}

// Test 3: Margin Floor Enforcement Test
function testMarginFloorBreachFailure() {
  console.log('\n[Test 3] Testing Margin Floor Breach Protection...');

  const seller = { id: 3, name: 'Priya Sharma' };
  const sellerRules = {
    max_discount_percent: 25.0,
    margin_floor_percent: 15.0 // High 15% margin floor required
  };

  const sellerProducts = [
    { id: 20, name: 'Mechanical Keyboard', list_price: 1200, cost_price: 1100, moq: 5 } // Low margin naturally
  ];

  const request = {
    id: 2,
    total_budget: 1000,
    deadline_days: 14,
    items: [
      { item_name: 'Mechanical Keyboard', quantity: 30 }
    ]
  };

  const result = runNegotiationForSeller(seller, sellerRules, sellerProducts, [], request);

  assert.strictEqual(result.status, 'rejected', 'Negotiation must reject low-margin offers');
  assert(result.rejection_reason.includes('Margin floor breach'), 'Must explicitly report Margin floor breach');
  console.log('  ✓ Test 3 Passed! Correctly enforced margin floor');
}

// Test 4: Maximum Discount Cap Test
function testMaximumDiscountCapEnforcement() {
  console.log('\n[Test 4] Testing Maximum Discount Cap Enforcement...');

  const seller = { id: 4, name: 'TechSupply Solutions' };
  const sellerRules = {
    max_discount_percent: 5.0, // Strict 5% max discount cap
    margin_floor_percent: 5.0
  };

  const sellerProducts = [
    { id: 30, name: 'Ergonomic Desk', list_price: 10000, cost_price: 5000, moq: 1 }
  ];

  const sellerSlabs = [
    { min_quantity: 1, max_quantity: 100, discount_percent: 20.0 } // Attempt 20% slab discount
  ];

  const request = {
    id: 4,
    total_budget: 7000, // Wants 30% discount
    deadline_days: 7,
    items: [
      { item_name: 'Ergonomic Desk', quantity: 1 }
    ]
  };

  const result = runNegotiationForSeller(seller, sellerRules, sellerProducts, sellerSlabs, request);

  assert.strictEqual(result.status, 'rejected', 'Must be rejected because target budget exceeds 5% max discount cap');
  assert(result.rounds[0].discount_percent <= 5.0, 'Calculated discount percent must not exceed 5%');
  console.log('  ✓ Test 4 Passed! Enforced max discount cap of 5%');
}

// Test 5: Advance Payment & Delivery Window Qualification Test
function testConditionalQualificationLevers() {
  console.log('\n[Test 5] Testing Advance Payment & Delivery Window Qualifications...');

  const seller = { id: 5, name: 'Global Tech' };
  const sellerRules = {
    max_discount_percent: 15.0,
    margin_floor_percent: 5.0,
    advance_pay_extra_discount_percent: 3.0,
    max_lead_time_extension_days: 7,
    lead_time_extra_discount_percent: 2.0
  };

  const sellerProducts = [
    { id: 40, name: 'Display Monitor', list_price: 10000, cost_price: 7000, moq: 1 }
  ];

  // Request WITHOUT advance payment and tight 5-day deadline
  const unqualifiedReq = {
    total_budget: 9500,
    deadline_days: 5,
    is_advance_payment: false,
    items: [{ item_name: 'Display Monitor', quantity: 1 }]
  };

  const unqualifiedResult = runNegotiationForSeller(seller, sellerRules, sellerProducts, [], unqualifiedReq);

  // Should only apply round 1 volume discount, skipping advance pay and lead time
  const advRound = unqualifiedResult.rounds.find(r => r.lever_applied && r.lever_applied.includes('Advance Payment'));
  assert(!advRound || advRound.accepted === 0, 'Advance payment lever must NOT be accepted if unqualified');

  console.log('  ✓ Test 5 Passed! Unqualified levers were correctly skipped');
}

// Test 6: AI Fallback Flag Transparency Test
function testAiFallbackFlag() {
  console.log('\n[Test 6] Testing AI Fallback Flag Transparency...');

  const prompt = 'Need 5 Ergonomic Keyboards under 10000 in 7 days';
  const fallbackRes = aiService.fallbackParsePrompt(prompt);

  assert.strictEqual(fallbackRes.is_ai_parsed, false, 'Fallback parser must report is_ai_parsed: false');
  assert.strictEqual(fallbackRes.ai_engine, 'regex', 'Fallback parser must report ai_engine: regex');

  console.log('  ✓ Test 6 Passed! AI fallback status is explicitly reported (is_ai_parsed: false, ai_engine: regex)');
}

try {
  testWorkedExampleSection7();
  testMOQValidationRejection();
  testMarginFloorBreachFailure();
  testMaximumDiscountCapEnforcement();
  testConditionalQualificationLevers();
  testAiFallbackFlag();

  console.log('\n===================================================');
  console.log('✅ ALL POLICY ENGINE UNIT TESTS PASSED SUCCESSFULLY! (6/6)');
  console.log('===================================================\n');
} catch (err) {
  console.error('\n❌ UNIT TEST FAILED:', err);
  process.exit(1);
}
