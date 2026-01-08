// Role hierarchy (higher index = more permissions)
const roleHierarchy = {
  'resident': 0,
  'staff': 1,
  'treasurer': 2,
  'secretary': 3,
  'captain': 4,
  'admin': 5,
  'super_admin': 6
};

// Check if user has one of the allowed roles
const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const userRole = req.user.role;

    // Super admin has access to everything
    if (userRole === 'super_admin') {
      return next();
    }

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        message: 'Access denied. Insufficient permissions.',
        required: allowedRoles,
        current: userRole
      });
    }

    next();
  };
};

// Check if user has minimum role level
const minRole = (minimumRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const userRole = req.user.role;
    const userLevel = roleHierarchy[userRole] || 0;
    const requiredLevel = roleHierarchy[minimumRole] || 0;

    if (userLevel < requiredLevel) {
      return res.status(403).json({ 
        message: 'Access denied. Insufficient permissions.',
        required: minimumRole,
        current: userRole
      });
    }

    next();
  };
};

// Check if user is Super Admin
const isSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ message: 'Super Admin access required' });
  }

  next();
};

// Check if user is Admin or higher
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (!['admin', 'super_admin'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Admin access required' });
  }

  next();
};

// Check if user is Staff or higher (not resident)
const isStaff = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (req.user.role === 'resident') {
    return res.status(403).json({ message: 'Staff access required' });
  }

  next();
};

// Staff permission checker for specific actions
const staffPermissions = {
  residents: ['view', 'create', 'edit'],
  households: ['view', 'create', 'edit'],
  documentRequests: ['view', 'create', 'updateStatus'],
  certificates: ['view', 'issue'],
  businesses: ['view', 'create', 'edit'],
  businessPermits: ['view'],
  incidents: ['view', 'create', 'edit'],
  officials: ['view'],
  announcements: ['view'],
  events: ['view'],
  reports: ['viewBasic'],
  users: [],
  settings: []
};

const checkStaffPermission = (module, action) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const userRole = req.user.role;

    // Higher roles have full access
    if (['admin', 'super_admin', 'captain', 'secretary', 'treasurer'].includes(userRole)) {
      return next();
    }

    // Check staff permissions
    if (userRole === 'staff') {
      const allowedActions = staffPermissions[module] || [];
      if (!allowedActions.includes(action)) {
        return res.status(403).json({ 
          message: `Staff not authorized for ${action} on ${module}` 
        });
      }
    }

    // Residents have very limited access
    if (userRole === 'resident') {
      const residentModules = ['announcements', 'events', 'documentRequests'];
      const residentActions = ['view', 'create'];
      
      if (!residentModules.includes(module) || !residentActions.includes(action)) {
        return res.status(403).json({ message: 'Resident access denied' });
      }
    }

    next();
  };
};

module.exports = {
  checkRole,
  minRole,
  isSuperAdmin,
  isAdmin,
  isStaff,
  checkStaffPermission,
  roleHierarchy
};
