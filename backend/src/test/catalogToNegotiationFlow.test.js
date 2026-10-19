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

  // =========================================================================
  // TEST 7: Step 5 Comprehensive Regression Suite (Scenarios 1 through 7)
  // =========================================================================
  console.log('\n[Test 7] Step 5 Comprehensive Discovery-to-Negotiation Regression Scenarios (1-7)...');
  {
    resetStore();
    const fs = require('fs');
    const path = require('path');

    const buyerId = new mongoose.Types.ObjectId('6ab253b2c693622238282008');
    const sellerAId = new mongoose.Types.ObjectId('6ac5ed6c9029ec21769fbec5'); // OfficeGear Direct
    const sellerBId = new mongoose.Types.ObjectId('6ac5ed6c9029ec21769fbecc'); // TechSupply Solutions
    const sellerCId = new mongoose.Types.ObjectId('6ac5faf1dd1cdecea701cd10'); // furniture
    const sellerDId = new mongoose.Types.ObjectId('6ac608a028fe68bb70628a1a'); // Logitech Gadgets Hub (low stock)
    const sellerEId = new mongoose.Types.ObjectId('6ac5fcdddd1cdecea701cd14'); // Supplier B Electronics Ltd (Monitors only)

    const buyer = { _id: buyerId, name: 'Laxmi Buyer', companyName: 'DealPilot Corp', email: 'buyer@dealpilot.in', role: 'buyer' };
    const sellerA = { _id: sellerAId, name: 'Seller A', companyName: 'OfficeGear Direct', email: 'sellera@officegear.in', role: 'seller' };
    const sellerB = { _id: sellerBId, name: 'Seller B', companyName: 'TechSupply Solutions', email: 'sellerb@techsupply.in', role: 'seller' };
    const sellerC = { _id: sellerCId, name: 'Riyanka', companyName: 'furniture', email: 'riyanka@gmail.com', role: 'seller' };
    const sellerD = { _id: sellerDId, name: 'Logitech Hub', companyName: 'Logitech Gadgets Hub', email: 'logi@hub.in', role: 'seller' };
    const sellerE = { _id: sellerEId, name: 'Supplier B', companyName: 'Supplier B Electronics Ltd', email: 'supb@elec.in', role: 'seller' };

    dbStore.users.push(buyer, sellerA, sellerB, sellerC, sellerD, sellerE);

    // Products across suppliers with different prices, stock levels, and MOQs
    const prodMouseA = {
      _id: new mongoose.Types.ObjectId('6ac5ed6c9029ec21769fbec7'),
      sellerId: sellerAId,
      name: 'Wireless Precision Mouse',
      category: 'Peripherals',
      price: 1000,
      costPrice: 650,
      stock: 200,
      moq: 5,
      standardLeadTimeDays: 3,
      active: true
    };
    const prodMouseB = {
      _id: new mongoose.Types.ObjectId('6ac5ed6c9029ec21769fbece'),
      sellerId: sellerBId,
      name: 'Wireless Precision Mouse',
      category: 'Peripherals',
      price: 950,
      costPrice: 600,
      stock: 300,
      moq: 10,
      standardLeadTimeDays: 5,
      active: true
    };
    const prodMouseC = {
      _id: new mongoose.Types.ObjectId('6ac609f828fe68bb70628a25'),
      sellerId: sellerCId,
      name: 'mouse',
      category: 'Peripherals',
      price: 1000,
      costPrice: 500,
      stock: 100,
      moq: 10,
      standardLeadTimeDays: 3,
      active: true
    };
    const prodMouseD = {
      _id: new mongoose.Types.ObjectId('6ac608a128fe68bb70628a1c'),
      sellerId: sellerDId,
      name: 'Logitech Master Wireless Mouse',
      category: 'Peripherals',
      price: 4500,
      costPrice: 3200,
      stock: 40, // Below 50-unit request -> should be rejected for stock deficit
      moq: 1,
      standardLeadTimeDays: 3,
      active: true
    };
    const prodMonitorE = {
      _id: new mongoose.Types.ObjectId('6ac5fcdddd1cdecea701cd19'),
      sellerId: sellerEId,
      name: 'Supplier B Gaming Monitor',
      category: 'Monitors',
      price: 32000,
      costPrice: 24000,
      stock: 30,
      moq: 1,
      standardLeadTimeDays: 4,
      active: true
    };

    dbStore.products.push(prodMouseA, prodMouseB, prodMouseC, prodMouseD, prodMonitorE);

    dbStore.rules.push(
      {
        _id: new mongoose.Types.ObjectId(),
        productId: prodMouseA._id,
        sellerId: sellerAId,
        minimumPrice: 800,
        maximumDiscountPercent: 15,
        maximumDiscountAmount: 25000,
        marginFloorPercent: 10,
        bulkDiscountRules: [{ minQuantity: 25, maxQuantity: 99, discountPercent: 5 }, { minQuantity: 100, maxQuantity: null, discountPercent: 8 }],
        earlyPaymentDiscount: 2,
        leadTimeExtensionDays: 5,
        leadTimeExtraDiscount: 2,
        negotiationEnabled: true
      },
      {
        _id: new mongoose.Types.ObjectId(),
        productId: prodMouseB._id,
        sellerId: sellerBId,
        minimumPrice: 760,
        maximumDiscountPercent: 18,
        maximumDiscountAmount: 30000,
        marginFloorPercent: 8,
        bulkDiscountRules: [{ minQuantity: 25, maxQuantity: 99, discountPercent: 6 }, { minQuantity: 100, maxQuantity: null, discountPercent: 10 }],
        earlyPaymentDiscount: 3,
        leadTimeExtensionDays: 5,
        leadTimeExtraDiscount: 2.5,
        negotiationEnabled: true
      },
      {
        _id: new mongoose.Types.ObjectId(),
        productId: prodMouseC._id,
        sellerId: sellerCId,
        minimumPrice: 850,
        maximumDiscountPercent: 15,
        maximumDiscountAmount: 20000,
        marginFloorPercent: 8,
        bulkDiscountRules: [{ minQuantity: 10, maxQuantity: 49, discountPercent: 3 }, { minQuantity: 50, maxQuantity: 200, discountPercent: 5 }],
        earlyPaymentDiscount: 2,
        leadTimeExtensionDays: 7,
        leadTimeExtraDiscount: 1,
        negotiationEnabled: true
      },
      {
        _id: new mongoose.Types.ObjectId(),
        productId: prodMouseD._id,
        sellerId: sellerDId,
        minimumPrice: 3825,
        maximumDiscountPercent: 15,
        maximumDiscountAmount: 20000,
        marginFloorPercent: 8,
        bulkDiscountRules: [{ minQuantity: 10, maxQuantity: 49, discountPercent: 3 }],
        earlyPaymentDiscount: 2,
        leadTimeExtensionDays: 7,
        leadTimeExtraDiscount: 1,
        negotiationEnabled: true
      },
      {
        _id: new mongoose.Types.ObjectId(),
        productId: prodMonitorE._id,
        sellerId: sellerEId,
        minimumPrice: 28000,
        maximumDiscountPercent: 12,
        maximumDiscountAmount: 40000,
        marginFloorPercent: 8,
        bulkDiscountRules: [{ minQuantity: 5, maxQuantity: 50, discountPercent: 5 }],
        earlyPaymentDiscount: 2,
        leadTimeExtensionDays: 7,
        leadTimeExtraDiscount: 1,
        negotiationEnabled: true
      }
    );

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
      // -----------------------------------------------------------------------
      // Scenario 1: One valid supplier found during analysis and successfully matched
      // -----------------------------------------------------------------------
      console.log('  -> [Scenario 1] One valid supplier found during analysis ("5 Gaming Monitors") and matched...');
      const analyze1Res = await fetch(`${baseUrl}/ai/analyze-procurement`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ promptText: 'I need 5 Gaming Monitors under ₹2,00,000 within 7 days' })
      });
      assert.strictEqual(analyze1Res.status, 200);
      const analyze1Data = await analyze1Res.json();
      assert.strictEqual(analyze1Data.dbMatches.suppliers.length, 1, 'Expected 1 matched supplier for Gaming Monitor');
      assert.strictEqual(analyze1Data.dbMatches.suppliers[0].can_fulfill, true);
      assert.strictEqual(String(analyze1Data.analysis.items[0].productId), String(prodMonitorE._id));

      const create1Res = await fetch(`${baseUrl}/buyer/requests`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          promptText: 'I need 5 Gaming Monitors under ₹2,00,000 within 7 days',
          total_budget: analyze1Data.analysis.total_budget,
          deadline_days: analyze1Data.analysis.deadline_days,
          items: analyze1Data.analysis.items
        })
      });
      assert.strictEqual(create1Res.status, 201);
      const create1Data = await create1Res.json();
      const plans1Res = await fetch(`${baseUrl}/buyer/requests/${create1Data.requirement.id}/plans`, { headers });
      const plans1Data = await plans1Res.json();
      assert.strictEqual(plans1Data.plans.length, 1);
      assert.strictEqual(plans1Data.plans[0].status, 'VALID');
      assert.strictEqual(plans1Data.plans[0].seller_name, 'Supplier B Electronics Ltd');
      console.log('     ✓ Scenario 1 Passed! 1 supplier discovered -> 1 VALID offer returned by plans API.');

      // -----------------------------------------------------------------------
      // Scenario 2, 3, 4 & 6:
      // - Multiple valid suppliers producing multiple real offers (3 valid mouse suppliers)
      // - Suppliers with different prices (₹950, ₹1000, ₹4500) and stock levels (300, 200, 100, 40)
      // - Invalid supplier (Logitech Gadgets Hub, stock 40 < 50) rejected with specific reason
      // - Valid offers saved in MongoDB and returned by the plans API
      // -----------------------------------------------------------------------
      console.log('  -> [Scenarios 2, 3, 4 & 6] Multiple suppliers ("50 mouse"), different prices/stock, invalid supplier rejected...');
      const analyze2Res = await fetch(`${baseUrl}/ai/analyze-procurement`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ promptText: 'I need 50 mouse under ₹1,00,000 within 10 days' })
      });
      assert.strictEqual(analyze2Res.status, 200);
      const analyze2Data = await analyze2Res.json();
      assert.strictEqual(analyze2Data.dbMatches.suppliers.length, 4, 'Discovery must find all 4 mouse suppliers');
      const feasibleSuppliers = analyze2Data.dbMatches.suppliers.filter(s => s.can_fulfill);
      const infeasibleSuppliers = analyze2Data.dbMatches.suppliers.filter(s => !s.can_fulfill);
      assert.strictEqual(feasibleSuppliers.length, 3, '3 suppliers can fulfill 50 mice');
      assert.strictEqual(infeasibleSuppliers.length, 1, '1 supplier (Logitech Hub, stock 40) cannot fulfill 50 mice');
      assert(infeasibleSuppliers[0].rejection_reasons[0].includes('Stock deficit'), 'Discovery must flag stock deficit on Logitech Hub');

      const create2Res = await fetch(`${baseUrl}/buyer/requests`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          promptText: 'I need 50 mouse under ₹1,00,000 within 10 days',
          total_budget: analyze2Data.analysis.total_budget,
          deadline_days: analyze2Data.analysis.deadline_days,
          items: analyze2Data.analysis.items
        })
      });
      assert.strictEqual(create2Res.status, 201);
      const create2Data = await create2Res.json();
      assert.strictEqual(create2Data.offers_count, 4, 'Engine must persist 4 SellerOffer documents (3 VALID + 1 REJECTED)');

      // Verify SellerOffer documents persisted in MongoDB store
      const savedOffersInDb = dbStore.offers.filter(o => String(o.requirementId) === String(create2Data.requirement.id));
      assert.strictEqual(savedOffersInDb.length, 4, 'All 4 SellerOffer documents saved in MongoDB');

      const plans2Res = await fetch(`${baseUrl}/buyer/requests/${create2Data.requirement.id}/plans`, { headers });
      assert.strictEqual(plans2Res.status, 200);
      const plans2Data = await plans2Res.json();
      assert.strictEqual(plans2Data.plans.length, 4, 'Plans API must return all 4 offers');

      const validPlans2 = plans2Data.plans.filter(p => p.status === 'VALID');
      const rejectedPlans2 = plans2Data.plans.filter(p => p.status === 'REJECTED');
      assert.strictEqual(validPlans2.length, 3, 'All 3 valid mouse suppliers must produce VALID offers (including seller "furniture" with product "mouse")');
      assert.strictEqual(rejectedPlans2.length, 1, 'Logitech Gadgets Hub must be REJECTED');
      assert(
        rejectedPlans2[0].rejection_reason.includes('Stock deficit: Requested 50 units of "Logitech Master Wireless Mouse", but seller "Logitech Gadgets Hub" only has 40 units in stock.'),
        `Unexpected rejection reason: ${rejectedPlans2[0].rejection_reason}`
      );
      console.log('     ✓ Scenarios 2, 3, 4 & 6 Passed! 3 VALID offers (TechSupply, furniture, OfficeGear) + 1 REJECTED offer (Logitech Hub stock deficit).');

      // -----------------------------------------------------------------------
      // Scenario 5: Multi-product request with different suppliers for different items
      // -----------------------------------------------------------------------
      console.log('  -> [Scenario 5] Multi-product request ("20 mouse and 5 Gaming Monitors") across different suppliers...');
      const create5Res = await fetch(`${baseUrl}/buyer/requests`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          promptText: 'I need 20 mouse and 5 Gaming Monitors under ₹2,50,000 within 10 days',
          total_budget: 250000,
          deadline_days: 10,
          items: [
            { item_name: 'Mouse', quantity: 20 },
            { item_name: 'Gaming Monitor', quantity: 5 }
          ]
        })
      });
      assert.strictEqual(create5Res.status, 201);
      const create5Data = await create5Res.json();
      const plans5Res = await fetch(`${baseUrl}/buyer/requests/${create5Data.requirement.id}/plans`, { headers });
      assert.strictEqual(plans5Res.status, 200);
      const plans5Data = await plans5Res.json();
      const validPlans5 = plans5Data.plans.filter(p => p.status === 'VALID');
      assert(validPlans5.length >= 4, `Expected both Mouse suppliers and Monitor supplier to produce VALID offers, got ${validPlans5.length}`);
      const monitorPlan = validPlans5.find(p => p.seller_name === 'Supplier B Electronics Ltd');
      const mousePlan = validPlans5.find(p => p.seller_name === 'TechSupply Solutions');
      assert(monitorPlan, 'Monitor supplier must produce a VALID offer for the monitor line item');
      assert(mousePlan, 'Mouse supplier must produce a VALID offer for the mouse line item');
      console.log('     ✓ Scenario 5 Passed! Multi-product request with different suppliers for different items produced VALID offers.');

      // -----------------------------------------------------------------------
      // Scenario 7: API failure displayed as an error instead of "No Matched Seller Deals"
      // -----------------------------------------------------------------------
      console.log('  -> [Scenario 7] API failure returns HTTP error & PlanComparisonPage renders error state instead of empty state...');
      const nonExistentId = new mongoose.Types.ObjectId();
      const errPlansRes = await fetch(`${baseUrl}/buyer/requests/${nonExistentId}/plans`, { headers });
      assert.strictEqual(errPlansRes.status, 404, 'Non-existent requirement must return HTTP 404 error');
      const errPlansData = await errPlansRes.json();
      assert(errPlansData.error, 'Error response must include error message');

      const planCompSource = fs.readFileSync(
        path.resolve(__dirname, '../../../frontend/src/pages/PlanComparisonPage.jsx'),
        'utf8'
      );
      assert(
        planCompSource.includes('fetchError') &&
        planCompSource.includes('Unable to Load Procurement Deals') &&
        planCompSource.includes('Retry Loading Deals'),
        'PlanComparisonPage.jsx must render dedicated fetchError banner instead of misleading "No Matched Seller Deals"'
      );
      console.log('     ✓ Scenario 7 Passed! API failure is surfaced as an explicit error state rather than "No Matched Seller Deals".');
    } finally {
      server.close();
    }
  }

  console.log('\n=========================================================================');
  console.log('✅ ALL 7 CATALOG-TO-NEGOTIATION REGRESSION TESTS PASSED SUCCESSFULLY!');
  console.log('=========================================================================\n');
}

runTests().catch(err => {
  console.error('\n❌ TEST SUITE FAILED:', err);
  process.exit(1);
});
