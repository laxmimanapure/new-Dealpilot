const mongoose = require('mongoose');

const requirementItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      default: null
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    item_name: { type: String, required: true },
    category: { type: String, default: null },
    quantity: { type: Number, required: true, min: 1 },
    estimated_budget: { type: Number, default: null }
  },
  { _id: false }
);

const procurementRequirementSchema = new mongoose.Schema(
  {
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    rawPrompt: {
      type: String,
      required: true
    },
    parsedSummary: {
      type: String
    },
    items: [requirementItemSchema],
    targetBudget: {
      type: Number,
      required: true
    },
    deadlineDays: {
      type: Number,
      default: 14
    },
    isAdvancePayment: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ['SUBMITTED', 'MATCHING', 'NEGOTIATING', 'OFFER_READY', 'ORDERED', 'COMPLETED', 'CANCELLED'],
      default: 'SUBMITTED'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('ProcurementRequirement', procurementRequirementSchema);
