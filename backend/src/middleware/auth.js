const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'dealpilot_secret_key_3.0_procure';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  console.log(`🔒 [Auth Diagnostic] Authorization header received: ${Boolean(authHeader)}`);

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.log(`🔒 [Auth Diagnostic] JWT verified: false (${err.message})`);
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    console.log(`🔒 [Auth Diagnostic] JWT verified: true | Authenticated user ID: ${user.id} | Role: ${user.role}`);
    req.user = user;
    next();
  });
}

function requireRole(allowedRoles) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: `Forbidden: Access requires ${roles.join(' or ')} role. User is ${req.user?.role}` 
      });
    }
    next();
  };
}

module.exports = {
  JWT_SECRET,
  authenticateToken,
  requireRole
};
