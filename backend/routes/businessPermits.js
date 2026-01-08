const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { BusinessPermit, Business, Barangay, User } = require('../models');
const { auth } = require('../middleware/auth');
const { barangayFilter, getQueryScope } = require('../middleware/barangayFilter');
const { checkRole, isStaff, isAdmin } = require('../middleware/roleCheck');

// Apply auth and barangay filter to all routes
router.use(auth);
router.use(barangayFilter);

// Validation rules
const permitValidation = [
  body('business_id').isInt().withMessage('Valid business ID is required'),
  body('expiry_date').isDate().withMessage('Valid expiry date is required')
];

// Generate permit number
const generatePermitNumber = async (barangayId) => {
  const year = new Date().getFullYear();
  
  const count = await BusinessPermit.count({
    where: {
      barangay_id: barangayId,
      created_at: {
        [Op.gte]: new Date(year, 0, 1),
        [Op.lt]: new Date(year + 1, 0, 1)
      }
    }
  });

  return `BP-${year}-${String(count + 1).padStart(5, '0')}`;
};

// GET /api/business-permits - Get all business permits (paginated)
router.get('/', isStaff, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search,
      status,
      business_id,
      expiring_soon,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const queryScope = getQueryScope(req.user);

    const whereClause = { ...queryScope.where };

    if (search) {
      whereClause[Op.or] = [
        { permit_number: { [Op.like]: `%${search}%` } },
        { or_number: { [Op.like]: `%${search}%` } }
      ];
    }

    if (status) whereClause.status = status;
    if (business_id) whereClause.business_id = business_id;

    // Filter for permits expiring within 30 days
    if (expiring_soon === 'true') {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      whereClause.expiry_date = {
        [Op.between]: [new Date(), thirtyDaysFromNow]
      };
      whereClause.status = 'active';
    }

    const { count, rows: permits } = await BusinessPermit.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Business,
          as: 'business',
          attributes: ['id', 'business_name', 'owner_name', 'business_type']
        },
        {
          model: User,
          as: 'issuer',
          attributes: ['id', 'first_name', 'last_name']
        },
        {
          model: Barangay,
          as: 'barangay',
          attributes: ['id', 'name']
        }
      ],
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      permits,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get permits error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/business-permits/statistics - Get permit statistics
router.get('/statistics', isStaff, async (req, res) => {
  try {
    const queryScope = getQueryScope(req.user);
    const { sequelize } = require('../models');

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const stats = await BusinessPermit.findAll({
      where: queryScope.where,
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'active' THEN 1 ELSE 0 END")), 'active'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'expired' THEN 1 ELSE 0 END")), 'expired'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'pending' THEN 1 ELSE 0 END")), 'pending'],
        [sequelize.fn('SUM', sequelize.col('amount_paid')), 'total_revenue']
      ],
      raw: true
    });

    // Count expiring soon
    const expiringSoon = await BusinessPermit.count({
      where: {
        ...queryScope.where,
        status: 'active',
        expiry_date: {
          [Op.between]: [new Date(), thirtyDaysFromNow]
        }
      }
    });

    res.json({ 
      statistics: { ...stats[0], expiring_soon: expiringSoon }
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/business-permits/expiring - Get expiring permits
router.get('/expiring', isStaff, async (req, res) => {
  try {
    const queryScope = getQueryScope(req.user);
    const { days = 30 } = req.query;

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + parseInt(days));

    const permits = await BusinessPermit.findAll({
      where: {
        ...queryScope.where,
        status: 'active',
        expiry_date: {
          [Op.between]: [new Date(), futureDate]
        }
      },
      include: [
        {
          model: Business,
          as: 'business',
          attributes: ['id', 'business_name', 'owner_name', 'contact_number', 'email']
        }
      ],
      order: [['expiry_date', 'ASC']]
    });

    res.json({ permits });
  } catch (error) {
    console.error('Get expiring permits error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/business-permits/:id - Get permit details
router.get('/:id', isStaff, async (req, res) => {
  try {
    const queryScope = getQueryScope(req.user);

    const permit = await BusinessPermit.findOne({
      where: { id: req.params.id, ...queryScope.where },
      include: [
        {
          model: Business,
          as: 'business'
        },
        {
          model: User,
          as: 'issuer',
          attributes: ['id', 'first_name', 'last_name', 'role']
        },
        {
          model: Barangay,
          as: 'barangay'
        }
      ]
    });

    if (!permit) {
      return res.status(404).json({ message: 'Permit not found' });
    }

    res.json({ permit });
  } catch (error) {
    console.error('Get permit error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/business-permits - Create new permit (Admin only)
router.post('/', isAdmin, permitValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const barangay_id = req.isSuperAdmin ? req.body.barangay_id : req.barangayId;

    if (!barangay_id) {
      return res.status(400).json({ message: 'Barangay ID is required' });
    }

    // Verify business belongs to same barangay
    const business = await Business.findOne({
      where: { id: req.body.business_id, barangay_id }
    });

    if (!business) {
      return res.status(404).json({ message: 'Business not found in this barangay' });
    }

    // Generate permit number
    const permit_number = await generatePermitNumber(barangay_id);

    const permit = await BusinessPermit.create({
      ...req.body,
      barangay_id,
      permit_number,
      issued_by: req.user.id,
      issued_date: new Date(),
      status: 'active'
    });

    res.status(201).json({ 
      message: 'Business permit created successfully',
      permit 
    });
  } catch (error) {
    console.error('Create permit error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/business-permits/:id - Update permit (Admin only)
router.put('/:id', isAdmin, async (req, res) => {
  try {
    const queryScope = getQueryScope(req.user);

    const permit = await BusinessPermit.findOne({
      where: { id: req.params.id, ...queryScope.where }
    });

    if (!permit) {
      return res.status(404).json({ message: 'Permit not found' });
    }

    const updateData = { ...req.body };
    if (!req.isSuperAdmin) {
      delete updateData.barangay_id;
    }

    await permit.update(updateData);

    res.json({ 
      message: 'Permit updated successfully',
      permit 
    });
  } catch (error) {
    console.error('Update permit error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/business-permits/:id/renew - Renew permit (Admin only)
router.put('/:id/renew', isAdmin, async (req, res) => {
  try {
    const queryScope = getQueryScope(req.user);
    const { expiry_date, amount_paid, or_number } = req.body;

    const permit = await BusinessPermit.findOne({
      where: { id: req.params.id, ...queryScope.where }
    });

    if (!permit) {
      return res.status(404).json({ message: 'Permit not found' });
    }

    // Create new permit for renewal
    const barangay_id = permit.barangay_id;
    const permit_number = await generatePermitNumber(barangay_id);

    const newPermit = await BusinessPermit.create({
      business_id: permit.business_id,
      barangay_id,
      permit_number,
      issued_by: req.user.id,
      issued_date: new Date(),
      expiry_date,
      amount_paid,
      or_number,
      status: 'active',
      previous_permit_id: permit.id
    });

    // Mark old permit as expired
    await permit.update({ status: 'expired' });

    res.json({ 
      message: 'Permit renewed successfully',
      permit: newPermit 
    });
  } catch (error) {
    console.error('Renew permit error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/business-permits/:id - Delete permit (Admin only)
router.delete('/:id', checkRole('admin', 'super_admin'), async (req, res) => {
  try {
    const queryScope = getQueryScope(req.user);

    const permit = await BusinessPermit.findOne({
      where: { id: req.params.id, ...queryScope.where }
    });

    if (!permit) {
      return res.status(404).json({ message: 'Permit not found' });
    }

    // Only allow deleting pending permits
    if (permit.status !== 'pending') {
      return res.status(400).json({ message: 'Cannot delete active or expired permits' });
    }

    await permit.destroy();

    res.json({ message: 'Permit deleted successfully' });
  } catch (error) {
    console.error('Delete permit error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
