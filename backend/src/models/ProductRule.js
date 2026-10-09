const mongoose = require('mongoose');

const bulkDiscountRuleSchema = new mongoose.Schema(
  {
    minQuantity: { type: Number, required: true },
    maxQuantity: { type: Number },
    discountPercent: { type: Number, required: true }
  },
  { _id: false }
);

const productRuleSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      unique: true,
      index: true
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    minimumPrice: {
      type: Number,
      required: true
    },
    maximumDiscountPercent: {
      type: Number,
      default: 15.0
    },
    maximumDiscountAmount: {
      type: Number,
      default: 20000.0
    },
    minimumQuantity: {
      type: Number,
      default: 1
    },
    maximumQuantity: {
      type: Number
    },
    bulkDiscountRules: [bulkDiscountRuleSchema],
    earlyPaymentDiscount: {
      type: Number,
      default: 2.0
    },
    leadTimeExtensionDays: {
      type: Number,
      default: 7
    },
    leadTimeExtraDiscount: {
      type: Number,
      default: 1.0
    },
    marginFloorPercent: {
      type: Number,
      default: 8.0
    },
    maxRounds: {
      type: Number,
      default: 3
    },
    negotiationEnabled: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('ProductRule', productRuleSchema);
