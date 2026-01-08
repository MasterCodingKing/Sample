// Multi-tenant barangay filter middleware
// Ensures data isolation between barangays

const barangayFilter = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  // Super admin can see all data - no filter applied
  if (req.user.role === 'super_admin' && !req.user.barangay_id) {
    req.barangayScope = {};
    req.isSuperAdmin = true;
    return next();
  }

  // All other users are scoped to their barangay
  if (!req.user.barangay_id) {
    return res.status(403).json({ 
      message: 'No barangay assigned to this user' 
    });
  }

  // Apply barangay filter for all queries
  req.barangayScope = {
    where: {
      barangay_id: req.user.barangay_id
    }
  };
  req.barangayId = req.user.barangay_id;
  req.isSuperAdmin = false;

  next();
};

// Get query scope based on user role
const getQueryScope = (user, additionalWhere = {}) => {
  // Super admin sees all data
  if (user.role === 'super_admin' && !user.barangay_id) {
    return { where: additionalWhere };
  }

  // Other users see only their barangay data
  return {
    where: {
      barangay_id: user.barangay_id,
      ...additionalWhere
    }
  };
};

// Check if user can access specific barangay data
const canAccessBarangay = (user, barangayId) => {
  // Super admin can access any barangay
  if (user.role === 'super_admin' && !user.barangay_id) {
    return true;
  }

  // Other users can only access their own barangay
  return user.barangay_id === barangayId;
};

// Middleware to validate barangay access for specific resource
const validateBarangayAccess = (resourceBarangayIdField = 'barangay_id') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Super admin bypasses check
    if (req.user.role === 'super_admin' && !req.user.barangay_id) {
      return next();
    }

    // Check if resource belongs to user's barangay
    const resourceBarangayId = req.body[resourceBarangayIdField] || 
                                req.params.barangayId || 
                                req.query.barangay_id;

    if (resourceBarangayId && parseInt(resourceBarangayId) !== req.user.barangay_id) {
      return res.status(403).json({ 
        message: 'Access denied. Cannot access data from another barangay.' 
      });
    }

    next();
  };
};

// Force barangay_id in request body to match user's barangay
const enforceBarangayId = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  // Super admin can specify any barangay_id
  if (req.user.role === 'super_admin' && !req.user.barangay_id) {
    // Require barangay_id in body for super admin
    if (!req.body.barangay_id) {
      return res.status(400).json({ 
        message: 'barangay_id is required for Super Admin operations' 
      });
    }
    return next();
  }

  // Force barangay_id to user's barangay for all other users
  req.body.barangay_id = req.user.barangay_id;
  next();
};

module.exports = {
  barangayFilter,
  getQueryScope,
  canAccessBarangay,
  validateBarangayAccess,
  enforceBarangayId
};
