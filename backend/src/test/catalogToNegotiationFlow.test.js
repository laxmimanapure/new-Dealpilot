const assert = require('assert');
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// Models
const User = require('../models/User');
const Product = require('../models/Product');
const ProductRule = require('../models/ProductRule');
const ProcurementRequirement = require('../models/ProcurementRequirement');
const SellerOffer = require('../models/SellerOffer');
const Negotiation = require('../models/Negotiation');
const Order = require('../models/Order');
const AuditLog = require('../models/AuditLog');

// Services & Routes
const {
  processRequirementMatchingAndNegotiation,
  buildItemNegotiationProfile,
  executeMultiItemNegotiation,
  matchProductToItem
} = require('../services/negotiationEngine');
const { cleanProductName, fallbackParsePrompt } = require('../services/aiService');
const buyerRoutes = require('../routes/buyerRoutes');
const aiRoutes = require('../routes/aiRoutes');

console.log('=========================================================================');
console.log('🚀 Running Catalog -> Request Creation -> Negotiation -> Plans Test Suite');
console.log('=========================================================================\n');

const dbStore = {
  users: [],
  products: [],
  rules: [],
  requirements: [],
  offers: [],
  negotiations: [],
  orders: [],
  audits: []
};

function resetStore() {
  dbStore.users = [];
  dbStore.products = [];
  dbStore.rules = [];
  dbStore.requirements = [];
  dbStore.offers = [];
  dbStore.negotiations = [];
  dbStore.orders = [];
  dbStore.audits = [];
}

function matchesFilter(doc, filter = {}) {
  for (const [k, v] of Object.entries(filter)) {
    if (k === '$or' && Array.isArray(v)) {
      if (!v.some(sub => matchesFilter(doc, sub))) return false;
      continue;
    }
    const actual = doc[k];
    if (v instanceof RegExp) {
      if (!v.test(String(actual || ''))) return false;
    } else if (v && typeof v === 'object' && !(v instanceof mongoose.Types.ObjectId)) {
      if (v.$in && !v.$in.map(x => String(x)).includes(String(actual?._id || actual))) return false;
      if (v.$ne !== undefined && actual === v.$ne) return false;
      if (v.$regex instanceof RegExp && !v.$regex.test(String(actual || ''))) return false;
    } else if (k === '_id' || k.endsWith('Id')) {
      const actualId = actual && actual._id ? actual._id : actual;
      if (String(actualId) !== String(v)) return false;
    } else if (actual !== v) {
      return false;
    }
  }
  return true;
}

function makeQuery(result, populateField) {
  const applyPopulate = (item) => {
    if (!item) return item;
    const copy = { ...item };
    if (populateField === 'sellerId' && copy.sellerId) {
      const sellerIdStr = String(copy.sellerId._id || copy.sellerId);
      const sellerDoc = dbStore.users.find(u => String(u._id) === sellerIdStr);
      if (sellerDoc) {
        copy.sellerId = {
          _id: sellerDoc._id,
          name: sellerDoc.name,
          companyName: sellerDoc.companyName,
          email: sellerDoc.email
        };
      }
    }
    return copy;
  };

  let shouldPopulate = false;
  const q = {
    populate: function (field) {
      if (field === 'sellerId') shouldPopulate = true;
      return this;
    },
    select: function () { return this; },
    sort: function () { return this; },
    lean: async function () {
      if (Array.isArray(result)) {
        return result.map(r => (shouldPopulate ? applyPopulate(r) : { ...r }));
      }
      return result ? (shouldPopulate ? applyPopulate(result) : { ...result }) : null;
    },
    then: function (resolve, reject) {
      const out = Array.isArray(result)
        ? result.map(r => (shouldPopulate ? applyPopulate(r) : r))
        : (shouldPopulate ? applyPopulate(result) : result);
      return Promise.resolve(out).then(resolve, reject);
    }
  };
  return q;
}

function attachSave(doc, collection) {
  if (!doc._id) doc._id = new mongoose.Types.ObjectId();
  doc.save = async function () {
    const idx = collection.findIndex(x => String(x._id) === String(doc._id));
    if (idx >= 0) collection[idx] = doc;
    else collection.push(doc);
    return doc;
  };
  return doc;
}

