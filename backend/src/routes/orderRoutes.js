const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const SellerOffer = require('../models/SellerOffer');
const ProcurementRequirement = require('../models/ProcurementRequirement');
const Product = require('../models/Product');
const ProductRule = require('../models/ProductRule');
const User = require('../models/User');
const Payment = require('../models/Payment');
const { authenticateToken } = require('../middleware/auth');
const { createRazorpayOrder, verifyPayment } = require('../services/paymentService');
const { buildItemNegotiationProfile, roundToTwo } = require('../services/negotiationEngine');
const { logAuditEvent } = require('../services/auditService');

router.use(authenticateToken);

function generateOrderNumber() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let rand = '';
  for (let i = 0; i < 6; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `DP-ORD-${rand}`;
}

function validateDeliveryAddress(address) {
  if (!address) {
    return 'Delivery address is required.';
  }
  const { fullName, phoneNumber, addressLine1, city, state, pinCode, pincode } = address;
  const pin = pinCode || pincode;

  if (!fullName || !fullName.trim()) return 'Full name in delivery address is required.';
  if (!phoneNumber || !phoneNumber.trim()) return 'Phone number in delivery address is required.';

  const cleanPhone = String(phoneNumber).replace(/[\s-]/g, '');
  if (!/^\d{10}$/.test(cleanPhone)) {
    return 'Phone number must be a valid 10-digit number.';
  }

  if (!addressLine1 || !addressLine1.trim()) return 'Address Line 1 is required.';
  if (!city || !city.trim()) return 'City is required.';
  if (!state || !state.trim()) return 'State is required.';
  if (!pin || !String(pin).trim()) return 'PIN code is required.';

  const cleanPin = String(pin).trim();
  if (!/^\d{6}$/.test(cleanPin)) {
    return 'PIN code must be a valid 6-digit Indian PIN code.';
  }

  return null;
}

/**
 * Core live order creation & validation logic (used by POST /api/orders)
 * - Enforces buyer role and requirement ownership
 * - Verifies offer belongs to requirement and has status === 'VALID'
 * - Revalidates MOQ, stock, seller minimum price, margin floor, max discount %, and max discount amount
 * - Prevents double application of advance/online payment discount
 * - Atomically prevents concurrent duplicate orders and overselling stock
 */
