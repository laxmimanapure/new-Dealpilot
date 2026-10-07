const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testAiAndSearch() {
  console.log('🧪 TESTING AI PROCUREMENT ASSISTANT & REAL SEARCH APIs...\n');

  try {
    // Register/Login a buyer user
    const email = `buyer_test_${Date.now()}@test.com`;
    const regRes = await axios.post(`${API_URL}/auth/register`, {
      name: 'Test Buyer User',
      email,
      password: 'password123',
      role: 'buyer',
      company_name: 'TechCorp Institute'
    });
    const token = regRes.data.token;
    const headers = { Authorization: `Bearer ${token}` };

    console.log('1. Testing Global Search API (GET /api/search?q=keyboard)...');
    const searchRes = await axios.get(`${API_URL}/search?q=keyboard`, { headers });
    console.log(`   Found Products: ${searchRes.data.products.length}`);
    console.log(`   Found Suppliers: ${searchRes.data.suppliers.length}`);

    console.log('\n2. Testing Product Search API (GET /api/products/search?q=key)...');
    const prodRes = await axios.get(`${API_URL}/products/search?q=key`, { headers });
    console.log(`   Matching Products count for "key": ${prodRes.data.products.length}`);

    console.log('\n3. Testing Supplier Search API (GET /api/suppliers/search?q=office)...');
    const supRes = await axios.get(`${API_URL}/suppliers/search?q=office`, { headers });
    console.log(`   Matching Suppliers count for "office": ${supRes.data.suppliers.length}`);

    console.log('\n4. Testing AI Procurement Analysis (POST /api/ai/analyze-procurement)...');
    const aiRes = await axios.post(`${API_URL}/ai/analyze-procurement`, {
      promptText: 'I need 50 Dell keyboards, 20 wireless mice and 10 monitors for my office. My total budget is ₹1,00,000 and I need delivery within 7 days.'
    }, { headers });

    const analysis = aiRes.data.analysis;
    console.log('   AI Summary:', analysis.parsed_summary);
    console.log('   Extracted Budget:', analysis.total_budget);
    console.log('   Extracted Delivery Days:', analysis.deadline_days);
    console.log('   Extracted Items:', JSON.stringify(analysis.items, null, 2));
    console.log('   Clarification Questions:', aiRes.data.analysis.clarification_questions || []);
    console.log('   DB Products Matched:', aiRes.data.dbMatches.products.length);
    console.log('   Web Research Items Found:', aiRes.data.webResults.length);
    if (aiRes.data.webResults.length > 0) {
      console.log('   Sample Web Result:', aiRes.data.webResults[0]);
    }

    console.log('\n🎉 AI ANALYSIS AND REAL SEARCH API TESTS PASSED SUCCESSFULLY! 🚀');

  } catch (err) {
    console.error('❌ TEST FAILED:', err.response?.data || err.message);
    process.exit(1);
  }
}

testAiAndSearch();
