const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET, authenticateToken } = require('../middleware/auth');
const { logAuditEvent } = require('../services/auditService');

// POST /api/auth/signup & /api/auth/register
const handleSignup = async (req, res) => {
  try {
    const { name, email, password, role, company_name, phone } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, email, password, and role are required' });
    }

    if (!['buyer', 'seller'].includes(role)) {
      return res.status(400).json({ error: 'Role must be either buyer or seller' });
    }

    const trimmedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: trimmedEmail });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email: trimmedEmail,
      passwordHash,
      role,
      companyName: company_name || name,
      phone: phone || ''
    });

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    await logAuditEvent({
      userId: user._id,
      actor: `${user.name} (${user.companyName})`,
      action: 'USER_REGISTERED',
      details: { name: user.name, email: user.email, role: user.role, companyName: user.companyName },
      policyResult: 'APPROVED'
    });

    res.status(201).json({
      message: 'Account registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        company_name: user.companyName
      }
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: err.message });
  }
};

router.post('/signup', handleSignup);
router.post('/register', handleSignup);

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const trimmedEmail = email.toLowerCase().trim();
    console.log('🔒 [Auth Diagnostic] Login request received');
    console.log(`🔒 [Auth Diagnostic] Email: ${trimmedEmail}`);

    const user = await User.findOne({ email: trimmedEmail });
    console.log(`🔒 [Auth Diagnostic] User found: ${Boolean(user)}`);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    console.log(`🔒 [Auth Diagnostic] Password matched: ${Boolean(isValidPassword)}`);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    console.log(`🔒 [Auth Diagnostic] JWT_SECRET configured: ${Boolean(JWT_SECRET)}`);
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    console.log(`🔒 [Auth Diagnostic] JWT generated: ${Boolean(token)}`);

    await logAuditEvent({
      userId: user._id,
      actor: `${user.name} (${user.companyName})`,
      action: 'USER_LOGGED_IN',
      details: { email: user.email, role: user.role },
      policyResult: 'APPROVED'
    });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        company_name: user.companyName
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        company_name: user.companyName,
        phone: user.phone,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
