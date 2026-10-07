const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testMultiTenantIsolation() {
  console.log('🧪 STARTING MULTI-TENANT SUPPLIER ISOLATION VERIFICATION TEST...\n');

  try {
    // 1. Register Supplier A
    const emailA = `supplier_a_${Date.now()}@test.com`;
    console.log(`1. Registering Supplier A (${emailA})...`);
    const regResA = await axios.post(`${API_URL}/auth/register`, {
      name: 'Supplier A Admin',
      email: emailA,
      password: 'password123',
      role: 'seller',
      company_name: 'Supplier A Logistics Ltd'
    });
    const tokenA = regResA.data.token;
    console.log('   ✅ Supplier A registered successfully.');

    // 2. Register Supplier B
    const emailB = `supplier_b_${Date.now()}@test.com`;
    console.log(`2. Registering Supplier B (${emailB})...`);
    const regResB = await axios.post(`${API_URL}/auth/register`, {
      name: 'Supplier B Admin',
      email: emailB,
      password: 'password123',
      role: 'seller',
      company_name: 'Supplier B Electronics Ltd'
    });
    const tokenB = regResB.data.token;
    console.log('   ✅ Supplier B registered successfully.');

    // 3. Verify Supplier B starts with EMPTY catalog
    console.log('\n3. Verifying Supplier B initial catalog...');
    const catResBInitial = await axios.get(`${API_URL}/seller/catalog`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    console.log(`   Supplier B initial catalog count: ${catResBInitial.data.catalog.length}`);
    if (catResBInitial.data.catalog.length !== 0) {
      throw new Error('❌ ISOLATION FAILURE: New Supplier B inherited existing products!');
    }
    console.log('   ✅ VERIFIED: New Supplier B starts with 0 products in catalog.');

    // 4. Create Product under Supplier A
    console.log('\n4. Creating Product under Supplier A...');
    const prodResA = await axios.post(`${API_URL}/seller/catalog`, {
      name: 'Supplier A Premium Laptop',
      category: 'Laptops',
      list_price: 95000,
      cost_price: 70000,
      stock: 50
    }, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const productAId = prodResA.data.product.id;
    console.log(`   ✅ Created Product A (${productAId}): Supplier A Premium Laptop`);

    // 5. Create Product under Supplier B
    console.log('\n5. Creating Product under Supplier B...');
    const prodResB = await axios.post(`${API_URL}/seller/catalog`, {
      name: 'Supplier B Gaming Monitor',
      category: 'Monitors',
      list_price: 32000,
      cost_price: 22000,
      stock: 30
    }, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    const productBId = prodResB.data.product.id;
    console.log(`   ✅ Created Product B (${productBId}): Supplier B Gaming Monitor`);

    // 6. Fetch Catalog for Supplier A and check isolation
    console.log('\n6. Fetching Supplier A Catalog...');
    const catResA = await axios.get(`${API_URL}/seller/catalog`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const catalogA = catResA.data.catalog;
    console.log(`   Supplier A product count: ${catalogA.length}`);
    const hasProductAInA = catalogA.some(p => p.name === 'Supplier A Premium Laptop');
    const hasProductBInA = catalogA.some(p => p.name === 'Supplier B Gaming Monitor');
    console.log(`   - Contains Supplier A Laptop: ${hasProductAInA}`);
    console.log(`   - Contains Supplier B Monitor: ${hasProductBInA}`);
    if (!hasProductAInA || hasProductBInA) {
      throw new Error('❌ ISOLATION FAILURE: Supplier A sees Supplier B product or is missing own product!');
    }
    console.log('   ✅ VERIFIED: Supplier A sees ONLY Supplier A products.');

    // 7. Fetch Catalog for Supplier B and check isolation
    console.log('\n7. Fetching Supplier B Catalog...');
    const catResB = await axios.get(`${API_URL}/seller/catalog`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    const catalogB = catResB.data.catalog;
    console.log(`   Supplier B product count: ${catalogB.length}`);
    const hasProductAInB = catalogB.some(p => p.name === 'Supplier A Premium Laptop');
    const hasProductBInB = catalogB.some(p => p.name === 'Supplier B Gaming Monitor');
    console.log(`   - Contains Supplier A Laptop: ${hasProductAInB}`);
    console.log(`   - Contains Supplier B Monitor: ${hasProductBInB}`);
    if (hasProductAInB || !hasProductBInB) {
      throw new Error('❌ ISOLATION FAILURE: Supplier B sees Supplier A product or is missing own product!');
    }
    console.log('   ✅ VERIFIED: Supplier B sees ONLY Supplier B products.');

    // 8. Fetch Summaries for both suppliers
    console.log('\n8. Checking Summary isolation...');
    const sumA = (await axios.get(`${API_URL}/seller/summary`, { headers: { Authorization: `Bearer ${tokenA}` } })).data.summary;
    const sumB = (await axios.get(`${API_URL}/seller/summary`, { headers: { Authorization: `Bearer ${tokenB}` } })).data.summary;

    console.log(`   Supplier A Total Products: ${sumA.totalProducts} | Active Products: ${sumA.activeProducts}`);
    console.log(`   Supplier B Total Products: ${sumB.totalProducts} | Active Products: ${sumB.activeProducts}`);

    if (sumA.totalProducts !== 1 || sumB.totalProducts !== 1) {
      throw new Error('❌ ISOLATION FAILURE: Product counts in summary do not match tenant isolation!');
    }

    console.log('\n🎉 ALL MULTI-TENANT DATA ISOLATION TESTS PASSED CLEANLY! 🚀');

  } catch (err) {
    console.error('\n❌ TEST ERROR:', err.response?.data || err.message);
    process.exit(1);
  }
}

testMultiTenantIsolation();
