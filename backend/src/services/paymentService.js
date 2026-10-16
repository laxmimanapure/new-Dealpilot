const crypto = require('crypto');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Product = require('../models/Product');
const { logAuditEvent } = require('./auditService');

let razorpayInstance = null;

try {
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    const Razorpay = require('razorpay');
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    console.log('💳 [Payment Service] Real Razorpay SDK initialized.');
  }
} catch (e) {
  console.log('💳 [Payment Service] Razorpay SDK fallback mode.');
}

function getRazorpaySecret() {
  return process.env.RAZORPAY_KEY_SECRET || process.env.JWT_SECRET || 'dealpilot_default_rzp_secret';
}

function generateRazorpaySignature(razorpayOrderId, razorpayPaymentId, secret = getRazorpaySecret()) {
  return crypto
    .createHmac('sha256', secret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');
}

/**
 * Creates a Razorpay order after verifying order ownership and buyer role
 */
async function createRazorpayOrder({ orderId, currency = 'INR', userId, userRole }) {
  if (userRole && userRole !== 'buyer') {
    const err = new Error('Unauthorized: Only buyers can initiate order payments.');
    err.statusCode = 403;
    throw err;
  }

  const order = await Order.findById(orderId);
  if (!order) {
    const err = new Error('Order not found');
    err.statusCode = 404;
    throw err;
  }

  if (!userId || order.buyerId.toString() !== userId.toString()) {
    const err = new Error('Unauthorized: You do not own this order.');
    err.statusCode = 403;
    throw err;
  }

  if (order.paymentStatus === 'PAID') {
    const err = new Error('Order is already paid.');
    err.statusCode = 400;
    throw err;
  }

  // Always derive amount from the verified server-side order record
  const verifiedAmount = Number(order.finalAmount);
  const amountInPaisa = Math.round(verifiedAmount * 100);
  const receipt = `rec_${order._id}_${Date.now()}`;

  let razorpayOrderId = `rzp_order_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  if (razorpayInstance) {
    try {
      const rzpOrder = await razorpayInstance.orders.create({
        amount: amountInPaisa,
        currency,
        receipt,
        notes: { orderId: order._id.toString() }
      });
      razorpayOrderId = rzpOrder.id;
    } catch (err) {
      console.warn('[Payment Service] Razorpay API order creation warning:', err.message);
    }
  }

  // Record payment initiation in MongoDB
  await Payment.create({
    orderId: order._id,
    razorpayOrderId,
    amount: verifiedAmount,
    status: 'INITIATED'
  });

  await logAuditEvent({
    orderId: order._id,
    userId,
    action: 'PAYMENT_INITIATED',
    details: { orderId: order._id, razorpayOrderId, amount: verifiedAmount, currency },
    policyResult: 'INFO'
  });

  return {
    razorpayOrderId,
    amount: amountInPaisa,
    currency,
    keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_demo_key'
  };
}

/**
 * Verifies Razorpay payment signature and ownership on backend
 */
async function verifyPayment({
  orderId,
  razorpayPaymentId,
  razorpayOrderId,
  razorpaySignature,
  simulateFailure = false,
  userId,
  userRole
}) {
  if (userRole && userRole !== 'buyer') {
    const err = new Error('Unauthorized: Only buyers can verify order payments.');
    err.statusCode = 403;
    throw err;
  }

  const order = await Order.findById(orderId);
  if (!order) {
    const err = new Error('Order not found');
    err.statusCode = 404;
    throw err;
  }

  if (!userId || order.buyerId.toString() !== userId.toString()) {
    const err = new Error('Unauthorized: You do not own this order.');
    err.statusCode = 403;
    throw err;
  }

  // Idempotency guard: if already paid, do not re-process or re-deduct stock
  if (order.paymentStatus === 'PAID' && order.orderStatus === 'CONFIRMED') {
    return {
      success: true,
      message: 'Payment already verified and order confirmed.',
      order_number: order.orderNumber
    };
  }

  if (simulateFailure) {
    order.paymentStatus = 'FAILED';
    order.orderStatus = 'PENDING';
    await order.save();

    await Payment.findOneAndUpdate(
      { orderId: order._id },
      { status: 'FAILED', errorMessage: 'Payment declined or cancelled by user' },
      { sort: { createdAt: -1 } }
    );

    await logAuditEvent({
      orderId: order._id,
      userId,
      action: 'PAYMENT_FAILED',
      details: { orderNumber: order.orderNumber, reason: 'Payment failed at gateway' },
      policyResult: 'REJECTED'
    });

    return {
      success: false,
      message: 'Payment failed at gateway. Order status marked as FAILED. You can retry payment.',
      order_number: order.orderNumber,
      can_retry: true
    };
  }

  // Require valid payment identifiers and cryptographic signature — NEVER skip verification when missing
  const cleanOrderId = typeof razorpayOrderId === 'string' ? razorpayOrderId.trim() : '';
  const cleanPaymentId = typeof razorpayPaymentId === 'string' ? razorpayPaymentId.trim() : '';
  const cleanSignature = typeof razorpaySignature === 'string' ? razorpaySignature.trim() : '';

  if (!cleanOrderId || !cleanPaymentId || !cleanSignature) {
    order.paymentStatus = 'FAILED';
    order.orderStatus = 'PENDING';
    await order.save();

    await Payment.findOneAndUpdate(
      { orderId: order._id },
      { status: 'FAILED', errorMessage: 'Missing Razorpay payment identifiers or signature' },
      { sort: { createdAt: -1 } }
    );

    await logAuditEvent({
      orderId: order._id,
      userId,
      action: 'PAYMENT_SIGNATURE_MISSING',
      details: { orderNumber: order.orderNumber },
      policyResult: 'REJECTED'
    });

    return {
      success: false,
      message: 'Payment verification failed: Missing required Razorpay payment identifiers or signature.',
      order_number: order.orderNumber,
      can_retry: true
    };
  }

  // Verify HMAC SHA256 signature
  const razorpaySecret = getRazorpaySecret();
  const generatedSignature = generateRazorpaySignature(cleanOrderId, cleanPaymentId, razorpaySecret);

  if (generatedSignature !== cleanSignature) {
    order.paymentStatus = 'FAILED';
    order.orderStatus = 'PENDING';
    await order.save();

    await Payment.findOneAndUpdate(
      { orderId: order._id },
      { status: 'FAILED', errorMessage: 'Invalid Razorpay HMAC signature verification' },
      { sort: { createdAt: -1 } }
    );

    await logAuditEvent({
      orderId: order._id,
      userId,
      action: 'PAYMENT_SIGNATURE_MISMATCH',
      details: { orderNumber: order.orderNumber },
      policyResult: 'REJECTED'
    });

    return {
      success: false,
      message: 'Payment signature verification failed. Order payment rejected.',
      order_number: order.orderNumber,
      can_retry: true
    };
  }

  // If stock was not yet deducted on this order (e.g., legacy order), deduct atomically once
  if (!order.stockDeducted && Array.isArray(order.items) && order.items.length > 0) {
    const deducted = [];
    for (const item of order.items) {
      if (!item.productId) continue;
      const updatedProd = await Product.findOneAndUpdate(
        { _id: item.productId, active: { $ne: false }, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { new: true }
      );
      if (!updatedProd) {
        for (const d of deducted) {
          await Product.updateOne({ _id: d.productId }, { $inc: { stock: d.quantity } });
        }
        return {
          success: false,
          message: `Insufficient stock to confirm order for item "${item.name}".`,
          order_number: order.orderNumber,
          can_retry: false
        };
      }
      deducted.push({ productId: item.productId, quantity: item.quantity });
    }
    order.stockDeducted = true;
  }

  // Successful Payment Verification
  order.paymentStatus = 'PAID';
  order.orderStatus = 'CONFIRMED';
  await order.save();

  await Payment.findOneAndUpdate(
    { orderId: order._id },
    {
      status: 'SUCCESS',
      razorpayOrderId: cleanOrderId,
      razorpayPaymentId: cleanPaymentId,
      razorpaySignature: cleanSignature
    },
    { sort: { createdAt: -1 }, upsert: true }
  );

  await logAuditEvent({
    orderId: order._id,
    userId,
    action: 'PAYMENT_VERIFIED_AND_ORDER_CONFIRMED',
    details: { orderNumber: order.orderNumber, amount: order.finalAmount, paymentId: cleanPaymentId },
    policyResult: 'APPROVED'
  });

  return {
    success: true,
    message: 'Payment verified successfully! Order status is now CONFIRMED.',
    order_number: order.orderNumber
  };
}

module.exports = {
  createRazorpayOrder,
  verifyPayment,
  generateRazorpaySignature
};
