const assert = require('assert');
const mongoose = require('mongoose');

// Models
const User = require('../models/User');
const Product = require('../models/Product');
const ProductRule = require('../models/ProductRule');
const ProcurementRequirement = require('../models/ProcurementRequirement');
const SellerOffer = require('../models/SellerOffer');
const Negotiation = require('../models/Negotiation');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const AuditLog = require('../models/AuditLog');

// Live Services & Route Handlers
const {
  processRequirementMatchingAndNegotiation,
  runNegotiationForSeller
} = require('../services/negotiationEngine');
const { calculateLandedCost, rankPlans } = require('../services/planComparator');
const {
  createRazorpayOrder,
  verifyPayment,
  generateRazorpaySignature
} = require('../services/paymentService');
const { fallbackParsePrompt } = require('../services/aiService');
const orderRoutes = require('../routes/orderRoutes');
const processOrderCreation = orderRoutes.processOrderCreation;

console.log('===================================================================');
console.log('🚀 Running Phase 1 & Phase 2 Live Implementation Verification Suite');
console.log('===================================================================\n');

/**
 * Stateful in-memory Mongoose store adapter so live functions
 * (processRequirementMatchingAndNegotiation, processOrderCreation,
 * createRazorpayOrder, verifyPayment) execute their real code paths
 * without touching or mutating any production MongoDB Atlas data.
 */
const dbStore = {
  users: [],
  products: [],
  rules: [],
  requirements: [],
  offers: [],
  negotiations: [],
  orders: [],
  payments: [],
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
  dbStore.payments = [];
  dbStore.audits = [];
}

function makeQuery(result) {
  return {
    lean: async () => (Array.isArray(result) ? result.map(r => ({ ...r })) : result ? { ...result } : null),
    select: function () { return this; },
    populate: function () { return this; },
    sort: function () { return this; },
    then: function (resolve, reject) {
      return Promise.resolve(result).then(resolve, reject);
    }
  };
}

function attachDocSave(doc, collection) {
  if (!doc._id) doc._id = new mongoose.Types.ObjectId();
  doc.save = async function () {
    const idx = collection.findIndex(x => x._id.toString() === doc._id.toString());
    if (idx >= 0) {
      collection[idx] = doc;
    } else {
      collection.push(doc);
    }
    return doc;
  };
  return doc;
}

// Wire Mongoose model methods to in-memory store
User.find = () => makeQuery(dbStore.users);
User.findById = (id) => makeQuery(dbStore.users.find(u => u._id.toString() === id.toString()) || null);

Product.find = () => makeQuery(dbStore.products.filter(p => p.active !== false));
Product.findById = (id) => makeQuery(dbStore.products.find(p => p._id.toString() === id.toString()) || null);
Product.findOneAndUpdate = async (filter, update) => {
  const prod = dbStore.products.find(p => {
    if (filter._id && p._id.toString() !== filter._id.toString()) return false;
    if (filter.active && p.active === false) return false;
    if (filter.stock && filter.stock.$gte !== undefined && p.stock < filter.stock.$gte) return false;
    return true;
  });
  if (!prod) return null;
  if (update.$inc && update.$inc.stock) {
    prod.stock += update.$inc.stock;
  }
  return prod;
};
Product.updateOne = async (filter, update) => {
  const prod = dbStore.products.find(p => p._id.toString() === filter._id.toString());
  if (prod && update.$inc && update.$inc.stock) {
    prod.stock += update.$inc.stock;
  }
  return { modifiedCount: prod ? 1 : 0 };
};

ProductRule.findOne = (filter) => {
  const rule = dbStore.rules.find(r => r.productId.toString() === filter.productId.toString()) || null;
  return makeQuery(rule);
};

ProcurementRequirement.findById = async (id) => {
  const req = dbStore.requirements.find(r => r._id.toString() === id.toString()) || null;
  return req ? attachDocSave(req, dbStore.requirements) : null;
};
ProcurementRequirement.findOneAndUpdate = async (filter, update) => {
  const req = dbStore.requirements.find(r => {
    if (filter._id && r._id.toString() !== filter._id.toString()) return false;
    if (filter.buyerId && r.buyerId.toString() !== filter.buyerId.toString()) return false;
    if (filter.status && filter.status.$ne && r.status === filter.status.$ne) return false;
    return true;
  });
  if (!req) return null;
  if (update.$set) Object.assign(req, update.$set);
  return attachDocSave(req, dbStore.requirements);
};
ProcurementRequirement.updateOne = async (filter, update) => {
  const req = dbStore.requirements.find(r => r._id.toString() === filter._id.toString());
  if (req && update.$set) Object.assign(req, update.$set);
  return { modifiedCount: req ? 1 : 0 };
};

