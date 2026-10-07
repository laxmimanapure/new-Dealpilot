const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    requirementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProcurementRequirement'
    },
    negotiationId: {
      type: mongoose.Schema.Types.ObjectId
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    actor: {
      type: String
    },
    action: {
      type: String,
      required: true
    },
    details: {
      type: mongoose.Schema.Types.Mixed
    },
    policyResult: {
      type: String,
      enum: ['APPROVED', 'REJECTED', 'INFO'],
      default: 'INFO'
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('AuditLog', auditLogSchema);
