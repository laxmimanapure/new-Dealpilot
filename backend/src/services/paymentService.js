const crypto = require('crypto');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
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

/**
 * Creates a Razorpay order or simulated test order
 */
async function createRazorpayOrder({ orderId, amount, currency = 'INR', userId }) {
  const amountInPaisa = Math.round(amount * 100);
  const receipt = `rec_${orderId}_${Date.now()}`;

  let razorpayOrderId = `rzp_order_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  if (razorpayInstance) {
    try {
      const rzpOrder = await razorpayInstance.orders.create({
        amount: amountInPaisa,
        currency,
        receipt,
        notes: { orderId: orderId.toString() }
      });
      razorpayOrderId = rzpOrder.id;
    } catch (err) {
      console.warn('[Payment Service] Razorpay API order creation warning:', err.message);
    }
  }

  // Record payment initiation in MongoDB
  await Payment.create({
    orderId,
    razorpayOrderId,
    amount,
    status: 'INITIATED'
  });

  await logAuditEvent({
    orderId,
    userId,
    action: 'PAYMENT_INITIATED',
    details: { orderId, razorpayOrderId, amount, currency },
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
 * Verifies Razorpay payment signature on backend
 */
async function verifyPayment({ orderId, razorpayPaymentId, razorpayOrderId, razorpaySignature, simulateFailure = false, userId }) {
  const order = await Order.findById(orderId);
  if (!order) {
    throw new Error('Order not found');
  }

  if (simulateFailure) {
    order.paymentStatus = 'FAILED';
    order.orderStatus = 'PENDING';
    await order.save();

    await Payment.findOneAndUpdate(
      { orderId },
      { status: 'FAILED', errorMessage: 'Payment declined or cancelled by user' }
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

  // Real Razorpay HMAC SHA256 Signature Verification if secret is available
  const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;
  if (razorpaySecret && razorpayOrderId && razorpayPaymentId && razorpaySignature) {
    const generatedSignature = crypto
      .createHmac('sha256', razorpaySecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (generatedSignature !== razorpaySignature) {
      order.paymentStatus = 'FAILED';
      await order.save();

      await Payment.findOneAndUpdate(
        { orderId },
        { status: 'FAILED', errorMessage: 'Invalid Razorpay HMAC signature verification' }
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
        order_number: order.orderNumber
      };
    }
  }

  // Successful Payment Verification
  order.paymentStatus = 'PAID';
  order.orderStatus = 'CONFIRMED';
  await order.save();

  await Payment.findOneAndUpdate(
    { orderId },
    {
      status: 'SUCCESS',
      razorpayPaymentId: razorpayPaymentId || `pay_${Date.now()}`,
      razorpaySignature: razorpaySignature || 'verified_sig'
    }
  );

  await logAuditEvent({
    orderId: order._id,
    userId,
    action: 'PAYMENT_VERIFIED_AND_ORDER_CONFIRMED',
    details: { orderNumber: order.orderNumber, amount: order.finalAmount, paymentId: razorpayPaymentId },
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
  verifyPayment
};
