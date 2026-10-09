const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const SellerOffer = require('../models/SellerOffer');
const ProcurementRequirement = require('../models/ProcurementRequirement');
const User = require('../models/User');
const Payment = require('../models/Payment');
const { authenticateToken } = require('../middleware/auth');
const { createRazorpayOrder, verifyPayment } = require('../services/paymentService');
const { logAuditEvent } = require('../services/auditService');

router.use(authenticateToken);

const ProductRule = require('../models/ProductRule');

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

// POST /api/orders - Confirm Offer & Create Order
router.post('/orders', async (req, res) => {
  try {
    const { requestId, offerId, paymentMethod, deliveryAddress, leadTimeDays } = req.body;

    const addressError = validateDeliveryAddress(deliveryAddress);
    if (addressError) {
      return res.status(400).json({ error: addressError });
    }

    let offer = null;
    if (offerId) {
      offer = await SellerOffer.findById(offerId);
    }
    if (!offer && requestId) {
      offer = await SellerOffer.findOne({ requirementId: requestId, isBestDeal: true });
      if (!offer) {
        offer = await SellerOffer.findOne({ requirementId: requestId });
      }
    }

    if (!offer) {
      return res.status(404).json({ error: 'Valid seller offer not found for this procurement requirement' });
    }

    const requirement = await ProcurementRequirement.findById(offer.requirementId);
    if (!requirement) {
      return res.status(404).json({ error: 'Requirement not found' });
    }

    // Verify buyer identity
    if (requirement.buyerId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ error: 'Unauthorized to place order for another buyer requirement' });
    }

    const selectedPaymentMethod = paymentMethod === 'COD' ? 'COD' : 'ONLINE';
    const negotiatedBaseAmount = offer.negotiatedAmount;
    const firstItem = offer.items?.[0];
    let onlineDiscountPct = 0;

    if (firstItem?.productId) {
      const rule = await ProductRule.findOne({ productId: firstItem.productId }).lean();
      if (rule) {
        onlineDiscountPct = rule.earlyPaymentDiscount ?? rule.early_payment_discount ?? rule.advance_pay_extra_discount_percent ?? 0;
      }
    }

    let onlineDiscountAmount = 0;
    let finalAmount = negotiatedBaseAmount;
    let initialPaymentStatus = 'PENDING_PAYMENT';
    let initialOrderStatus = 'PENDING';

    if (selectedPaymentMethod === 'ONLINE' && onlineDiscountPct > 0) {
      onlineDiscountAmount = Math.round((negotiatedBaseAmount * (onlineDiscountPct / 100)) * 100) / 100;
      finalAmount = Math.round((negotiatedBaseAmount - onlineDiscountAmount) * 100) / 100;
    }

    if (selectedPaymentMethod === 'COD') {
      onlineDiscountPct = 0;
      onlineDiscountAmount = 0;
      finalAmount = negotiatedBaseAmount;
      initialPaymentStatus = 'PENDING_PAYMENT';
      initialOrderStatus = 'CONFIRMED';
    }

    const orderNumber = generateOrderNumber();

    const order = await Order.create({
      orderNumber,
      buyerId: req.user.id,
      sellerId: offer.sellerId,
      requirementId: requirement._id,
      offerId: offer._id,
      items: offer.items.map(i => ({ name: i.name, quantity: i.quantity, price: i.unitListPrice })),
      subtotal: offer.originalAmount,
      savings: offer.savings,
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
        pinCode: String(deliveryAddress.pinCode).trim(),
        deliveryInstructions: (deliveryAddress.deliveryInstructions || '').trim()
      },
      paymentStatus: initialPaymentStatus,
      orderStatus: initialOrderStatus
    });

    requirement.status = 'ORDERED';
    await requirement.save();

    await logAuditEvent({
      requestId: requirement._id,
      orderId: order._id,
      userId: req.user.id,
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
    console.error('Create order error:', err);
    res.status(500).json({ error: err.message });
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
      delivery_address: o.deliveryAddress || null,
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
        delivery_address: order.deliveryAddress || null,
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
    const { orderId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const rzpDetails = await createRazorpayOrder({
      orderId: order._id,
      amount: order.finalAmount,
      userId: req.user.id
    });

    res.json({
      orderId: order._id,
      orderNumber: order.orderNumber,
      ...rzpDetails
    });
  } catch (err) {
    console.error('Create Razorpay order error:', err);
    res.status(500).json({ error: err.message });
  }
};

router.post('/checkout/create-razorpay-order', handleCreatePayment);
router.post('/payments/create', handleCreatePayment);

// POST /api/checkout/verify-payment & /api/payments/verify
const handleVerifyPayment = async (req, res) => {
  try {
    const { orderId, razorpayPaymentId, razorpayOrderId, razorpaySignature, simulateFailure } = req.body;

    const verification = await verifyPayment({
      orderId,
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
      simulateFailure: !!simulateFailure,
      userId: req.user.id
    });

    if (!verification.success) {
      return res.status(400).json(verification);
    }

    res.json(verification);
  } catch (err) {
    console.error('Verify payment error:', err);
    res.status(500).json({ error: err.message });
  }
};

router.post('/checkout/verify-payment', handleVerifyPayment);
router.post('/payments/verify', handleVerifyPayment);

router.validateDeliveryAddress = validateDeliveryAddress;
module.exports = router;