SellerOffer.deleteMany = async (filter) => {
  dbStore.offers = dbStore.offers.filter(o => o.requirementId.toString() !== filter.requirementId.toString());
};
SellerOffer.create = async (data) => {
  const doc = attachDocSave({ ...data, _id: new mongoose.Types.ObjectId() }, dbStore.offers);
  dbStore.offers.push(doc);
  return doc;
};
SellerOffer.findById = async (id) => {
  return dbStore.offers.find(o => o._id.toString() === id.toString()) || null;
};
SellerOffer.findOne = async (filter) => {
  return dbStore.offers.find(o => {
    if (filter.requirementId && o.requirementId.toString() !== filter.requirementId.toString()) return false;
    if (filter.status && o.status !== filter.status) return false;
    if (filter.isBestDeal !== undefined && Boolean(o.isBestDeal) !== Boolean(filter.isBestDeal)) return false;
    return true;
  }) || null;
};

Negotiation.deleteMany = async (filter) => {
  dbStore.negotiations = dbStore.negotiations.filter(n => n.requirementId.toString() !== filter.requirementId.toString());
};
Negotiation.create = async (data) => {
  const doc = attachDocSave({ ...data, _id: new mongoose.Types.ObjectId() }, dbStore.negotiations);
  dbStore.negotiations.push(doc);
  return doc;
};

Order.create = async (data) => {
  const doc = attachDocSave({ ...data, _id: new mongoose.Types.ObjectId() }, dbStore.orders);
  dbStore.orders.push(doc);
  return doc;
};
Order.findById = async (id) => {
  const ord = dbStore.orders.find(o => o._id.toString() === id.toString()) || null;
  return ord ? attachDocSave(ord, dbStore.orders) : null;
};
Order.findOne = async (filter) => {
  return dbStore.orders.find(o => {
    if (filter.requirementId && o.requirementId.toString() !== filter.requirementId.toString()) return false;
    if (filter.$or) {
      return filter.$or.some(cond => {
        if (cond.orderStatus && o.orderStatus === cond.orderStatus) return true;
        if (cond.paymentStatus && o.paymentStatus === cond.paymentStatus) return true;
        return false;
      });
    }
    return true;
  }) || null;
};

Payment.create = async (data) => {
  const doc = attachDocSave({ ...data, _id: new mongoose.Types.ObjectId() }, dbStore.payments);
  dbStore.payments.push(doc);
  return doc;
};
Payment.findOneAndUpdate = async (filter, update) => {
  let pay = dbStore.payments.find(p => p.orderId.toString() === filter.orderId.toString());
  if (!pay) {
    pay = attachDocSave({ orderId: filter.orderId, ...update, _id: new mongoose.Types.ObjectId() }, dbStore.payments);
    dbStore.payments.push(pay);
  } else {
    Object.assign(pay, update);
  }
  return pay;
};

AuditLog.create = async (data) => {
  dbStore.audits.push(data);
  return data;
};

const VALID_ADDRESS = {
  fullName: 'Laxmi Manapure',
  phoneNumber: '9876543210',
  addressLine1: 'Plot 42, Tech Park',
  addressLine2: 'Phase 2',
  city: 'Pune',
  state: 'Maharashtra',
  pinCode: '411001',
  deliveryInstructions: 'Deliver at Gate 1'
};

