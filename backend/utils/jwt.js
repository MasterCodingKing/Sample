const jwt = require('jsonwebtoken');

// Generate access token
const generateAccessToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      role: user.role, 
      barangay_id: user.barangay_id 
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// Generate refresh token
const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' }
  );
};

// Verify access token
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Verify refresh token
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Decode token without verification
const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
};

// Generate password reset token
const generateResetToken = () => {
  return require('crypto').randomBytes(32).toString('hex');
};

// Generate email verification token
const generateVerificationToken = () => {
  return require('crypto').randomBytes(32).toString('hex');
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
  generateResetToken,
  generateVerificationToken
};
