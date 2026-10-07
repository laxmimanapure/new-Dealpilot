const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    requirementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProcurementRequirement',
      required: true
    },
    offerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SellerOffer'
    },
    items: [orderItemSchema],
    subtotal: {
      type: Number,
      required: true
    },
    savings: {
      type: Number,
      default: 0
    },
    finalAmount: {
      type: Number,
      required: true
    },
    leadTimeDays: {
      type: Number,
      default: 7
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING_PAYMENT', 'PAID', 'FAILED'],
      default: 'PENDING_PAYMENT'
    },
    orderStatus: {
      type: String,
      enum: ['PENDING', 'CONFIRMED', 'CANCELLED'],
      default: 'PENDING'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Order', orderSchema);
