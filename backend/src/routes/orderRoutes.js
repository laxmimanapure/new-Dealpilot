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

function generateOrderNumber() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let rand = '';
  for (let i = 0; i < 6; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `DP-ORD-${rand}`;
}

// POST /api/orders - Confirm Offer & Create Order
router.post('/orders', async (req, res) => {
  try {
    const { requestId, offerId, planType, totalLandedCost, leadTimeDays, sellerId } = req.body;

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

    const orderNumber = generateOrderNumber();
    const finalAmount = totalLandedCost ? Number(totalLandedCost) : offer.negotiatedAmount;
    const subtotal = offer.originalAmount;
    const savings = offer.savings;

    const order = await Order.create({
      orderNumber,
      buyerId: req.user.id,
      sellerId: offer.sellerId,
      requirementId: requirement._id,
      offerId: offer._id,
      items: offer.items.map(i => ({ name: i.name, quantity: i.quantity, price: i.unitListPrice })),
      subtotal,
      savings,
      finalAmount,
      leadTimeDays: leadTimeDays || offer.leadTimeDays || 7,
      paymentStatus: 'PENDING_PAYMENT',
      orderStatus: 'PENDING'
    });

    requirement.status = 'ORDERED';
    await requirement.save();

    await logAuditEvent({
      requestId: requirement._id,
      orderId: order._id,
      userId: req.user.id,
      action: 'BUYER_CONFIRMED_ORDER',
      details: { orderNumber, finalAmount, savings, leadTimeDays: order.leadTimeDays },
      policyResult: 'APPROVED'
    });

    res.status(201).json({
      message: 'Order created successfully',
      orderId: order._id,
      orderNumber: order.orderNumber,
      totalLandedCost: order.finalAmount
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
      negotiated_price: o.finalAmount,
      total_landed_cost: o.finalAmount,
      savings: o.savings,
      lead_time_days: o.leadTimeDays,
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
        negotiated_price: order.finalAmount,
        total_landed_cost: order.finalAmount,
        lead_time_days: order.leadTimeDays,
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

module.exports = router;
