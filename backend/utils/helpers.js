const { format, parseISO, differenceInYears, addDays, addMonths, isValid } = require('date-fns');

// Format date for display
const formatDate = (date, formatString = 'MMMM dd, yyyy') => {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return isValid(dateObj) ? format(dateObj, formatString) : '';
};

// Calculate age from birthdate
const calculateAge = (birthdate) => {
  if (!birthdate) return null;
  const dateObj = typeof birthdate === 'string' ? parseISO(birthdate) : birthdate;
  if (!isValid(dateObj)) return null;
  return differenceInYears(new Date(), dateObj);
};

// Format full name
const formatFullName = (resident, format = 'full') => {
  if (!resident) return '';
  
  const { first_name, middle_name, last_name, suffix } = resident;
  
  switch (format) {
    case 'full':
      return `${first_name}${middle_name ? ' ' + middle_name : ''} ${last_name}${suffix ? ' ' + suffix : ''}`.trim();
    case 'formal':
      return `${last_name}, ${first_name}${middle_name ? ' ' + middle_name.charAt(0) + '.' : ''}${suffix ? ' ' + suffix : ''}`.trim();
    case 'short':
      return `${first_name} ${last_name}`;
    default:
      return `${first_name} ${last_name}`;
  }
};

// Generate slug from string
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

// Capitalize first letter
const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Capitalize words
const capitalizeWords = (str) => {
  if (!str) return '';
  return str.split(' ').map(word => capitalize(word)).join(' ');
};

// Format phone number
const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  // Remove non-digits
  const cleaned = phone.replace(/\D/g, '');
  // Format as (XXX) XXX-XXXX or 09XX-XXX-XXXX
  if (cleaned.length === 11 && cleaned.startsWith('09')) {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
};

// Format currency
const formatCurrency = (amount, currency = 'PHP') => {
  if (amount === null || amount === undefined) return '';
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

// Parse boolean
const parseBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return ['true', '1', 'yes'].includes(value.toLowerCase());
  }
  return Boolean(value);
};

// Generate random string
const generateRandomString = (length = 10) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Paginate results
const paginate = (array, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  return {
    data: array.slice(offset, offset + limit),
    pagination: {
      total: array.length,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(array.length / limit)
    }
  };
};

// Deep clone object
const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

// Remove undefined/null properties
const cleanObject = (obj) => {
  const cleaned = {};
  Object.keys(obj).forEach(key => {
    if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') {
      cleaned[key] = obj[key];
    }
  });
  return cleaned;
};

// Check if object is empty
const isEmpty = (obj) => {
  if (!obj) return true;
  if (Array.isArray(obj)) return obj.length === 0;
  if (typeof obj === 'object') return Object.keys(obj).length === 0;
  return false;
};

// Delay/sleep function
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Get document validity date
const getDocumentValidityDate = (issuedDate, validityMonths = 6) => {
  const date = typeof issuedDate === 'string' ? parseISO(issuedDate) : issuedDate;
  return addMonths(date, validityMonths);
};

// Check if document is expired
const isDocumentExpired = (validUntil) => {
  if (!validUntil) return false;
  const date = typeof validUntil === 'string' ? parseISO(validUntil) : validUntil;
  return date < new Date();
};

// Sanitize filename
const sanitizeFilename = (filename) => {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/__+/g, '_')
    .toLowerCase();
};

// Get file extension
const getFileExtension = (filename) => {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2);
};

module.exports = {
  formatDate,
  calculateAge,
  formatFullName,
  slugify,
  capitalize,
  capitalizeWords,
  formatPhoneNumber,
  formatCurrency,
  parseBoolean,
  generateRandomString,
  paginate,
  deepClone,
  cleanObject,
  isEmpty,
  sleep,
  getDocumentValidityDate,
  isDocumentExpired,
  sanitizeFilename,
  getFileExtension
};
