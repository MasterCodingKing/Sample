const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { Barangay, User, Resident, Household, Business } = require('../models');
const { auth } = require('../middleware/auth');
const { checkRole, isSuperAdmin } = require('../middleware/roleCheck');
const { upload } = require('../middleware/upload');

// GET /api/barangays - Get all barangays (public)
router.get('/', async (req, res) => {
  try {
    const { is_active } = req.query;

    const whereClause = {};
    if (is_active !== undefined) {
      whereClause.is_active = is_active === 'true';
    }

    const barangays = await Barangay.findAll({
      where: whereClause,
      attributes: ['id', 'name', 'address', 'municipality', 'province', 'contact_number', 'email', 'logo_url', 'captain_name', 'is_active'],
      order: [['name', 'ASC']]
    });

    res.json({ barangays });
  } catch (error) {
    console.error('Get barangays error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/barangays/:id - Get barangay details
router.get('/:id', async (req, res) => {
  try {
    const barangay = await Barangay.findByPk(req.params.id);

    if (!barangay) {
      return res.status(404).json({ message: 'Barangay not found' });
    }

    res.json({ barangay });
  } catch (error) {
    console.error('Get barangay error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/barangays/:id/statistics - Get barangay statistics
router.get('/:id/statistics', auth, async (req, res) => {
  try {
    const barangayId = req.params.id;

    // Check access - only same barangay or super admin
    if (req.user.role !== 'super_admin' && req.user.barangay_id !== parseInt(barangayId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const barangay = await Barangay.findByPk(barangayId);

    if (!barangay) {
      return res.status(404).json({ message: 'Barangay not found' });
    }

    // Get counts
    const [residents, households, businesses, users] = await Promise.all([
      Resident.count({ where: { barangay_id: barangayId, status: 'active' } }),
      Household.count({ where: { barangay_id: barangayId, status: 'active' } }),
      Business.count({ where: { barangay_id: barangayId, status: 'active' } }),
      User.count({ where: { barangay_id: barangayId, status: 'active' } })
    ]);

    res.json({
      barangay,
      statistics: {
        residents,
        households,
        businesses,
        users
      }
    });
  } catch (error) {
    console.error('Get barangay statistics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Apply auth for remaining routes
router.use(auth);

// POST /api/barangays - Create barangay (Super Admin only)
router.post('/', isSuperAdmin, [
  body('name').trim().notEmpty().withMessage('Barangay name is required'),
  body('email').optional().isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check for duplicate name
    const existing = await Barangay.findOne({
      where: { name: req.body.name }
    });

    if (existing) {
      return res.status(400).json({ message: 'Barangay name already exists' });
    }

    // Create barangay
    const barangay = await Barangay.create(req.body);

    // Create default admin user for the barangay
    const bcrypt = require('bcryptjs');
    const adminEmail = req.body.admin_email || `admin@${barangay.name.toLowerCase().replace(/\s+/g, '')}.local`;
    const defaultPassword = req.body.admin_password || `${barangay.name.replace(/\s+/g, '')}Admin123`;
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(defaultPassword, salt);

    // Create admin user
    const adminUser = await User.create({
      email: adminEmail,
      password: hashedPassword,
      first_name: req.body.admin_first_name || 'Admin',
      last_name: req.body.admin_last_name || barangay.name,
      barangay_id: barangay.id,
      role: 'admin',
      status: 'active',
      approval_status: 'approved',
      is_approved: true,
      email_verified: true
    });

    res.status(201).json({ 
      message: 'Barangay created successfully with default admin user',
      barangay,
      admin: {
        id: adminUser.id,
        email: adminUser.email,
        default_password: defaultPassword,
        message: 'Please change the default password after first login'
      }
    });
  } catch (error) {
    console.error('Create barangay error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUT /api/barangays/:id - Update barangay
router.put('/:id', checkRole('admin', 'super_admin'), async (req, res) => {
  try {
    const barangay = await Barangay.findByPk(req.params.id);

    if (!barangay) {
      return res.status(404).json({ message: 'Barangay not found' });
    }

    // Non-super admins can only update their own barangay
    if (req.user.role !== 'super_admin' && req.user.barangay_id !== barangay.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await barangay.update(req.body);

    res.json({ 
      message: 'Barangay updated successfully',
      barangay 
    });
  } catch (error) {
    console.error('Update barangay error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/barangays/:id/upload-logo - Upload barangay logo
router.post('/:id/upload-logo', checkRole('admin', 'super_admin'), upload.single('logo'), async (req, res) => {
  try {
    const barangay = await Barangay.findByPk(req.params.id);

    if (!barangay) {
      return res.status(404).json({ message: 'Barangay not found' });
    }

    // Non-super admins can only update their own barangay
    if (req.user.role !== 'super_admin' && req.user.barangay_id !== barangay.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const logo_url = `/uploads/${req.file.filename}`;
    await barangay.update({ logo_url });

    res.json({ 
      message: 'Logo uploaded successfully',
      logo_url 
    });
  } catch (error) {
    console.error('Upload logo error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/barangays/:id/toggle-status - Toggle barangay active status (Super Admin only)
router.put('/:id/toggle-status', isSuperAdmin, async (req, res) => {
  try {
    const barangay = await Barangay.findByPk(req.params.id);

    if (!barangay) {
      return res.status(404).json({ message: 'Barangay not found' });
    }

    await barangay.update({ is_active: !barangay.is_active });

    res.json({ 
      message: `Barangay ${barangay.is_active ? 'activated' : 'deactivated'} successfully`,
      barangay 
    });
  } catch (error) {
    console.error('Toggle status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/barangays/:id - Delete barangay (Super Admin only)
router.delete('/:id', isSuperAdmin, async (req, res) => {
  try {
    const barangay = await Barangay.findByPk(req.params.id);

    if (!barangay) {
      return res.status(404).json({ message: 'Barangay not found' });
    }

    // Check if barangay has associated data
    const [residents, users] = await Promise.all([
      Resident.count({ where: { barangay_id: req.params.id } }),
      User.count({ where: { barangay_id: req.params.id } })
    ]);

    if (residents > 0 || users > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete barangay with existing data. Deactivate instead.' 
      });
    }

    await barangay.destroy();

    res.json({ message: 'Barangay deleted successfully' });
  } catch (error) {
    console.error('Delete barangay error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