// Stub Mongoose methods on in-memory store
User.find = (filter = {}) => makeQuery(dbStore.users.filter(u => matchesFilter(u, filter)));
User.findById = (id) => makeQuery(dbStore.users.find(u => String(u._id) === String(id)) || null);

Product.find = (filter = {}) => makeQuery(dbStore.products.filter(p => matchesFilter(p, filter)), 'sellerId');
Product.findOne = (filter = {}) => makeQuery(dbStore.products.find(p => matchesFilter(p, filter)) || null, 'sellerId');
Product.countDocuments = async (filter = {}) => dbStore.products.filter(p => matchesFilter(p, filter)).length;

ProductRule.find = (filter = {}) => makeQuery(dbStore.rules.filter(r => matchesFilter(r, filter)));
ProductRule.findOne = (filter = {}) => makeQuery(dbStore.rules.find(r => matchesFilter(r, filter)) || null);

ProcurementRequirement.create = async (data) => {
  const doc = attachSave({
    _id: new mongoose.Types.ObjectId(),
    createdAt: new Date(),
    ...data
  }, dbStore.requirements);
  dbStore.requirements.push(doc);
  return doc;
};
ProcurementRequirement.findOne = (filter = {}) =>
  makeQuery(dbStore.requirements.find(r => matchesFilter(r, filter)) || null);
ProcurementRequirement.find = (filter = {}) =>
  makeQuery(dbStore.requirements.filter(r => matchesFilter(r, filter)));

SellerOffer.deleteMany = async (filter = {}) => {
  dbStore.offers = dbStore.offers.filter(o => !matchesFilter(o, filter));
};
SellerOffer.create = async (data) => {
  const doc = attachSave({
    _id: new mongoose.Types.ObjectId(),
    createdAt: new Date(),
    ...data
  }, dbStore.offers);
  dbStore.offers.push(doc);
  return doc;
};
SellerOffer.find = (filter = {}) =>
  makeQuery(dbStore.offers.filter(o => matchesFilter(o, filter)), 'sellerId');

Negotiation.deleteMany = async (filter = {}) => {
  dbStore.negotiations = dbStore.negotiations.filter(n => !matchesFilter(n, filter));
};
Negotiation.create = async (data) => {
  const doc = attachSave({
    _id: new mongoose.Types.ObjectId(),
    createdAt: new Date(),
    ...data
  }, dbStore.negotiations);
  dbStore.negotiations.push(doc);
  return doc;
};

Order.countDocuments = async () => 0;
AuditLog.create = async (data) => {
  dbStore.audits.push(data);
  return data;
};

function seedClothSellerAndBuyer() {
  resetStore();
  const sellerId = new mongoose.Types.ObjectId('6ac5ed6c9029ec21769fbec5');
  const buyerId = new mongoose.Types.ObjectId('6ab253b2c693622238282008');
  const clothProductId = new mongoose.Types.ObjectId('6ad1ccfe59602a391863ce8a');
  const clothRuleId = new mongoose.Types.ObjectId('6ad1ccfe59602a391863ce8b');

  const seller = {
    _id: sellerId,
    name: 'Mayuri Supplier',
    companyName: 'Mayuri Textiles & Office Supplies',
    email: 'mayuri@supplier.in',
    role: 'seller'
  };
  const buyer = {
    _id: buyerId,
    name: 'Laxmi Manapure',
    companyName: 'BrightPath Edu',
    email: 'buyer@brightpath.edu',
    role: 'buyer'
  };

  const clothProduct = {
    _id: clothProductId,
    sellerId,
    name: 'cloth',
    category: 'Peripherals',
    description: 'High quality cloth material',
    sku: 'SKU-CLOTH-01',
    price: 1000,
    costPrice: 700,
    stock: 100,
    unit: 'units',
    moq: 10,
    standardLeadTimeDays: 5,
    active: true
  };

  const clothRule = {
    _id: clothRuleId,
    productId: clothProductId,
    sellerId,
    minimumPrice: 850,
    maximumDiscountPercent: 10,
    maximumDiscountAmount: 100,
    marginFloorPercent: 8,
    bulkDiscountRules: [
      { minQuantity: 30, maxQuantity: 100, discountPercent: 2 }
    ],
    advancePaymentDiscountPercent: 2,
    leadTimeRules: {
      standardLeadTimeDays: 5,
      maxLeadTimeExtensionDays: 7,
      flexibleDeliveryDiscountPercent: 1
    }
  };

  dbStore.users.push(seller, buyer);
  dbStore.products.push(clothProduct);
  dbStore.rules.push(clothRule);

  return { seller, buyer, clothProduct, clothRule };
}

