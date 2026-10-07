const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { getAuditTrail } = require('../services/auditService');

router.use(authenticateToken);

// GET /api/audit
router.get('/', async (req, res) => {
  try {
    const { requestId, orderId } = req.query;
    const events = await getAuditTrail({
      requestId,
      orderId,
      userId: req.user.id,
      role: req.user.role
    });
    res.json({ auditTrail: events });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
