const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { User, Barangay, Resident } = require('../models');
const { auth } = require('../middleware/auth');
const { barangayFilter, getQueryScope } = require('../middleware/barangayFilter');
const { checkRole, isAdmin, isSuperAdmin } = require('../middleware/roleCheck');

// Apply auth and barangay filter to all routes
router.use(auth);
router.use(barangayFilter);

// Validation rules
const userValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Invalid email address'),
  body('role').isIn(['admin', 'captain', 'secretary', 'treasurer', 'staff', 'resident']).withMessage('Invalid role')
];

// GET /api/users - Get all users (paginated)
router.get('/', isAdmin, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search,
      role,
      status,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const queryScope = getQueryScope(req.user);

    const whereClause = { ...queryScope.where };

    if (search) {
      whereClause[Op.or] = [
        { email: { [Op.like]: `%${search}%` } },
        { first_name: { [Op.like]: `%${search}%` } },
        { last_name: { [Op.like]: `%${search}%` } }
      ];
    }

    if (role) whereClause.role = role;
    if (status) whereClause.status = status;

    // Regular admins cannot see super_admin users
    if (req.user.role !== 'super_admin') {
      whereClause.role = { [Op.ne]: 'super_admin' };
    }

    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Barangay,
          as: 'barangay',
          attributes: ['id', 'name']
        }
      ],
      attributes: { exclude: ['password', 'refresh_token', 'reset_token', 'verification_token'] },
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      users,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/users/:id - Get user details
router.get('/:id', isAdmin, async (req, res) => {
  try {
    const queryScope = getQueryScope(req.user);

    const whereClause = { id: req.params.id };
    
    // Add barangay scope for non-super admins
    if (req.user.role !== 'super_admin') {
      whereClause.barangay_id = req.user.barangay_id;
      whereClause.role = { [Op.ne]: 'super_admin' };
    }

    const user = await User.findOne({
      where: whereClause,
      include: [
        {
          model: Barangay,
          as: 'barangay'
        }
      ],
      attributes: { exclude: ['password', 'refresh_token', 'reset_token', 'verification_token'] }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/users - Create new user (Admin only)
router.post('/', isAdmin, userValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, role, first_name, last_name, phone } = req.body;
    
    // Determine barangay_id
    let barangay_id = req.isSuperAdmin ? req.body.barangay_id : req.barangayId;

    // Only super admin can create super_admin or admin without barangay
    if (role === 'super_admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ message: 'Cannot create super admin users' });
    }

    // Check if user exists
    const existingUser = await User.findOne({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password || 'changeme123', salt);

    const user = await User.create({
      email,
      password: hashedPassword,
      role,
      first_name,
      last_name,
      phone,
      barangay_id,
      status: 'active',
      email_verified: true // Admin-created users are auto-verified
    });

    res.status(201).json({ 
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        barangay_id: user.barangay_id
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/users/:id - Update user (Admin only)
router.put('/:id', isAdmin, async (req, res) => {
  try {
    const queryScope = getQueryScope(req.user);

    const whereClause = { id: req.params.id };
    
    // Add barangay scope for non-super admins
    if (req.user.role !== 'super_admin') {
      whereClause.barangay_id = req.user.barangay_id;
      whereClause.role = { [Op.ne]: 'super_admin' };
    }

    const user = await User.findOne({ where: whereClause });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent changing own role
    if (req.params.id === String(req.user.id) && req.body.role && req.body.role !== req.user.role) {
      return res.status(400).json({ message: 'Cannot change your own role' });
    }

    // Only super admin can set super_admin role
    if (req.body.role === 'super_admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ message: 'Cannot assign super admin role' });
    }

    const updateData = { ...req.body };
    delete updateData.password;
    
    if (!req.isSuperAdmin) {
      delete updateData.barangay_id;
    }

    await user.update(updateData);

    res.json({ 
      message: 'User updated successfully',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/users/:id/reset-password - Reset user password (Admin only)
router.put('/:id/reset-password', isAdmin, async (req, res) => {
  try {
    const queryScope = getQueryScope(req.user);
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const whereClause = { id: req.params.id };
    
    if (req.user.role !== 'super_admin') {
      whereClause.barangay_id = req.user.barangay_id;
      whereClause.role = { [Op.ne]: 'super_admin' };
    }

    const user = await User.findOne({ where: whereClause });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await user.update({ 
      password: hashedPassword,
      refresh_token: null // Invalidate all sessions
    });

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/users/:id/toggle-status - Toggle user active status
router.put('/:id/toggle-status', isAdmin, async (req, res) => {
  try {
    const whereClause = { id: req.params.id };
    
    if (req.user.role !== 'super_admin') {
      whereClause.barangay_id = req.user.barangay_id;
      whereClause.role = { [Op.ne]: 'super_admin' };
    }

    const user = await User.findOne({ where: whereClause });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deactivating self
    if (req.params.id === String(req.user.id)) {
      return res.status(400).json({ message: 'Cannot deactivate your own account' });
    }

    await user.update({ 
      status: user.status === 'active' ? 'inactive' : 'active',
      refresh_token: null // Invalidate sessions if deactivating
    });

    res.json({ 
      message: `User ${user.status === 'active' ? 'activated' : 'deactivated'} successfully`,
      user: {
        id: user.id,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Toggle status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/users/:id - Delete user (Super Admin only)
router.delete('/:id', isSuperAdmin, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deleting self
    if (req.params.id === String(req.user.id)) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    await user.destroy();

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/users/pending-approval - Get pending approval users (Admin only)
router.get('/pending-approval/list', isAdmin, async (req, res) => {
  try {
    const queryScope = getQueryScope(req.user);

    const users = await User.findAll({
      where: {
        ...queryScope.where,
        approval_status: 'pending',
        is_approved: false,
        role: 'resident'
      },
      include: [
        {
          model: Barangay,
          as: 'barangay',
          attributes: ['id', 'name']
        }
      ],
      attributes: { exclude: ['password', 'refresh_token', 'reset_token', 'verification_token'] },
      order: [['created_at', 'ASC']]
    });

    res.json({ users, count: users.length });
  } catch (error) {
    console.error('Get pending users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/users/:id/approve - Approve user registration (Admin only)
router.put('/:id/approve', isAdmin, async (req, res) => {
  try {
    const queryScope = getQueryScope(req.user);

    const whereClause = { id: req.params.id };
    
    // Add barangay scope for non-super admins
    if (req.user.role !== 'super_admin') {
      whereClause.barangay_id = req.user.barangay_id;
    }

    const user = await User.findOne({ where: whereClause });

    if (!user) {
      return res.status(404).json({ message: 'User not found or access denied' });
    }

    if (user.approval_status !== 'pending') {
      return res.status(400).json({ message: 'User is not pending approval' });
    }

    await user.update({
      approval_status: 'approved',
      is_approved: true,
      status: 'active'
    });

    res.json({ 
      message: 'User approved successfully',
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        approval_status: user.approval_status,
        is_approved: user.is_approved
      }
    });
  } catch (error) {
    console.error('Approve user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/users/:id/reject - Reject user registration (Admin only)
router.put('/:id/reject', isAdmin, async (req, res) => {
  try {
    const { reason } = req.body;
    const queryScope = getQueryScope(req.user);

    const whereClause = { id: req.params.id };
    
    // Add barangay scope for non-super admins
    if (req.user.role !== 'super_admin') {
      whereClause.barangay_id = req.user.barangay_id;
    }

    const user = await User.findOne({ where: whereClause });

    if (!user) {
      return res.status(404).json({ message: 'User not found or access denied' });
    }

    if (user.approval_status !== 'pending') {
      return res.status(400).json({ message: 'User is not pending approval' });
    }

    await user.update({
      approval_status: 'rejected',
      is_approved: false,
      status: 'inactive'
    });

    res.json({ 
      message: 'User registration rejected',
      user: {
        id: user.id,
        email: user.email,
        approval_status: user.approval_status
      }
    });
  } catch (error) {
    console.error('Reject user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