(async () => {
  try {
    // =========================================================================
    // TEST 1: Advance-payment discount is NEVER applied twice (Negotiation + Checkout)
    // =========================================================================
    console.log('[Test 1] Verifying Advance-Payment Discount is never applied twice...');
    resetStore();

    const buyer1Id = new mongoose.Types.ObjectId();
    const seller1Id = new mongoose.Types.ObjectId();
    const prod1Id = new mongoose.Types.ObjectId();
    const req1Id = new mongoose.Types.ObjectId();

    dbStore.users.push({ _id: seller1Id, name: 'OfficeGear', companyName: 'OfficeGear Direct', role: 'seller' });
    dbStore.products.push({
      _id: prod1Id,
      sellerId: seller1Id,
      name: 'Mechanical Keyboard',
      category: 'Electronics',
      price: 1000,
      costPrice: 700,
      stock: 100,
      moq: 5,
      standardLeadTimeDays: 3,
      active: true
    });
    dbStore.rules.push({
      productId: prod1Id,
      sellerId: seller1Id,
      minimumPrice: 800,
      maximumDiscountPercent: 20,
      maximumDiscountAmount: 10000,
      minimumQuantity: 5,
      bulkDiscountRules: [{ minQuantity: 10, maxQuantity: 100, discountPercent: 5 }],
      earlyPaymentDiscount: 2.0,
      leadTimeExtensionDays: 7,
      leadTimeExtraDiscount: 0,
      marginFloorPercent: 8.0,
      maxRounds: 3,
      negotiationEnabled: true
    });

    // Requirement with isAdvancePayment = true -> Round 2 applies 2% during negotiation
    const req1 = {
      _id: req1Id,
      buyerId: buyer1Id,
      rawPrompt: 'Need 10 Mechanical Keyboards with 100% advance payment',
      items: [{ item_name: 'Mechanical Keyboard', quantity: 10 }],
      targetBudget: 15000,
      deadlineDays: 3,
      isAdvancePayment: true,
      status: 'MATCHING'
    };
    dbStore.requirements.push(req1);

    const offers1 = await processRequirementMatchingAndNegotiation(req1);
    assert.strictEqual(offers1.length, 1, 'Should produce 1 offer');
    const offer1 = offers1[0];
    // List = 10,000 -> R1 (5% bulk) = 9,500 -> R2 (2% advance) = 9,310
    assert.strictEqual(offer1.negotiatedAmount, 9310, 'Negotiated amount should include Round 2 advance discount once (₹9,310)');
    assert.strictEqual(offer1.discountBreakdown.advancePayDiscount.applied, true, 'Advance discount marked applied');

    // Now checkout with ONLINE payment -> must NOT apply 2% a second time!
    const order1 = await processOrderCreation({
      user: { id: buyer1Id.toString(), role: 'buyer' },
      body: {
        requestId: req1Id.toString(),
        offerId: offer1._id.toString(),
        paymentMethod: 'ONLINE',
        deliveryAddress: VALID_ADDRESS
      }
    });

    assert.strictEqual(order1.onlineDiscountAmount, 0, 'Checkout must NOT subtract advance/online discount a second time');
    assert.strictEqual(order1.finalAmount, 9310, 'Final payable order amount must remain ₹9,310');
    console.log('  ✓ Test 1 Passed! Advance payment discount applied exactly once (Negotiated = ₹9,310, Checkout Final = ₹9,310).\n');

    // =========================================================================
    // TEST 2: Offer below seller's permitted minimum price is rejected at checkout
    // =========================================================================
    console.log('[Test 2] Verifying offer manipulated below seller minimum price floor is rejected...');
    const req2Id = new mongoose.Types.ObjectId();
    dbStore.requirements.push({
      _id: req2Id,
      buyerId: buyer1Id,
      rawPrompt: '10 Keyboards',
      items: [{ item_name: 'Mechanical Keyboard', quantity: 10 }],
      targetBudget: 15000,
      deadlineDays: 5,
      status: 'OFFER_READY'
    });

    // Stale/manipulated offer priced at ₹7,500 when seller minimumPrice is ₹800/unit (₹8,000 for 10 units)
    const manipulatedOffer = await SellerOffer.create({
      requirementId: req2Id,
      sellerId: seller1Id,
      items: [{
        productId: prod1Id,
        name: 'Mechanical Keyboard',
        quantity: 10,
        unitListPrice: 1000,
        totalListPrice: 10000
      }],
      originalAmount: 10000,
      negotiatedAmount: 7500, // Below ₹8,000 minimum floor!
      minAllowedPrice: 8500,
      savings: 2500,
      leadTimeDays: 5,
      status: 'VALID'
    });

    let minPriceRejected = false;
    try {
      await processOrderCreation({
        user: { id: buyer1Id.toString(), role: 'buyer' },
        body: {
          requestId: req2Id.toString(),
          offerId: manipulatedOffer._id.toString(),
          paymentMethod: 'ONLINE',
          deliveryAddress: VALID_ADDRESS
        }
      });
    } catch (err) {
      minPriceRejected = err.statusCode === 400 && err.message.includes('below the seller\'s minimum permitted price floor');
    }
    assert.strictEqual(minPriceRejected, true, 'Checkout must reject offers below seller minimum permitted price');
    console.log('  ✓ Test 2 Passed! Manipulated offer below seller minimum price floor was rejected.\n');

    // =========================================================================
    // TEST 3 & 4: REJECTED and OVER_BUDGET offers cannot be purchased & are never marked Best Deal
    // =========================================================================
    console.log('[Test 3 & 4] Verifying REJECTED and OVER_BUDGET offers cannot be purchased and are never marked isBestDeal...');
    resetStore();
    dbStore.users.push({ _id: seller1Id, name: 'OfficeGear', companyName: 'OfficeGear Direct', role: 'seller' });
    dbStore.products.push({
      _id: prod1Id,
      sellerId: seller1Id,
      name: 'Mechanical Keyboard',
      category: 'Electronics',
      price: 1000,
      costPrice: 700,
      stock: 50,
      moq: 10,
      standardLeadTimeDays: 3,
      active: true
    });
    dbStore.rules.push({
      productId: prod1Id,
      sellerId: seller1Id,
      minimumPrice: 900,
      maximumDiscountPercent: 10,
      maximumDiscountAmount: 5000,
      minimumQuantity: 10,
      marginFloorPercent: 8.0,
      maxRounds: 3,
      negotiationEnabled: true
    });

    // 3a: Below MOQ request (qty 4 < MOQ 10) -> REJECTED offer
    const reqMoqFail = {
      _id: new mongoose.Types.ObjectId(),
      buyerId: buyer1Id,
      rawPrompt: '4 Keyboards',
      items: [{ item_name: 'Mechanical Keyboard', quantity: 4 }],
      targetBudget: 10000,
      deadlineDays: 5,
      status: 'MATCHING'
    };
    dbStore.requirements.push(reqMoqFail);
    const rejectedOffers = await processRequirementMatchingAndNegotiation(reqMoqFail);
    assert.strictEqual(rejectedOffers[0].status, 'REJECTED', 'Offer must be REJECTED for MOQ breach');
    assert.strictEqual(rejectedOffers[0].isBestDeal, false, 'REJECTED offer must NEVER be marked isBestDeal');

    let rejectedPurchaseBlocked = false;
    try {
      await processOrderCreation({
        user: { id: buyer1Id.toString(), role: 'buyer' },
        body: {
          requestId: reqMoqFail._id.toString(),
          offerId: rejectedOffers[0]._id.toString(),
          paymentMethod: 'COD',
          deliveryAddress: VALID_ADDRESS
        }
      });
    } catch (err) {
      rejectedPurchaseBlocked = err.statusCode === 400 && err.message.includes('REJECTED');
    }
    assert.strictEqual(rejectedPurchaseBlocked, true, 'REJECTED offer must be blocked from checkout');

    // 4a: Over-budget request (10 units @ ₹900 min = ₹9,000 vs ₹5,000 budget) -> OVER_BUDGET offer
    const reqOverBudget = {
      _id: new mongoose.Types.ObjectId(),
      buyerId: buyer1Id,
      rawPrompt: '10 Keyboards under 5000',
      items: [{ item_name: 'Mechanical Keyboard', quantity: 10 }],
      targetBudget: 5000,
      deadlineDays: 5,
      status: 'MATCHING'
    };
    dbStore.requirements.push(reqOverBudget);
    const overBudgetOffers = await processRequirementMatchingAndNegotiation(reqOverBudget);
    assert.strictEqual(overBudgetOffers[0].status, 'OVER_BUDGET', 'Offer must be OVER_BUDGET');
    assert.strictEqual(overBudgetOffers[0].isBestDeal, false, 'OVER_BUDGET offer must NEVER be marked isBestDeal');

    let overBudgetPurchaseBlocked = false;
    try {
      await processOrderCreation({
        user: { id: buyer1Id.toString(), role: 'buyer' },
        body: {
          requestId: reqOverBudget._id.toString(),
          offerId: overBudgetOffers[0]._id.toString(),
          paymentMethod: 'COD',
          deliveryAddress: VALID_ADDRESS
        }
      });
    } catch (err) {
      overBudgetPurchaseBlocked = err.statusCode === 400 && err.message.includes('OVER_BUDGET');
    }
    assert.strictEqual(overBudgetPurchaseBlocked, true, 'OVER_BUDGET offer must be blocked from checkout');
    console.log('  ✓ Tests 3 & 4 Passed! REJECTED and OVER_BUDGET offers are never marked Best Deal and cannot be purchased.\n');

    // =========================================================================
    // TEST 5, 6, 7: Cross-Tenant Protection & Razorpay Signature Security
    // =========================================================================
    console.log('[Test 5, 6, 7] Verifying Cross-Buyer/Seller Access Control & Mandatory Razorpay Signature Verification...');
    const buyer2Id = new mongoose.Types.ObjectId();
    const reqValid = {
      _id: new mongoose.Types.ObjectId(),
      buyerId: buyer1Id,
      rawPrompt: '10 Keyboards',
      items: [{ item_name: 'Mechanical Keyboard', quantity: 10 }],
      targetBudget: 12000,
      deadlineDays: 5,
      status: 'MATCHING'
    };
    dbStore.requirements.push(reqValid);
    const validOffers = await processRequirementMatchingAndNegotiation(reqValid);
    const validOffer = validOffers[0];
    assert.strictEqual(validOffer.status, 'VALID');

    // Test 5: Buyer 2 cannot purchase Buyer 1's offer
    let crossBuyerBlocked = false;
    try {
      await processOrderCreation({
        user: { id: buyer2Id.toString(), role: 'buyer' },
        body: {
          requestId: reqValid._id.toString(),
          offerId: validOffer._id.toString(),
          paymentMethod: 'ONLINE',
          deliveryAddress: VALID_ADDRESS
        }
      });
    } catch (err) {
      crossBuyerBlocked = err.statusCode === 403;
    }
    assert.strictEqual(crossBuyerBlocked, true, 'Another buyer must not be able to purchase Buyer 1 offer');

    // Seller cannot create an order
    let sellerOrderBlocked = false;
    try {
      await processOrderCreation({
        user: { id: seller1Id.toString(), role: 'seller' },
        body: {
          requestId: reqValid._id.toString(),
          offerId: validOffer._id.toString(),
          paymentMethod: 'ONLINE',
          deliveryAddress: VALID_ADDRESS
        }
      });
    } catch (err) {
      sellerOrderBlocked = err.statusCode === 403;
    }
    assert.strictEqual(sellerOrderBlocked, true, 'Seller must not be able to create buyer orders');

    // Buyer 1 creates valid ONLINE order
    const buyer1Order = await processOrderCreation({
      user: { id: buyer1Id.toString(), role: 'buyer' },
      body: {
        requestId: reqValid._id.toString(),
        offerId: validOffer._id.toString(),
        paymentMethod: 'ONLINE',
        deliveryAddress: VALID_ADDRESS
      }
    });

    // Test 6: Seller or Buyer 2 cannot initiate or verify payment for Buyer 1's order
    let sellerPayBlocked = false;
    try {
      await verifyPayment({
        orderId: buyer1Order._id,
        razorpayOrderId: 'rzp_1',
        razorpayPaymentId: 'pay_1',
        razorpaySignature: 'sig_1',
        userId: seller1Id.toString(),
        userRole: 'seller'
      });
    } catch (err) {
      sellerPayBlocked = err.statusCode === 403;
    }
    assert.strictEqual(sellerPayBlocked, true, 'Seller cannot manipulate order payment');

    let otherBuyerPayBlocked = false;
    try {
      await createRazorpayOrder({
        orderId: buyer1Order._id,
        userId: buyer2Id.toString(),
        userRole: 'buyer'
      });
    } catch (err) {
      otherBuyerPayBlocked = err.statusCode === 403;
    }
    assert.strictEqual(otherBuyerPayBlocked, true, 'Another buyer cannot initiate payment for someone else order');

    // Test 7: Missing or invalid Razorpay signatures cannot mark order as PAID
    const rzpCreated = await createRazorpayOrder({
      orderId: buyer1Order._id,
      userId: buyer1Id.toString(),
      userRole: 'buyer'
    });

    // 7a: Missing signature (null / empty)
    const missingSigRes = await verifyPayment({
      orderId: buyer1Order._id,
      razorpayOrderId: rzpCreated.razorpayOrderId,
      razorpayPaymentId: 'pay_test_123',
      razorpaySignature: null,
      userId: buyer1Id.toString(),
      userRole: 'buyer'
    });
    assert.strictEqual(missingSigRes.success, false, 'Missing signature must fail verification');
    assert.notStrictEqual(buyer1Order.paymentStatus, 'PAID', 'Order must NOT be marked PAID when signature is missing');

    // 7b: Invalid signature
    const invalidSigRes = await verifyPayment({
      orderId: buyer1Order._id,
      razorpayOrderId: rzpCreated.razorpayOrderId,
      razorpayPaymentId: 'pay_test_123',
      razorpaySignature: 'forged_invalid_signature_999',
      userId: buyer1Id.toString(),
      userRole: 'buyer'
    });
    assert.strictEqual(invalidSigRes.success, false, 'Invalid signature must fail verification');
    assert.notStrictEqual(buyer1Order.paymentStatus, 'PAID', 'Order must NOT be marked PAID with invalid signature');

    // 7c: Valid HMAC signature succeeds and does NOT double-decrement stock on retry
    const stockAfterOrderCreation = dbStore.products[0].stock; // 50 - 10 = 40
    assert.strictEqual(stockAfterOrderCreation, 40, 'Stock should be 40 after order reservation');

    const validSig = generateRazorpaySignature(rzpCreated.razorpayOrderId, 'pay_test_123');
    const validSigRes = await verifyPayment({
      orderId: buyer1Order._id,
      razorpayOrderId: rzpCreated.razorpayOrderId,
      razorpayPaymentId: 'pay_test_123',
      razorpaySignature: validSig,
      userId: buyer1Id.toString(),
      userRole: 'buyer'
    });
    assert.strictEqual(validSigRes.success, true, 'Valid HMAC signature must verify payment');
    assert.strictEqual(buyer1Order.paymentStatus, 'PAID', 'Order must be marked PAID');
    assert.strictEqual(dbStore.products[0].stock, 40, 'Stock must NOT be decremented a second time during payment retry/verification');
    console.log('  ✓ Tests 5, 6 & 7 Passed! Cross-user access blocked, missing/invalid signatures rejected, and retries do not double-deduct stock.\n');

    // =========================================================================
    // TEST 8: Concurrent orders cannot exceed available stock
    // =========================================================================
    console.log('[Test 8] Verifying concurrent orders cannot exceed available stock...');
    resetStore();
    dbStore.users.push({ _id: seller1Id, name: 'OfficeGear', companyName: 'OfficeGear Direct', role: 'seller' });
    // Only 15 units in stock!
    dbStore.products.push({
      _id: prod1Id,
      sellerId: seller1Id,
      name: 'Mechanical Keyboard',
      category: 'Electronics',
      price: 1000,
      costPrice: 600,
      stock: 15,
      moq: 5,
      standardLeadTimeDays: 3,
      active: true
    });
    dbStore.rules.push({
      productId: prod1Id,
      sellerId: seller1Id,
      minimumPrice: 800,
      maximumDiscountPercent: 15,
      maximumDiscountAmount: 10000,
      minimumQuantity: 5,
      marginFloorPercent: 8.0,
      maxRounds: 3,
      negotiationEnabled: true
    });

    // Two buyers each have a valid offer for 10 units (10 + 10 = 20 > 15 stock)
    const reqC1 = {
      _id: new mongoose.Types.ObjectId(),
      buyerId: buyer1Id,
      rawPrompt: '10 Keyboards',
      items: [{ item_name: 'Mechanical Keyboard', quantity: 10 }],
      targetBudget: 12000,
      deadlineDays: 5,
      status: 'OFFER_READY'
    };
    const reqC2 = {
      _id: new mongoose.Types.ObjectId(),
      buyerId: buyer2Id,
      rawPrompt: '10 Keyboards',
      items: [{ item_name: 'Mechanical Keyboard', quantity: 10 }],
      targetBudget: 12000,
      deadlineDays: 5,
      status: 'OFFER_READY'
    };
    dbStore.requirements.push(reqC1, reqC2);

    const offC1 = await SellerOffer.create({
      requirementId: reqC1._id,
      sellerId: seller1Id,
      items: [{ productId: prod1Id, name: 'Mechanical Keyboard', quantity: 10, unitListPrice: 1000, totalListPrice: 10000 }],
      originalAmount: 10000,
      negotiatedAmount: 10000,
      minAllowedPrice: 8500,
      savings: 0,
      leadTimeDays: 3,
      status: 'VALID'
    });
    const offC2 = await SellerOffer.create({
      requirementId: reqC2._id,
      sellerId: seller1Id,
      items: [{ productId: prod1Id, name: 'Mechanical Keyboard', quantity: 10, unitListPrice: 1000, totalListPrice: 10000 }],
      originalAmount: 10000,
      negotiatedAmount: 10000,
      minAllowedPrice: 8500,
      savings: 0,
      leadTimeDays: 3,
      status: 'VALID'
    });

    const concurrentResults = await Promise.allSettled([
      processOrderCreation({
        user: { id: buyer1Id.toString(), role: 'buyer' },
        body: { requestId: reqC1._id.toString(), offerId: offC1._id.toString(), paymentMethod: 'COD', deliveryAddress: VALID_ADDRESS }
      }),
      processOrderCreation({
        user: { id: buyer2Id.toString(), role: 'buyer' },
        body: { requestId: reqC2._id.toString(), offerId: offC2._id.toString(), paymentMethod: 'COD', deliveryAddress: VALID_ADDRESS }
      })
    ]);

    const fulfilled = concurrentResults.filter(r => r.status === 'fulfilled');
    const rejected = concurrentResults.filter(r => r.status === 'rejected');
    assert.strictEqual(fulfilled.length, 1, 'Exactly 1 order must succeed when stock is 15 and both request 10');
    assert.strictEqual(rejected.length, 1, 'The second concurrent order must be rejected due to insufficient stock');
    assert.strictEqual(dbStore.products[0].stock, 5, 'Remaining stock must be 15 - 10 = 5 (never negative)');
    console.log('  ✓ Test 8 Passed! Concurrent orders prevented overselling (1 succeeded, 1 rejected, remaining stock = 5).\n');

    // =========================================================================
    // TEST 9, 10, 11: Multi-Item Per-Product Slabs, Policy Enforcement & maxRounds
    // =========================================================================
    console.log('[Test 9, 10, 11] Verifying Per-Product Slabs, Policy Enforcement & maxRounds in Multi-Item Orders...');
    resetStore();
    const prodKeyId = new mongoose.Types.ObjectId();
    const prodMouseId = new mongoose.Types.ObjectId();

    dbStore.users.push({ _id: seller1Id, name: 'OfficeGear', companyName: 'OfficeGear Direct', role: 'seller' });
    // Product 1: Keyboard @ ₹1,000, qty 30 qualifies for 10% slab (25-50 units) -> ₹30,000 * 0.90 = ₹27,000
    // Product 2: Mouse @ ₹500, qty 5 does NOT qualify for its 20+ slab -> stays at ₹2,500 (0% bulk discount!)
    dbStore.products.push(
      {
        _id: prodKeyId,
        sellerId: seller1Id,
        name: 'Mechanical Keyboard',
        category: 'Electronics',
        price: 1000,
        costPrice: 600,
        stock: 100,
        moq: 5,
        standardLeadTimeDays: 3,
        active: true
      },
      {
        _id: prodMouseId,
        sellerId: seller1Id,
        name: 'Optical Mouse',
        category: 'Electronics',
        price: 500,
        costPrice: 350,
        stock: 100,
        moq: 5,
        standardLeadTimeDays: 3,
        active: true
      }
    );

    dbStore.rules.push(
      {
        productId: prodKeyId,
        sellerId: seller1Id,
        minimumPrice: 750,
        maximumDiscountPercent: 20,
        maximumDiscountAmount: 10000,
        minimumQuantity: 5,
        bulkDiscountRules: [{ minQuantity: 25, maxQuantity: 50, discountPercent: 10 }],
        earlyPaymentDiscount: 5.0,
        leadTimeExtensionDays: 7,
        leadTimeExtraDiscount: 2.0,
        marginFloorPercent: 10.0,
        maxRounds: 1, // STRICT maxRounds = 1! Must stop after Round 1 even if advance pay and extended lead time are offered!
        negotiationEnabled: true
      },
      {
        productId: prodMouseId,
        sellerId: seller1Id,
        minimumPrice: 400,
        maximumDiscountPercent: 15,
        maximumDiscountAmount: 5000,
        minimumQuantity: 5,
        bulkDiscountRules: [{ minQuantity: 20, maxQuantity: 100, discountPercent: 8 }], // Requesting only 5 mice -> 0% bulk discount!
        earlyPaymentDiscount: 5.0,
        leadTimeExtensionDays: 7,
        leadTimeExtraDiscount: 2.0,
        marginFloorPercent: 10.0,
        maxRounds: 1, // STRICT maxRounds = 1!
        negotiationEnabled: true
      }
    );

    const reqMulti = {
      _id: new mongoose.Types.ObjectId(),
      buyerId: buyer1Id,
      rawPrompt: 'Need 30 Mechanical Keyboards and 5 Optical Mice with 100% advance payment in 14 days',
      items: [
        { item_name: 'Mechanical Keyboard', quantity: 30 },
        { item_name: 'Optical Mouse', quantity: 5 }
      ],
      targetBudget: 35000,
      deadlineDays: 14,
      isAdvancePayment: true,
      status: 'MATCHING'
    };
    dbStore.requirements.push(reqMulti);

    const multiOffers = await processRequirementMatchingAndNegotiation(reqMulti);
    assert.strictEqual(multiOffers.length, 1);
    const mOffer = multiOffers[0];

    // Keyboard: 30 * 1000 = 30,000 -> 10% slab = 27,000
    // Mouse: 5 * 500 = 2,500 -> does NOT qualify for 20+ slab -> 2,500 (NOT discounted by Keyboard's 10%!)
    // Total after Round 1 = 27,000 + 2,500 = 29,500!
    // Because maxRounds = 1, Round 2 (Advance Payment) and Round 3 (Delivery Window) must NOT be executed!
    assert.strictEqual(mOffer.originalAmount, 32500, 'List total = 30,000 + 2,500 = 32,500');
    assert.strictEqual(mOffer.negotiatedAmount, 29500, 'Only Keyboard gets 10% slab (-₹3,000); Mouse stays ₹2,500; maxRounds=1 prevents R2/R3');
    assert.strictEqual(mOffer.negotiationRounds.length, 1, 'maxRounds=1 must limit negotiationRounds to 1 round');
    assert.strictEqual(mOffer.items[0].totalNegotiatedPrice, 27000, 'Keyboard totalNegotiatedPrice = ₹27,000');
    assert.strictEqual(mOffer.items[1].totalNegotiatedPrice, 2500, 'Mouse totalNegotiatedPrice = ₹2,500 (0% discount)');
    console.log('  ✓ Tests 9, 10 & 11 Passed! Each item used its own slab (Keyboard 10%, Mouse 0%) and maxRounds=1 stopped after Round 1.\n');

    // =========================================================================
    // TEST 12: Lowest Cost and Fastest Delivery Plans Ranked Correctly
    // =========================================================================
    console.log('[Test 12] Verifying Lowest Cost and Fastest Delivery Plan Ranking...');
    resetStore();
    const sellerFastId = new mongoose.Types.ObjectId();
    const sellerCheapId = new mongoose.Types.ObjectId();
    const prodFastId = new mongoose.Types.ObjectId();
    const prodCheapId = new mongoose.Types.ObjectId();

    dbStore.users.push(
      { _id: sellerFastId, name: 'ExpressTech', companyName: 'ExpressTech Fast', role: 'seller' },
      { _id: sellerCheapId, name: 'ValueDirect', companyName: 'ValueDirect Wholesale', role: 'seller' }
    );

    // ExpressTech: Higher price (₹1,100), Fast 2-day delivery, no delivery extension policy
    // ValueDirect: Lower price (₹950), Slower 10-day delivery
    dbStore.products.push(
      {
        _id: prodFastId,
        sellerId: sellerFastId,
        name: 'Mechanical Keyboard',
        category: 'Electronics',
        price: 1100,
        costPrice: 800,
        stock: 100,
        moq: 1,
        standardLeadTimeDays: 2,
        active: true
      },
      {
        _id: prodCheapId,
        sellerId: sellerCheapId,
        name: 'Mechanical Keyboard',
        category: 'Electronics',
        price: 950,
        costPrice: 700,
        stock: 100,
        moq: 1,
        standardLeadTimeDays: 10,
        active: true
      }
    );

    dbStore.rules.push(
      {
        productId: prodFastId,
        sellerId: sellerFastId,
        minimumPrice: 1000,
        maximumDiscountPercent: 10,
        maximumDiscountAmount: 5000,
        minimumQuantity: 1,
        leadTimeExtraDiscount: 0,
        marginFloorPercent: 8.0,
        maxRounds: 3,
        negotiationEnabled: true
      },
      {
        productId: prodCheapId,
        sellerId: sellerCheapId,
        minimumPrice: 850,
        maximumDiscountPercent: 15,
        maximumDiscountAmount: 5000,
        minimumQuantity: 1,
        leadTimeExtraDiscount: 0,
        marginFloorPercent: 8.0,
        maxRounds: 3,
        negotiationEnabled: true
      }
    );

    const reqRank = {
      _id: new mongoose.Types.ObjectId(),
      buyerId: buyer1Id,
      rawPrompt: '10 Mechanical Keyboards',
      items: [{ item_name: 'Mechanical Keyboard', quantity: 10 }],
      targetBudget: 15000,
      deadlineDays: 10,
      status: 'MATCHING'
    };
    dbStore.requirements.push(reqRank);

    const rankedOffers = await processRequirementMatchingAndNegotiation(reqRank);
    assert.strictEqual(rankedOffers.length, 2, 'Should generate 2 valid offers');

    const lowestCostOffer = rankedOffers.find(o => o.isBestDeal);
    const fastestDeliveryOffer = rankedOffers.find(o => o.isFastestDelivery);

    assert(lowestCostOffer, 'Must identify a Lowest Cost (isBestDeal) offer');
    assert(fastestDeliveryOffer, 'Must identify a Fastest Delivery (isFastestDelivery) offer');
    assert.strictEqual(lowestCostOffer.sellerId.toString(), sellerCheapId.toString(), 'ValueDirect (₹9,500) must win Lowest Cost');
    assert.strictEqual(fastestDeliveryOffer.sellerId.toString(), sellerFastId.toString(), 'ExpressTech (2 days) must win Fastest Delivery');
    console.log('  ✓ Test 12 Passed! Lowest Cost (ValueDirect @ ₹9,500) and Fastest Delivery (ExpressTech @ 2 days) ranked accurately.\n');

    // =========================================================================
    // TEST 13: Fallback Parser Removes Currency Values Without "undefined" Corruption
    // =========================================================================
    console.log('[Test 13] Verifying Fallback Parser Currency Removal Without "undefined"...');
    const parsedA = fallbackParsePrompt('Need 25 Mechanical Keyboards under ₹30,000 and 15 Optical Mice for 12000 rs within 10 days');
    for (const it of parsedA.items) {
      assert(!it.item_name.toLowerCase().includes('undefined'), `Item name "${it.item_name}" must not contain "undefined"`);
    }
    assert.strictEqual(parsedA.items[0].item_name, 'Mechanical Keyboards');
    assert.strictEqual(parsedA.items[0].quantity, 25);
    assert.strictEqual(parsedA.items[1].item_name, 'Optical Mice');
    assert.strictEqual(parsedA.items[1].quantity, 15);
    console.log('  ✓ Test 13 Passed! Fallback parser cleanly extracted items without "undefined":', JSON.stringify(parsedA.items));

    console.log('\n===================================================================');
    console.log('✅ ALL 13 PHASE 1 & PHASE 2 LIVE VERIFICATION TESTS PASSED!');
    console.log('===================================================================\n');
  } catch (err) {
    console.error('\n❌ LIVE VERIFICATION TEST FAILED:', err);
    process.exit(1);
  }
})();
