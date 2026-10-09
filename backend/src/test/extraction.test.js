const assert = require('assert');
const { parseBuyerPrompt, fallbackParsePrompt } = require('../services/aiService');

console.log('===================================================');
console.log('🚀 Running Buyer Requirement Extraction Tests');
console.log('===================================================\n');

(async () => {
  try {
    // Example 1
    console.log('[Test 1] "I need 30 pencils in 5 days, budget 300 rs."');
    const res1 = await parseBuyerPrompt("I need 30 pencils in 5 days, budget 300 rs.");
    assert.strictEqual(res1.items[0].item_name, 'Pencils', 'Item name must be "Pencils"');
    assert.strictEqual(res1.items[0].quantity, 30, 'Quantity must be 30');
    assert.strictEqual(res1.total_budget, 300, 'Total budget must be ₹300');
    assert.strictEqual(res1.deadline_days, 5, 'Deadline must be 5 days');
    console.log('  ✓ Test 1 Passed:', JSON.stringify({ item: res1.items[0].item_name, qty: res1.items[0].quantity, budget: res1.total_budget, deadline: res1.deadline_days }));

    // Example 2
    console.log('\n[Test 2] "Need 20 keyboards under ₹15,000 within 7 days."');
    const res2 = await parseBuyerPrompt("Need 20 keyboards under ₹15,000 within 7 days.");
    assert.strictEqual(res2.items[0].item_name, 'Keyboards', 'Item name must be "Keyboards"');
    assert.strictEqual(res2.items[0].quantity, 20, 'Quantity must be 20');
    assert.strictEqual(res2.total_budget, 15000, 'Total budget must be ₹15,000');
    assert.strictEqual(res2.deadline_days, 7, 'Deadline must be 7 days');
    console.log('  ✓ Test 2 Passed:', JSON.stringify({ item: res2.items[0].item_name, qty: res2.items[0].quantity, budget: res2.total_budget, deadline: res2.deadline_days }));

    // Example 3
    console.log('\n[Test 3] "I need 10 pens and 5 notebooks, total budget ₹500."');
    const res3 = await parseBuyerPrompt("I need 10 pens and 5 notebooks, total budget ₹500.");
    assert.strictEqual(res3.items.length, 2, 'Must extract 2 items');
    assert.strictEqual(res3.items[0].item_name, 'Pens', 'First item name must be "Pens"');
    assert.strictEqual(res3.items[0].quantity, 10, 'First item quantity must be 10');
    assert.strictEqual(res3.items[1].item_name, 'Notebooks', 'Second item name must be "Notebooks"');
    assert.strictEqual(res3.items[1].quantity, 5, 'Second item quantity must be 5');
    assert.strictEqual(res3.total_budget, 500, 'Total budget must be ₹500');
    console.log('  ✓ Test 3 Passed:', JSON.stringify({ items: res3.items, budget: res3.total_budget }));

    // Example 4
    console.log('\n[Test 4] "I need pencils, budget ₹300."');
    const res4 = await parseBuyerPrompt("I need pencils, budget ₹300.");
    assert.strictEqual(res4.items[0].item_name, 'Pencils', 'Item name must be "Pencils"');
    assert.strictEqual(res4.items[0].quantity, 1, 'Quantity must default to 1 when unspecified');
    assert.strictEqual(res4.total_budget, 300, 'Total budget must be ₹300');
    console.log('  ✓ Test 4 Passed:', JSON.stringify({ item: res4.items[0].item_name, qty: res4.items[0].quantity, budget: res4.total_budget }));

    console.log('\n===================================================');
    console.log('✅ ALL EXTRACTION TESTS PASSED SUCCESSFULLY! (4/4)');
    console.log('===================================================\n');
  } catch (err) {
    console.error('\n❌ EXTRACTION TEST FAILED:', err);
    process.exit(1);
  }
})();
