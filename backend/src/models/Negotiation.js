const mongoose = require('mongoose');

const negotiationSchema = new mongoose.Schema(
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
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    originalPrice: {
      type: Number,
      required: true
    },
    negotiatedPrice: {
      type: Number,
      required: true
    },
    rulesApplied: [{ type: String }],
    concessions: [{ type: String }],
    status: {
      type: String,
      enum: ['PENDING', 'AGREED', 'REJECTED'],
      default: 'PENDING'
    },
    rounds: [mongoose.Schema.Types.Mixed]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Negotiation', negotiationSchema);