async function runTests() {
  // =========================================================================
  // TEST 1: Seller product visible in catalog -> matched in negotiation
  // =========================================================================
  console.log('[Test 1] Seller product visible in catalog -> matched in negotiation...');
  {
    const { clothProduct } = seedClothSellerAndBuyer();

    // Verify cleanProductName & fallbackParsePrompt do not corrupt "(Peripherals)" or delivery clauses
    assert.strictEqual(cleanProductName('cloth (Peripherals)').toLowerCase(), 'cloth');
    assert.strictEqual(cleanProductName('10 units of cloth (Peripherals)').toLowerCase(), 'cloth');
    assert.strictEqual(cleanProductName('Monitor 24 Inch'), 'Monitor 24 Inch');

    const parsedDelivery = fallbackParsePrompt(
      'I need 10 units of cloth (Peripherals) under ₹10,000 and I need delivery within 7 days'
    );
    assert.strictEqual(parsedDelivery.items.length, 1, 'Delivery clause must not create a bogus Delivery item');
    assert.strictEqual(parsedDelivery.items[0].item_name.toLowerCase(), 'cloth');
    assert.strictEqual(parsedDelivery.items[0].quantity, 10);

    const requirement = await ProcurementRequirement.create({
      buyerId: new mongoose.Types.ObjectId(),
      rawPrompt: 'I need 10 units of cloth',
      parsedSummary: 'Requirement for 10x cloth',
      items: [{ productId: clothProduct._id, item_name: 'cloth', quantity: 10 }],
      targetBudget: 10000,
      deadlineDays: 7,
      isAdvancePayment: false,
      status: 'MATCHING'
    });

    const offers = await processRequirementMatchingAndNegotiation(requirement);
    assert.strictEqual(offers.length, 1, 'Expected 1 matched seller offer for cloth');
    assert.strictEqual(offers[0].status, 'VALID', 'Offer should be VALID within ₹10,000 budget');
    assert.strictEqual(offers[0].isBestDeal, true, 'Valid offer should be marked isBestDeal');
    assert.strictEqual(String(offers[0].items[0].productId), String(clothProduct._id));
    console.log('  ✓ Test 1 Passed! Offer status:', offers[0].status, 'Negotiated amount: ₹' + offers[0].negotiatedAmount);
  }

  // =========================================================================
  // TEST 2: Product ID preservation & mismatch recovery + duplicate seller product selection
  // =========================================================================
  console.log('\n[Test 2] Product ID mismatch recovery & duplicate seller product stock resolution...');
  {
    const { seller, clothProduct } = seedClothSellerAndBuyer();

    // 2a: Stale/mismatched productId in request item still resolves to active catalog product by name
    const staleProductId = new mongoose.Types.ObjectId();
    const reqWithMismatchedId = await ProcurementRequirement.create({
      buyerId: new mongoose.Types.ObjectId(),
      rawPrompt: 'I need 20 units of cloth',
      parsedSummary: 'Requirement for 20x cloth',
      items: [{ productId: staleProductId, item_name: 'cloth (Peripherals)', quantity: 20 }],
      targetBudget: 25000,
      deadlineDays: 7,
      status: 'MATCHING'
    });

    const offers = await processRequirementMatchingAndNegotiation(reqWithMismatchedId);
    assert.strictEqual(offers.length, 1, 'Should recover from stale productId and match active cloth product');
    assert.strictEqual(offers[0].status, 'VALID');
    assert.strictEqual(String(offers[0].items[0].productId), String(clothProduct._id));

    // 2b: Same seller has two products with the same name ("eraser"), one with stock 100 and one with stock 1000
    const eraserLowStockId = new mongoose.Types.ObjectId();
    const eraserHighStockId = new mongoose.Types.ObjectId();
    dbStore.products.push(
      {
        _id: eraserLowStockId,
        sellerId: seller._id,
        name: 'eraser',
        category: 'Stationery',
        price: 100,
        costPrice: 60,
        stock: 100,
        moq: 10,
        standardLeadTimeDays: 3,
        active: true
      },
      {
        _id: eraserHighStockId,
        sellerId: seller._id,
        name: 'eraser',
        category: 'Stationery',
        price: 100,
        costPrice: 60,
        stock: 1000,
        moq: 10,
        standardLeadTimeDays: 3,
        active: true
      }
    );

    const eraserReq = await ProcurementRequirement.create({
      buyerId: new mongoose.Types.ObjectId(),
      rawPrompt: '200 erasers',
      parsedSummary: '200x eraser',
      items: [{ item_name: 'eraser', quantity: 200 }],
      targetBudget: 25000,
      deadlineDays: 7,
      status: 'MATCHING'
    });

    const eraserOffers = await processRequirementMatchingAndNegotiation(eraserReq);
    assert.strictEqual(eraserOffers.length, 1);
    assert.strictEqual(eraserOffers[0].status, 'VALID', 'Should pick the 1000-stock eraser product instead of failing on the 100-stock duplicate');
    assert.strictEqual(String(eraserOffers[0].items[0].productId), String(eraserHighStockId));
    console.log('  ✓ Test 2 Passed! Stale productId recovered & high-stock duplicate candidate selected.');
  }

  // =========================================================================
  // TEST 3: Missing or mismatched ProductRule -> safe fallback, not silent failure
  // =========================================================================
  console.log('\n[Test 3] Missing or mismatched ProductRule safe fallback...');
  {
    const { seller, clothProduct } = seedClothSellerAndBuyer();

    // 3a: Remove ProductRule completely -> fallback to product defaults
    dbStore.rules = [];
    const profileNoRule = buildItemNegotiationProfile(clothProduct, null, 15);
    assert.strictEqual(profileNoRule.unitListPrice, 1000);
    assert(profileNoRule.effectiveMinAllowedPrice >= 15 * 700, 'Must enforce cost/margin floor even when ProductRule is missing');

    // 3b: Mismatched ProductRule belonging to another seller/product -> ignored safely
    const foreignRule = {
      _id: new mongoose.Types.ObjectId(),
      productId: new mongoose.Types.ObjectId(),
      sellerId: new mongoose.Types.ObjectId(),
      minimumPrice: 999999, // Would break pricing if mistakenly applied
      maximumDiscountPercent: 0
    };
    const profileMismatchedRule = buildItemNegotiationProfile(clothProduct, foreignRule, 10);
    assert(profileMismatchedRule.effectiveMinAllowedPrice < 999999, 'Foreign rule minimumPrice must be ignored');

    const reqWithoutRule = await ProcurementRequirement.create({
      buyerId: new mongoose.Types.ObjectId(),
      rawPrompt: '15 cloth',
      parsedSummary: '15x cloth',
      items: [{ productId: clothProduct._id, item_name: 'cloth', quantity: 15 }],
      targetBudget: 16000,
      deadlineDays: 7,
      status: 'MATCHING'
    });

    const offers = await processRequirementMatchingAndNegotiation(reqWithoutRule);
    assert.strictEqual(offers.length, 1);
    assert.strictEqual(offers[0].status, 'VALID', 'Offer should succeed with safe product defaults when ProductRule is missing');
    assert.strictEqual(offers[0].sellerId.toString(), seller._id.toString());
    console.log('  ✓ Test 3 Passed! Missing and mismatched ProductRule handled safely.');
  }

  // =========================================================================
  // TEST 4: Insufficient stock or unmet MOQ -> seller offer rejected with exact reason
  // =========================================================================
  console.log('\n[Test 4] Insufficient stock or unmet MOQ -> rejected with exact reason...');
  {
    const { clothProduct } = seedClothSellerAndBuyer();

    // 4a: Unmet MOQ (requesting 5 when MOQ is 10)
    const moqReq = await ProcurementRequirement.create({
      buyerId: new mongoose.Types.ObjectId(),
      rawPrompt: '5 cloth',
      parsedSummary: '5x cloth',
      items: [{ productId: clothProduct._id, item_name: 'cloth', quantity: 5 }],
      targetBudget: 10000,
      deadlineDays: 7,
      status: 'MATCHING'
    });

    const moqOffers = await processRequirementMatchingAndNegotiation(moqReq);
    assert.strictEqual(moqOffers.length, 1);
    assert.strictEqual(moqOffers[0].status, 'REJECTED');
    assert.strictEqual(moqOffers[0].isBestDeal, false);
    assert(
      moqOffers[0].rejectionReason.includes('MOQ breach') &&
      moqOffers[0].rejectionReason.includes('MOQ: 10'),
      `Unexpected MOQ rejection reason: ${moqOffers[0].rejectionReason}`
    );

    // 4b: Insufficient stock (requesting 150 when stock is 100)
    const stockReq = await ProcurementRequirement.create({
      buyerId: new mongoose.Types.ObjectId(),
      rawPrompt: '150 cloth',
      parsedSummary: '150x cloth',
      items: [{ productId: clothProduct._id, item_name: 'cloth', quantity: 150 }],
      targetBudget: 200000,
      deadlineDays: 7,
      status: 'MATCHING'
    });

    const stockOffers = await processRequirementMatchingAndNegotiation(stockReq);
    assert.strictEqual(stockOffers.length, 1);
    assert.strictEqual(stockOffers[0].status, 'REJECTED');
    assert.strictEqual(stockOffers[0].isBestDeal, false);
    assert(
      stockOffers[0].rejectionReason.includes('Stock deficit') &&
      stockOffers[0].rejectionReason.includes('100 units in stock'),
      `Unexpected Stock rejection reason: ${stockOffers[0].rejectionReason}`
    );
    console.log('  ✓ Test 4 Passed! Unmet MOQ and Stock Deficit produce exact REJECTED reasons.');
  }

  // =========================================================================
  // TEST 5: Seller price floor higher than buyer budget -> OVER_BUDGET with exact reason
  // =========================================================================
  console.log('\n[Test 5] Seller price floor higher than buyer budget -> OVER_BUDGET offer...');
  {
    const { clothProduct } = seedClothSellerAndBuyer();

    // 10 units of cloth has list price ₹10,000 and maxDiscountAmount ₹100 (floor ₹9,900).
    // Buyer budget is ₹5,000.
    const lowBudgetReq = await ProcurementRequirement.create({
      buyerId: new mongoose.Types.ObjectId(),
      rawPrompt: '10 cloth under 5000',
      parsedSummary: '10x cloth',
      items: [{ productId: clothProduct._id, item_name: 'cloth', quantity: 10 }],
      targetBudget: 5000,
      deadlineDays: 7,
      status: 'MATCHING'
    });

    const offers = await processRequirementMatchingAndNegotiation(lowBudgetReq);
    assert.strictEqual(offers.length, 1);
    assert.strictEqual(offers[0].status, 'OVER_BUDGET');
    assert.strictEqual(offers[0].isBestDeal, false, 'OVER_BUDGET offer must never be marked as best deal');
    assert(
      offers[0].rejectionReason.includes('exceeds buyer target budget of ₹5,000'),
      `Unexpected over-budget reason: ${offers[0].rejectionReason}`
    );
    console.log('  ✓ Test 5 Passed! Over-budget offer marked OVER_BUDGET with exact reason:', offers[0].rejectionReason);
  }

  // =========================================================================
  // TEST 6: End-to-End HTTP Route Flow:
  // GET /api/buyer/catalog -> POST /api/buyer/requests -> GET /api/buyer/requests/:id/plans
  // =========================================================================
  console.log('\n[Test 6] End-to-end API flow: Catalog -> Create Request -> Ranked Plans...');
  {
    const { buyer, clothProduct } = seedClothSellerAndBuyer();

    const app = express();
    app.use(express.json());
    app.use('/api/buyer', buyerRoutes);
    app.use('/api/ai', aiRoutes);

    const server = await new Promise(resolve => {
      const s = app.listen(0, () => resolve(s));
    });
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}/api`;
    const { JWT_SECRET } = require('../middleware/auth');
    const token = jwt.sign(
      { id: String(buyer._id), email: buyer.email, role: 'buyer', name: buyer.name },
      JWT_SECRET
    );
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    };

    try {
      // Step A: Buyer searches for "cloth" in GET /api/buyer/catalog
      const catalogRes = await fetch(`${baseUrl}/buyer/catalog?search=cloth`, { headers });
      assert.strictEqual(catalogRes.status, 200);
      const catalogData = await catalogRes.json();
      assert.strictEqual(catalogData.catalog.length, 1);
      const selectedCatalogItem = catalogData.catalog[0];
      assert.strictEqual(String(selectedCatalogItem.id), String(clothProduct._id));
      assert.strictEqual(selectedCatalogItem.name, 'cloth');
      assert.strictEqual(selectedCatalogItem.moq, 10);

      // Step B: Buyer creates procurement request with selected catalog product, quantity 30, budget ₹30,000
      const createRes = await fetch(`${baseUrl}/buyer/requests`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          promptText: `I need 30 units of ${selectedCatalogItem.name}`,
          total_budget: 30000,
          deadline_days: 7,
          items: [
            {
              productId: selectedCatalogItem.id,
              sellerId: selectedCatalogItem.seller_id,
              category: selectedCatalogItem.category,
              item_name: selectedCatalogItem.name,
              quantity: 30
            }
          ]
        })
      });
      assert.strictEqual(createRes.status, 201);
      const createData = await createRes.json();
      assert.strictEqual(createData.offers_count, 1, 'POST /api/buyer/requests must generate 1 offer');
      assert.strictEqual(createData.requirement.status, 'OFFER_READY');
      assert.strictEqual(String(createData.requirement.items[0].productId), String(clothProduct._id));

      const reqId = createData.requirement.id;

      // Step C: Buyer opens Ranked Procurement Deals (GET /api/buyer/requests/:id/plans)
      const plansRes = await fetch(`${baseUrl}/buyer/requests/${reqId}/plans`, { headers });
      assert.strictEqual(plansRes.status, 200);
      const plansData = await plansRes.json();
      assert.strictEqual(plansData.plans.length, 1, 'GET /api/buyer/requests/:id/plans must return 1 ranked plan');

      const plan = plansData.plans[0];
      assert.strictEqual(plan.status, 'VALID');
      assert.strictEqual(plan.is_best_deal, true);
      assert.strictEqual(plan.seller_name, 'Mayuri Textiles & Office Supplies');
      assert.strictEqual(plan.total_requested_units, 30);
      assert.strictEqual(plan.original_amount, 30000);
      // 30 units qualifies for 2% bulk slab (₹600), capped by maximumDiscountAmount ₹100 -> ₹29,900
      assert.strictEqual(plan.negotiated_amount, 29900);
      assert.strictEqual(plan.savings, 100);
      assert.strictEqual(plan.items.length, 1);
      assert.strictEqual(String(plan.items[0].productId), String(clothProduct._id));

      console.log('  ✓ Test 6 Passed! Full HTTP flow returned VALID offer: ₹' + plan.negotiated_amount + ' (Saved ₹' + plan.savings + ')');
    } finally {
      server.close();
    }
  }

  console.log('\n=========================================================================');
  console.log('✅ ALL 6 CATALOG-TO-NEGOTIATION REGRESSION TESTS PASSED SUCCESSFULLY!');
  console.log('=========================================================================\n');
}

runTests().catch(err => {
  console.error('\n❌ TEST SUITE FAILED:', err);
  process.exit(1);
});
