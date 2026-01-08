const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User, Barangay, Resident } = require('../models');
const { auth } = require('../middleware/auth');
const emailService = require('../services/emailService');

// Validation rules
const registerValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Invalid email address'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('first_name').optional().trim().isLength({ max: 50 }),
  body('last_name').optional().trim().isLength({ max: 50 })
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Invalid email address'),
  body('password').notEmpty().withMessage('Password is required')
];

// Generate tokens
const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role, barangay_id: user.barangay_id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' }
  );
};

// POST /api/auth/register - Register new user (Resident self-registration)
router.post('/register', registerValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, first_name, last_name, barangay_id, phone } = req.body;

    // Require barangay selection for resident registration
    if (!barangay_id) {
      return res.status(400).json({ message: 'Please select a barangay' });
    }

    // Check if user exists
    const existingUser = await User.findOne({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Validate barangay
    const barangay = await Barangay.findByPk(barangay_id);
    if (!barangay || !barangay.is_active) {
      return res.status(400).json({ message: 'Invalid or inactive barangay' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate email verification token
    const verification_token = crypto.randomBytes(32).toString('hex');

    // Create user with pending approval for residents
    const user = await User.create({
      email,
      password: hashedPassword,
      first_name,
      last_name,
      phone,
      barangay_id,
      role: 'resident',
      verification_token,
      status: 'active',
      approval_status: 'pending', // Requires barangay admin approval
      is_approved: false
    });

    // Send verification email
    try {
      await emailService.sendVerificationEmail(user, verification_token);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
    }

    // Don't generate tokens yet - user needs approval first
    res.status(201).json({
      message: 'Registration successful. Your account is pending approval from the barangay administrator.',
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        barangay_id: user.barangay_id,
        barangay_name: barangay.name,
        approval_status: user.approval_status
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// POST /api/auth/login - User login
router.post('/login', loginValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user with barangay info
    const user = await User.findOne({
      where: { email },
      include: [{
        model: Barangay,
        as: 'barangay',
        attributes: ['id', 'name', 'logo_url', 'is_active']
      }]
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(401).json({ message: 'Account is deactivated. Please contact administrator.' });
    }

    // Check if user is approved (for residents)
    if (user.role === 'resident' && !user.is_approved) {
      return res.status(401).json({ 
        message: 'Your account is pending approval from the barangay administrator.',
        approval_status: user.approval_status
      });
    }

    // Check if barangay is active (for non-super admins)
    if (user.barangay_id && user.barangay && !user.barangay.is_active) {
      return res.status(401).json({ message: 'Your barangay is currently inactive' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Update user's last login and refresh token
    await user.update({ 
      last_login: new Date(),
      refresh_token: refreshToken 
    });

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        barangay_id: user.barangay_id,
        barangay: user.barangay,
        avatar: user.avatar,
        email_verified: user.email_verified,
        is_approved: user.is_approved
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// POST /api/auth/logout - User logout
router.post('/logout', auth, async (req, res) => {
  try {
    await req.user.update({ refresh_token: null });
    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error during logout' });
  }
});

// POST /api/auth/refresh-token - Refresh JWT token
router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token required' });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);

    // Find user and validate refresh token
    const user = await User.findOne({
      where: { id: decoded.id, refresh_token: refreshToken }
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    if (user.status !== 'active') {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    // Update refresh token
    await user.update({ refresh_token: newRefreshToken });

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Refresh token expired', code: 'REFRESH_TOKEN_EXPIRED' });
    }
    console.error('Refresh token error:', error);
    res.status(401).json({ message: 'Invalid refresh token' });
  }
});

// POST /api/auth/forgot-password - Request password reset
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    const user = await User.findOne({ where: { email } });

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({ message: 'If your email is registered, you will receive a password reset link' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    await user.update({
      reset_token: resetToken,
      reset_token_expires: resetExpires
    });

    // Send reset email
    try {
      await emailService.sendPasswordResetEmail(user, resetToken);
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
    }

    res.json({ message: 'If your email is registered, you will receive a password reset link' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/reset-password/:token - Reset password
router.post('/reset-password/:token', [
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      where: {
        reset_token: token,
        reset_token_expires: { [require('sequelize').Op.gt]: new Date() }
      }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update user
    await user.update({
      password: hashedPassword,
      reset_token: null,
      reset_token_expires: null,
      refresh_token: null // Invalidate all sessions
    });

    res.json({ message: 'Password reset successful. Please login with your new password.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/auth/verify-email/:token - Verify email
router.get('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      where: { verification_token: token }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid verification token' });
    }

    await user.update({
      email_verified: true,
      email_verified_at: new Date(),
      verification_token: null
    });

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/auth/me - Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [{
        model: Barangay,
        as: 'barangay',
        attributes: ['id', 'name', 'logo_url', 'captain_name']
      }],
      attributes: { exclude: ['password', 'refresh_token', 'reset_token', 'verification_token'] }
    });

    res.json({ user });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/auth/change-password - Change password
router.put('/change-password', auth, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findByPk(req.user.id);

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await user.update({ password: hashedPassword });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/auth/update-profile - Update user profile
router.put('/update-profile', auth, [
  body('first_name').optional().trim().isLength({ max: 50 }),
  body('last_name').optional().trim().isLength({ max: 50 }),
  body('phone').optional().trim().isLength({ max: 20 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { first_name, last_name, phone, avatar } = req.body;

    await req.user.update({
      first_name,
      last_name,
      phone,
      avatar
    });

    res.json({ 
      message: 'Profile updated successfully',
      user: {
        id: req.user.id,
        email: req.user.email,
        first_name: req.user.first_name,
        last_name: req.user.last_name,
        phone: req.user.phone,
        avatar: req.user.avatar
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
