const AuditLog = require('../models/AuditLog');
const User = require('../models/User');

/**
 * Logs an event to the MONGODB audit trail collection.
 */
async function logAuditEvent({ requestId, negotiationId, orderId, userId, actor, action, eventType, details, policyResult = 'INFO' }) {
  try {
    let actorName = actor;
    if (!actorName && userId) {
      const u = await User.findById(userId).select('name email role companyName').lean();
      if (u) {
        actorName = `${u.name} (${u.companyName || u.role})`;
      }
    }

    const logEntry = await AuditLog.create({
      requirementId: requestId || null,
      negotiationId: negotiationId || null,
      orderId: orderId || null,
      userId: userId || null,
      actor: actorName || 'System Engine',
      action: action || eventType || 'SYSTEM_ACTION',
      details: details || {},
      policyResult: policyResult || 'INFO',
      timestamp: new Date()
    });

    return logEntry._id;
  } catch (err) {
    console.error('Failed to log audit event to MongoDB:', err.message);
    return null;
  }
}

async function getAuditTrail({ requestId, orderId, userId, role }) {
  try {
    const query = {};

    if (requestId) {
      query.requirementId = requestId;
    }
    if (orderId) {
      query.orderId = orderId;
    }

    if (userId) {
      query.userId = userId;
    }

    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1, _id: -1 })
      .lean();

    return logs.map(l => ({
      id: l._id,
      request_id: l.requirementId,
      order_id: l.orderId,
      user_id: l.userId,
      actor: l.actor,
      event_type: l.action,
      action: l.action,
      details_json: JSON.stringify(l.details || {}),
      details: l.details || {},
      policy_result: l.policyResult,
      timestamp: l.timestamp
    }));
  } catch (err) {
    console.error('Failed to query audit trail:', err.message);
    return [];
  }
}

module.exports = {
  logAuditEvent,
  getAuditTrail
};
