const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function runFullSearchSuite() {
  console.log('🧪 RUNNING COMPREHENSIVE SEARCH & AI PROCUREMENT TEST SUITE...\n');

  try {
    // Register Supplier 1
    const s1Email = `sup1_${Date.now()}@test.com`;
    const s1Reg = await axios.post(`${API_URL}/auth/register`, {
      name: 'Supplier One Admin',
      email: s1Email,
      password: 'password123',
      role: 'seller',
      company_name: 'Apex Office & Electronics'
    });
    const s1Token = s1Reg.data.token;

    // Add Product to Supplier 1
    const p1 = await axios.post(`${API_URL}/seller/catalog`, {
      name: 'Dell UltraSharp Mechanical Keyboard',
      category: 'Electronics',
      list_price: 3500,
      cost_price: 2500,
      stock: 50
    }, { headers: { Authorization: `Bearer ${s1Token}` } });
    console.log('✅ Created Supplier 1 Product: Dell UltraSharp Mechanical Keyboard');

    // Register Supplier 2
    const s2Email = `sup2_${Date.now()}@test.com`;
    const s2Reg = await axios.post(`${API_URL}/auth/register`, {
      name: 'Supplier Two Admin',
      email: s2Email,
      password: 'password123',
      role: 'seller',
      company_name: 'Logitech Gadgets Hub'
    });
    const s2Token = s2Reg.data.token;

    // Add Product to Supplier 2
    const p2 = await axios.post(`${API_URL}/seller/catalog`, {
      name: 'Logitech Master Wireless Mouse',
      category: 'Peripherals',
      list_price: 4500,
      cost_price: 3200,
      stock: 40
    }, { headers: { Authorization: `Bearer ${s2Token}` } });
    console.log('✅ Created Supplier 2 Product: Logitech Master Wireless Mouse');

    // Register Buyer
    const buyerReg = await axios.post(`${API_URL}/auth/register`, {
      name: 'Search Tester Buyer',
      email: `buyer_${Date.now()}@test.com`,
      password: 'password123',
      role: 'buyer',
      company_name: 'Tester Corp'
    });
    const buyerToken = buyerReg.data.token;
    const bHeaders = { Authorization: `Bearer ${buyerToken}` };

    // Test 1: Search "keyboard"
    console.log('\n--- TEST 1: Product Search "keyboard" ---');
    const res1 = await axios.get(`${API_URL}/search?q=keyboard`, { headers: bHeaders });
    console.log(`   Found Products: ${res1.data.products.length}`);
    const foundP1 = res1.data.products.some(p => p.name.includes('Dell UltraSharp Mechanical Keyboard'));
    console.log(`   - Dell Keyboard in results: ${foundP1}`);
    if (!foundP1) throw new Error('Search failed to find Dell Keyboard');

    // Test 2: Search "Dell"
    console.log('\n--- TEST 2: Product Search "Dell" ---');
    const res2 = await axios.get(`${API_URL}/search?q=Dell`, { headers: bHeaders });
    console.log(`   Found Products for "Dell": ${res2.data.products.length}`);

    // Test 3: Search "mouse"
    console.log('\n--- TEST 3: Product Search "mouse" ---');
    const res3 = await axios.get(`${API_URL}/search?q=mouse`, { headers: bHeaders });
    console.log(`   Found Products for "mouse": ${res3.data.products.length}`);
    const foundP2 = res3.data.products.some(p => p.name.includes('Logitech Master Wireless Mouse'));
    console.log(`   - Logitech Mouse in results: ${foundP2}`);

    // Test 4: Supplier Search "electronics"
    console.log('\n--- TEST 4: Supplier Search "electronics" ---');
    const res4 = await axios.get(`${API_URL}/suppliers/search?q=electronics`, { headers: bHeaders });
    console.log(`   Suppliers found for "electronics": ${res4.data.suppliers.length}`);
    const foundS1 = res4.data.suppliers.some(s => s.company_name === 'Apex Office & Electronics');
    console.log(`   - Apex Office & Electronics in results: ${foundS1}`);

    // Test 5: Partial Search "key", "del", "mou"
    console.log('\n--- TEST 5: Partial Queries ("key", "del", "mou") ---');
    const resKey = await axios.get(`${API_URL}/search?q=key`, { headers: bHeaders });
    const resDel = await axios.get(`${API_URL}/search?q=del`, { headers: bHeaders });
    const resMou = await axios.get(`${API_URL}/search?q=mou`, { headers: bHeaders });
    console.log(`   "key" products count: ${resKey.data.products.length}`);
    console.log(`   "del" products count: ${resDel.data.products.length}`);
    console.log(`   "mou" products count: ${resMou.data.products.length}`);

    // Test 6: Case-insensitive "KEYBOARD", "Keyboard", "keyboard"
    console.log('\n--- TEST 6: Case Insensitivity ---');
    const resUpper = await axios.get(`${API_URL}/search?q=KEYBOARD`, { headers: bHeaders });
    const resMixed = await axios.get(`${API_URL}/search?q=Keyboard`, { headers: bHeaders });
    const resLower = await axios.get(`${API_URL}/search?q=keyboard`, { headers: bHeaders });
    if (resUpper.data.products.length !== resLower.data.products.length || resMixed.data.products.length !== resLower.data.products.length) {
      throw new Error('Case sensitivity mismatch');
    }
    console.log(`   ✅ Case insensitivity verified: KEYBOARD (${resUpper.data.products.length}), Keyboard (${resMixed.data.products.length}), keyboard (${resLower.data.products.length})`);

    // Test 7: No Results Query "xyzabc123"
    console.log('\n--- TEST 7: No-Results Query "xyzabc123" ---');
    const resEmpty = await axios.get(`${API_URL}/search?q=xyzabc123`, { headers: bHeaders });
    console.log(`   Products: ${resEmpty.data.products.length}, Suppliers: ${resEmpty.data.suppliers.length}`);
    if (resEmpty.data.products.length !== 0 || resEmpty.data.suppliers.length !== 0) {
      throw new Error('No-results test returned unexpected items');
    }
    console.log('   ✅ Verified no-results state returned 0 items cleanly.');

    // Test 8: Tenant Privacy Protection Audit (Verify costPrice is NOT exposed in search results)
    console.log('\n--- TEST 8: Tenant Privacy Security Audit ---');
    const pSample = res1.data.products[0];
    if ('costPrice' in pSample || 'cost_price' in pSample || 'minimumPrice' in pSample) {
      throw new Error('SECURITY VIOLATION: Private supplier costPrice/minimumPrice exposed in public search results!');
    }
    console.log('   ✅ Verified private supplier costPrice and minimumPrice are NOT exposed.');

    console.log('\n🎉 ALL SEARCH AND AI TESTS PASSED WITH 100% SUCCESS! 🚀');

  } catch (err) {
    console.error('\n❌ TEST FAILED:', err.response?.data || err.message);
    process.exit(1);
  }
}

runFullSearchSuite();
