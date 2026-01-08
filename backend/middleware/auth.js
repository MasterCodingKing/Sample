const jwt = require('jsonwebtoken');
const { User, Barangay } = require('../models');

// Verify JWT token
const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided, authorization denied' });
    }

    const token = authHeader.replace('Bearer ', '');
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findByPk(decoded.id, {
      include: [{
        model: Barangay,
        as: 'barangay',
        attributes: ['id', 'name', 'is_active']
      }],
      attributes: { exclude: ['password', 'refresh_token'] }
    });

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (user.status !== 'active') {
      return res.status(401).json({ message: 'User account is deactivated' });
    }

    // Check if barangay is active (for non-super admins)
    if (user.barangay_id && user.barangay && !user.barangay.is_active) {
      return res.status(401).json({ message: 'Barangay is currently inactive' });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Server error during authentication' });
  }
};

// Optional auth - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findByPk(decoded.id, {
      include: [{
        model: Barangay,
        as: 'barangay',
        attributes: ['id', 'name']
      }],
      attributes: { exclude: ['password', 'refresh_token'] }
    });

    if (user && user.status === 'active') {
      req.user = user;
      req.token = token;
    }
    
    next();
  } catch (error) {
    // Continue without auth on error
    next();
  }
};

module.exports = { auth, optionalAuth };
