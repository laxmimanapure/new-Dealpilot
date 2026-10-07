const mongoose = require('mongoose');

const offerItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    unitListPrice: { type: Number, required: true },
    totalListPrice: { type: Number, required: true }
  },
  { _id: false }
);

const negotiationRoundSchema = new mongoose.Schema(
  {
    round_number: { type: Number, required: true },
    lever_applied: { type: String, required: true },
    calculated_price: { type: Number, required: true },
    discount_percent: { type: Number },
    total_discount_amount: { type: Number },
    seller_margin_percent: { type: Number },
    accepted: { type: Number, required: true }, // 1 or 0
    rejection_reason: { type: String },
    explanation: { type: String }
  },
  { _id: false }
);

const sellerOfferSchema = new mongoose.Schema(
  {
    requirementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProcurementRequirement',
      required: true,
      index: true
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    items: [offerItemSchema],
    originalAmount: {
      type: Number,
      required: true
    },
    negotiatedAmount: {
      type: Number,
      required: true
    },
    savings: {
      type: Number,
      required: true
    },
    leadTimeDays: {
      type: Number,
      default: 7
    },
    status: {
      type: String,
      enum: ['VALID', 'OVER_BUDGET', 'REJECTED'],
      default: 'VALID'
    },
    rejectionReason: {
      type: String
    },
    negotiationRounds: [negotiationRoundSchema],
    isBestDeal: {
      type: Boolean,
      default: false
    },
    whyThisDeal: [{ type: String }]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('SellerOffer', sellerOfferSchema);
