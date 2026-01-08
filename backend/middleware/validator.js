const { body, param, query, validationResult } = require('express-validator');

// Handle validation errors
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation failed',
      errors: errors.array() 
    });
  }
  next();
};

// Auth validators
const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('first_name')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('First name must be at most 50 characters'),
  body('last_name')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Last name must be at most 50 characters'),
  validate
];

const loginValidation = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username or email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  validate
];

// Resident validators
const residentValidation = [
  body('first_name')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ max: 50 })
    .withMessage('First name must be at most 50 characters'),
  body('last_name')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ max: 50 })
    .withMessage('Last name must be at most 50 characters'),
  body('date_of_birth')
    .notEmpty()
    .withMessage('Date of birth is required')
    .isISO8601()
    .withMessage('Invalid date format'),
  body('gender')
    .notEmpty()
    .withMessage('Gender is required')
    .isIn(['male', 'female', 'other'])
    .withMessage('Invalid gender value'),
  body('civil_status')
    .optional()
    .isIn(['single', 'married', 'widowed', 'separated', 'divorced'])
    .withMessage('Invalid civil status'),
  body('address')
    .trim()
    .notEmpty()
    .withMessage('Address is required'),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email format'),
  body('contact_number')
    .optional()
    .trim()
    .matches(/^[0-9+\-\s()]+$/)
    .withMessage('Invalid contact number format'),
  validate
];

// Document validators
const documentValidation = [
  body('resident_id')
    .notEmpty()
    .withMessage('Resident ID is required')
    .isInt()
    .withMessage('Resident ID must be a number'),
  body('document_type')
    .notEmpty()
    .withMessage('Document type is required')
    .isIn([
      'barangay_clearance',
      'certificate_of_residency',
      'certificate_of_indigency',
      'business_permit',
      'good_moral_character',
      'certificate_of_no_income',
      'certificate_of_late_registration',
      'barangay_id',
      'other'
    ])
    .withMessage('Invalid document type'),
  body('purpose')
    .trim()
    .notEmpty()
    .withMessage('Purpose is required'),
  validate
];

// Incident validators
const incidentValidation = [
  body('incident_type')
    .notEmpty()
    .withMessage('Incident type is required')
    .isIn([
      'dispute',
      'theft',
      'assault',
      'vandalism',
      'noise_complaint',
      'domestic_violence',
      'trespassing',
      'harassment',
      'traffic_incident',
      'property_damage',
      'other'
    ])
    .withMessage('Invalid incident type'),
  body('incident_date')
    .notEmpty()
    .withMessage('Incident date is required')
    .isISO8601()
    .withMessage('Invalid date format'),
  body('location')
    .trim()
    .notEmpty()
    .withMessage('Location is required'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required'),
  validate
];

// Business validators
const businessValidation = [
  body('business_name')
    .trim()
    .notEmpty()
    .withMessage('Business name is required'),
  body('owner_name')
    .trim()
    .notEmpty()
    .withMessage('Owner name is required'),
  body('business_type')
    .trim()
    .notEmpty()
    .withMessage('Business type is required'),
  body('address')
    .trim()
    .notEmpty()
    .withMessage('Address is required'),
  validate
];

// Pagination validators
const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  validate
];

// ID parameter validator
const idParamValidation = [
  param('id')
    .isInt()
    .withMessage('ID must be a valid integer'),
  validate
];

module.exports = {
  validate,
  registerValidation,
  loginValidation,
  residentValidation,
  documentValidation,
  incidentValidation,
  businessValidation,
  paginationValidation,
  idParamValidation
};