async function processOrderCreation({ user, body }) {
  if (!user || user.role !== 'buyer') {
    const err = new Error('Forbidden: Only authenticated buyers can create procurement orders.');
    err.statusCode = 403;
    throw err;
  }

  const { requestId, offerId, paymentMethod, deliveryAddress, leadTimeDays } = body || {};

  const addressError = validateDeliveryAddress(deliveryAddress);
  if (addressError) {
    const err = new Error(addressError);
    err.statusCode = 400;
    throw err;
  }

  let offer = null;
  if (offerId) {
    offer = await SellerOffer.findById(offerId);
  }
  if (!offer && requestId) {
    offer = await SellerOffer.findOne({ requirementId: requestId, status: 'VALID', isBestDeal: true });
    if (!offer) {
      offer = await SellerOffer.findOne({ requirementId: requestId, status: 'VALID' });
    }
  }

  if (!offer) {
    const err = new Error('Valid seller offer not found for this procurement requirement');
    err.statusCode = 404;
    throw err;
  }

  // Verify that if requestId was provided, the offer actually belongs to that requirement
  if (requestId && offer.requirementId.toString() !== requestId.toString()) {
    const err = new Error('Offer does not belong to the specified procurement requirement');
    err.statusCode = 400;
    throw err;
  }

  const requirement = await ProcurementRequirement.findById(offer.requirementId);
  if (!requirement) {
    const err = new Error('Requirement not found');
    err.statusCode = 404;
    throw err;
  }

  // Verify that the requirement belongs to the authenticated buyer
  if (requirement.buyerId.toString() !== user.id.toString()) {
    const err = new Error('Unauthorized to place order for another buyer requirement');
    err.statusCode = 403;
    throw err;
  }

  // Strictly block REJECTED or OVER_BUDGET offers from being purchased
  if (offer.status !== 'VALID') {
    const err = new Error(
      `Cannot purchase an offer with status "${offer.status}". ${offer.rejectionReason || 'Offer does not satisfy buyer budget or seller policy rules.'}`
    );
    err.statusCode = 400;
    throw err;
  }

  if (!Array.isArray(offer.items) || offer.items.length === 0) {
    const err = new Error('Offer has no valid line items');
    err.statusCode = 400;
    throw err;
  }

  // Revalidate every item against live Product and ProductRule in MongoDB
  const itemProfiles = [];
  for (const offerItem of offer.items) {
    if (!offerItem.productId) {
      const err = new Error(`Invalid offer item "${offerItem.name}": missing productId.`);
      err.statusCode = 400;
      throw err;
    }

    const prod = await Product.findById(offerItem.productId).lean();
    if (!prod || prod.active === false) {
      const err = new Error(`Product "${offerItem.name}" is no longer active or available.`);
      err.statusCode = 400;
      throw err;
    }

    if (prod.sellerId.toString() !== offer.sellerId.toString()) {
      const err = new Error(`Product "${offerItem.name}" does not belong to the offer's seller.`);
      err.statusCode = 400;
      throw err;
    }

    const rule = await ProductRule.findOne({ productId: prod._id }).lean();
    const profile = buildItemNegotiationProfile(prod, rule, offerItem.quantity);

    if (offerItem.quantity < profile.effectiveMOQ) {
      const err = new Error(
        `MOQ breach: Requested quantity (${offerItem.quantity}) is below minimum order quantity (MOQ: ${profile.effectiveMOQ}) for "${prod.name}".`
      );
      err.statusCode = 400;
      throw err;
    }

    if (profile.maxQuantityRule !== null && offerItem.quantity > profile.maxQuantityRule) {
      const err = new Error(
        `Maximum quantity breach: Requested quantity (${offerItem.quantity}) exceeds maximum allowed (${profile.maxQuantityRule}) for "${prod.name}".`
      );
      err.statusCode = 400;
      throw err;
    }

    if (prod.stock < offerItem.quantity) {
      const err = new Error(
        `Stock deficit: Requested ${offerItem.quantity} units of "${prod.name}", but only ${prod.stock} units are in stock.`
      );
      err.statusCode = 400;
      throw err;
    }

    if (profile.initialMarginPct < profile.marginFloorPct) {
      const err = new Error(
        `Margin floor breach: Product "${prod.name}" list margin (${profile.initialMarginPct}%) is below seller margin floor (${profile.marginFloorPct}%).`
      );
      err.statusCode = 400;
      throw err;
    }

    itemProfiles.push({ offerItem, prod, rule, profile });
  }

  const recomputedListTotal = roundToTwo(itemProfiles.reduce((s, x) => s + x.profile.totalListPrice, 0));
  const recomputedMinAllowedTotal = roundToTwo(
    Math.max(
      Number(offer.minAllowedPrice || 0),
      itemProfiles.reduce((s, x) => s + x.profile.effectiveMinAllowedPrice, 0)
    )
  );

  // Derive payable base strictly from the verified offer in MongoDB (never trust client-sent price/discount)
  const negotiatedBaseAmount = roundToTwo(offer.negotiatedAmount);

  // Reject manipulated or stale offers whose price is below the seller's permitted minimum price floor
  if (negotiatedBaseAmount < recomputedMinAllowedTotal) {
    const err = new Error(
      `Policy breach: Offer price (₹${negotiatedBaseAmount}) is below the seller's minimum permitted price floor (₹${recomputedMinAllowedTotal}).`
    );
    err.statusCode = 400;
    throw err;
  }

  // Revalidate against buyer's target budget
  if (negotiatedBaseAmount > requirement.targetBudget) {
    const err = new Error(
      `Budget breach: Offer price (₹${negotiatedBaseAmount}) exceeds buyer target budget (₹${requirement.targetBudget}).`
    );
    err.statusCode = 400;
    throw err;
  }

  const selectedPaymentMethod = paymentMethod === 'COD' ? 'COD' : 'ONLINE';
  const bd = offer.discountBreakdown || {};
  const advanceAlreadyApplied = Boolean(
    bd.advancePayDiscount?.applied ||
    bd.advance_pay_discount?.applied ||
    (offer.negotiationRounds || []).some(r => r.round_number === 2 && Number(r.accepted) === 1)
  );

  let onlineDiscountPct = 0;
  let onlineDiscountAmount = 0;
  let finalAmount = negotiatedBaseAmount;
  let initialPaymentStatus = 'PENDING_PAYMENT';
  let initialOrderStatus = 'PENDING';

  // Ensure advance/online payment discount is applied AT MOST ONCE
  if (selectedPaymentMethod === 'ONLINE' && !advanceAlreadyApplied) {
    let totalOnlineDisc = 0;
    const discountRatio = recomputedListTotal > 0 ? (negotiatedBaseAmount / recomputedListTotal) : 1;

    for (const { offerItem, profile } of itemProfiles) {
      const itemNegPrice = roundToTwo(
        offerItem.totalNegotiatedPrice ?? (profile.totalListPrice * discountRatio)
      );

      if (
        profile.negotiationEnabled &&
        profile.maxRounds >= 2 &&
        profile.earlyPayDiscountPct > 0 &&
        itemNegPrice > profile.effectiveMinAllowedPrice
      ) {
        let itemAfterOnline = roundToTwo(itemNegPrice * (1 - profile.earlyPayDiscountPct / 100));
        if (itemAfterOnline < profile.effectiveMinAllowedPrice) {
          itemAfterOnline = profile.effectiveMinAllowedPrice;
        }
        totalOnlineDisc = roundToTwo(totalOnlineDisc + (itemNegPrice - itemAfterOnline));
      }
    }

    const maxPermittedExtraDiscount = Math.max(0, roundToTwo(negotiatedBaseAmount - recomputedMinAllowedTotal));
    onlineDiscountAmount = Math.min(totalOnlineDisc, maxPermittedExtraDiscount);
    finalAmount = roundToTwo(negotiatedBaseAmount - onlineDiscountAmount);
    onlineDiscountPct = onlineDiscountAmount > 0
      ? roundToTwo((onlineDiscountAmount / negotiatedBaseAmount) * 100)
      : 0;
  }

  if (selectedPaymentMethod === 'COD') {
    onlineDiscountPct = 0;
    onlineDiscountAmount = 0;
    finalAmount = negotiatedBaseAmount;
    initialPaymentStatus = 'PENDING_PAYMENT';
    initialOrderStatus = 'CONFIRMED';
  }

  // Final safety check against seller minimum allowed price and buyer budget
  if (finalAmount < recomputedMinAllowedTotal) {
    const err = new Error(
      `Final payable amount (₹${finalAmount}) violates seller minimum price floor (₹${recomputedMinAllowedTotal}).`
    );
    err.statusCode = 400;
    throw err;
  }
  if (finalAmount > requirement.targetBudget) {
    const err = new Error(
      `Final payable amount (₹${finalAmount}) exceeds buyer target budget (₹${requirement.targetBudget}).`
    );
    err.statusCode = 400;
    throw err;
  }

  // Prevent duplicate confirmed/paid orders for the same requirement
  const existingConfirmedOrder = await Order.findOne({
    requirementId: requirement._id,
    $or: [{ orderStatus: 'CONFIRMED' }, { paymentStatus: 'PAID' }]
  });
  if (existingConfirmedOrder) {
    const err = new Error(
      `Duplicate order prevented: Order ${existingConfirmedOrder.orderNumber} is already confirmed for this requirement.`
    );
    err.statusCode = 409;
    throw err;
  }

  // Atomically claim the requirement to prevent concurrent duplicate orders on the same requirement
  const claimedReq = await ProcurementRequirement.findOneAndUpdate(
    { _id: requirement._id, buyerId: user.id, status: { $ne: 'ORDERED' } },
    { $set: { status: 'ORDERED' } },
    { new: true }
  );

  if (!claimedReq) {
    const err = new Error(
      'Duplicate order prevented: An order has already been placed or is currently in progress for this requirement.'
    );
    err.statusCode = 409;
    throw err;
  }

  // Atomically deduct product stock using conditional updates to prevent overselling across concurrent orders
  const deductedItems = [];
  let stockError = null;

  for (const { offerItem, prod } of itemProfiles) {
    const updatedProduct = await Product.findOneAndUpdate(
      {
        _id: prod._id,
        active: { $ne: false },
        stock: { $gte: offerItem.quantity }
      },
      { $inc: { stock: -offerItem.quantity } },
      { new: true }
    );

    if (!updatedProduct) {
      stockError = `Stock deficit: Could not reserve ${offerItem.quantity} units of "${prod.name}" due to insufficient stock.`;
      break;
    }

    deductedItems.push({ productId: prod._id, quantity: offerItem.quantity });
  }

  if (stockError) {
    for (const d of deductedItems) {
      await Product.updateOne({ _id: d.productId }, { $inc: { stock: d.quantity } });
    }
    await ProcurementRequirement.updateOne(
      { _id: requirement._id },
      { $set: { status: 'OFFER_READY' } }
    );
    const err = new Error(stockError);
    err.statusCode = 400;
    throw err;
  }

  const orderNumber = generateOrderNumber();
  const cleanPin = String(deliveryAddress.pinCode || deliveryAddress.pincode).trim();
  const totalSavings = roundToTwo(recomputedListTotal - finalAmount);

  try {
    const order = await Order.create({
      orderNumber,
      buyerId: user.id,
      sellerId: offer.sellerId,
      requirementId: requirement._id,
      offerId: offer._id,
      items: offer.items.map(i => ({
        productId: i.productId,
        name: i.name,
        quantity: i.quantity,
        price: i.unitListPrice
      })),
      subtotal: recomputedListTotal,
      savings: totalSavings,
      negotiatedBaseAmount,
      onlineDiscountPercent: selectedPaymentMethod === 'ONLINE' ? onlineDiscountPct : 0,
      onlineDiscountAmount,
      finalAmount,
      leadTimeDays: leadTimeDays || offer.leadTimeDays || 7,
      paymentMethod: selectedPaymentMethod,
      deliveryAddress: {
        fullName: deliveryAddress.fullName.trim(),
        phoneNumber: String(deliveryAddress.phoneNumber).trim(),
        addressLine1: deliveryAddress.addressLine1.trim(),
        addressLine2: (deliveryAddress.addressLine2 || '').trim(),
        city: deliveryAddress.city.trim(),
        state: deliveryAddress.state.trim(),
        pinCode: cleanPin,
        deliveryInstructions: (deliveryAddress.deliveryInstructions || '').trim()
      },
      paymentStatus: initialPaymentStatus,
      orderStatus: initialOrderStatus,
      stockDeducted: true
    });

    await logAuditEvent({
      requestId: requirement._id,
      orderId: order._id,
      userId: user.id,
      action: 'BUYER_CONFIRMED_ORDER',
      details: {
        orderNumber,
        paymentMethod: selectedPaymentMethod,
        negotiatedBaseAmount,
        onlineDiscountAmount,
        finalAmount,
        leadTimeDays: order.leadTimeDays
      },
      policyResult: 'APPROVED'
    });

    return order;
  } catch (createErr) {
    // Rollback stock and requirement status if Order.create fails
    for (const d of deductedItems) {
      await Product.updateOne({ _id: d.productId }, { $inc: { stock: d.quantity } });
    }
    await ProcurementRequirement.updateOne(
      { _id: requirement._id },
      { $set: { status: 'OFFER_READY' } }
    );
    throw createErr;
  }
}

// POST /api/orders - Confirm Offer & Create Order
router.post('/orders', async (req, res) => {
  try {
    const order = await processOrderCreation({ user: req.user, body: req.body });

    res.status(201).json({
      message: 'Order created successfully',
      orderId: order._id,
      orderNumber: order.orderNumber,
      paymentMethod: order.paymentMethod,
      negotiatedBaseAmount: order.negotiatedBaseAmount,
      onlineDiscountAmount: order.onlineDiscountAmount,
      totalLandedCost: order.finalAmount,
      deliveryAddress: order.deliveryAddress
    });
  } catch (err) {
    console.error('Create order error:', err.message);
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

// GET /api/orders - Get buyer/seller orders
router.get('/orders', async (req, res) => {
  try {
    let orders;
    if (req.user.role === 'buyer') {
      orders = await Order.find({ buyerId: req.user.id })
        .populate('sellerId', 'name companyName email')
        .populate('requirementId', 'rawPrompt targetBudget')
        .sort({ createdAt: -1 })
        .lean();
    } else {
      orders = await Order.find({ sellerId: req.user.id })
        .populate('buyerId', 'name companyName email')
        .populate('requirementId', 'rawPrompt targetBudget')
        .sort({ createdAt: -1 })
        .lean();
    }

    const formatted = orders.map(o => ({
      id: o._id,
      order_number: o.orderNumber,
      buyer_id: o.buyerId?._id || o.buyerId,
      seller_id: o.sellerId?._id || o.sellerId,
      request_id: o.requirementId?._id,
      seller_company_name: o.sellerId?.companyName || o.sellerId?.name || 'Seller',
      seller_name: o.sellerId?.name,
      buyer_company_name: o.buyerId?.companyName || o.buyerId?.name || 'Buyer',
      buyer_name: o.buyerId?.name,
      parsed_summary: o.requirementId?.rawPrompt || 'Procurement Order',
      negotiated_base_amount: o.negotiatedBaseAmount || o.finalAmount,
      online_discount_percent: o.onlineDiscountPercent || 0,
      online_discount_amount: o.onlineDiscountAmount || 0,
      negotiated_price: o.finalAmount,
      total_landed_cost: o.finalAmount,
      savings: o.savings,
      lead_time_days: o.leadTimeDays,
      payment_method: o.paymentMethod || 'ONLINE',
      delivery_address: o.deliveryAddress
        ? {
            ...o.deliveryAddress,
            pincode: o.deliveryAddress.pinCode || o.deliveryAddress.pincode
          }
        : null,
      payment_status: o.paymentStatus === 'PAID' ? 'paid' : (o.paymentStatus === 'FAILED' ? 'failed' : 'pending'),
      order_status: o.orderStatus === 'CONFIRMED' ? 'confirmed' : 'pending',
      created_at: o.createdAt
    }));

    res.json({ orders: formatted });
  } catch (err) {
    console.error('Fetch orders error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders/:id
router.get('/orders/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('sellerId', 'name companyName email')
      .populate('buyerId', 'name companyName email')
      .populate('requirementId')
      .lean();

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Security check: only buyer or seller of the order can view it
    if (req.user.role === 'buyer' && order.buyerId?._id.toString() !== req.user.id.toString()) {
      return res.status(403).json({ error: 'Unauthorized to view another buyer order' });
    }
    if (req.user.role === 'seller' && order.sellerId?._id.toString() !== req.user.id.toString()) {
      return res.status(403).json({ error: 'Unauthorized to view another seller order' });
    }

    const payments = await Payment.find({ orderId: order._id }).sort({ createdAt: -1 }).lean();

    res.json({
      order: {
        id: order._id,
        order_number: order.orderNumber,
        buyer_id: order.buyerId?._id,
        seller_id: order.sellerId?._id,
        request_id: order.requirementId?._id,
        seller_company_name: order.sellerId?.companyName || order.sellerId?.name,
        buyer_name: order.buyerId?.name,
        buyer_email: order.buyerId?.email,
        items: order.items,
        subtotal: order.subtotal,
        savings: order.savings,
        negotiated_base_amount: order.negotiatedBaseAmount || order.finalAmount,
        online_discount_percent: order.onlineDiscountPercent || 0,
        online_discount_amount: order.onlineDiscountAmount || 0,
        negotiated_price: order.finalAmount,
        total_landed_cost: order.finalAmount,
        lead_time_days: order.leadTimeDays,
        payment_method: order.paymentMethod || 'ONLINE',
        delivery_address: order.deliveryAddress
          ? {
              ...order.deliveryAddress,
              pincode: order.deliveryAddress.pinCode || order.deliveryAddress.pincode
            }
          : null,
        payment_status: order.paymentStatus === 'PAID' ? 'paid' : (order.paymentStatus === 'FAILED' ? 'failed' : 'pending'),
        order_status: order.orderStatus === 'CONFIRMED' ? 'confirmed' : 'pending',
        payments: payments.map(p => ({
          id: p._id,
          razorpay_order_id: p.razorpayOrderId,
          razorpay_payment_id: p.razorpayPaymentId,
          amount: p.amount,
          status: p.status === 'SUCCESS' ? 'success' : (p.status === 'FAILED' ? 'failed' : 'initiated'),
          created_at: p.createdAt
        })),
        created_at: order.createdAt
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/checkout/create-razorpay-order & /api/payments/create
const handleCreatePayment = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'buyer') {
      return res.status(403).json({ error: 'Unauthorized: Only buyers can initiate order payments.' });
    }

    const { orderId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.buyerId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ error: 'Unauthorized: You do not own this order.' });
    }

    const rzpDetails = await createRazorpayOrder({
      orderId: order._id,
      userId: req.user.id,
      userRole: req.user.role
    });

    res.json({
      orderId: order._id,
      orderNumber: order.orderNumber,
      ...rzpDetails
    });
  } catch (err) {
    console.error('Create Razorpay order error:', err.message);
    res.status(err.statusCode || 500).json({ error: err.message });
  }
};

router.post('/checkout/create-razorpay-order', handleCreatePayment);
router.post('/payments/create', handleCreatePayment);

// POST /api/checkout/verify-payment & /api/payments/verify
const handleVerifyPayment = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'buyer') {
      return res.status(403).json({ error: 'Unauthorized: Only buyers can verify order payments.' });
    }

    const { orderId, razorpayPaymentId, razorpayOrderId, razorpaySignature, simulateFailure } = req.body;

    const verification = await verifyPayment({
      orderId,
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
      simulateFailure: !!simulateFailure,
      userId: req.user.id,
      userRole: req.user.role
    });

    if (!verification.success) {
      return res.status(400).json(verification);
    }

    res.json(verification);
  } catch (err) {
    console.error('Verify payment error:', err.message);
    res.status(err.statusCode || 500).json({ error: err.message });
  }
};

router.post('/checkout/verify-payment', handleVerifyPayment);
router.post('/payments/verify', handleVerifyPayment);

router.validateDeliveryAddress = validateDeliveryAddress;
router.processOrderCreation = processOrderCreation;
module.exports = router;
