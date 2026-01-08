const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { Business, BusinessPermit, Resident, Barangay } = require('../models');
const { auth } = require('../middleware/auth');
const { barangayFilter, getQueryScope } = require('../middleware/barangayFilter');
const { checkRole, isStaff } = require('../middleware/roleCheck');

// Apply auth and barangay filter to all routes
router.use(auth);
router.use(barangayFilter);

// Validation rules
const businessValidation = [
  body('business_name').trim().notEmpty().withMessage('Business name is required'),
  body('owner_name').trim().notEmpty().withMessage('Owner name is required'),
  body('business_type').trim().notEmpty().withMessage('Business type is required'),
  body('address').trim().notEmpty().withMessage('Address is required')
];

// GET /api/businesses - Get all businesses (paginated)
router.get('/', isStaff, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search,
      business_type,
      business_nature,
      status,
      zone_purok,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const queryScope = getQueryScope(req.user);

    const whereClause = { ...queryScope.where };

    if (search) {
      whereClause[Op.or] = [
        { business_name: { [Op.like]: `%${search}%` } },
        { trade_name: { [Op.like]: `%${search}%` } },
        { owner_name: { [Op.like]: `%${search}%` } },
        { dti_registration: { [Op.like]: `%${search}%` } }
      ];
    }

    if (business_type) whereClause.business_type = business_type;
    if (business_nature) whereClause.business_nature = business_nature;
    if (status) whereClause.status = status;
    if (zone_purok) whereClause.zone_purok = zone_purok;

    const { count, rows: businesses } = await Business.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Resident,
          as: 'owner',
          attributes: ['id', 'first_name', 'middle_name', 'last_name', 'photo_url']
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
      businesses,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get businesses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/businesses/statistics - Get business statistics
router.get('/statistics', isStaff, async (req, res) => {
  try {
    const queryScope = getQueryScope(req.user);
    const { sequelize } = require('../models');

    const stats = await Business.findAll({
      where: queryScope.where,
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'active' THEN 1 ELSE 0 END")), 'active'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'inactive' THEN 1 ELSE 0 END")), 'inactive'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'closed' THEN 1 ELSE 0 END")), 'closed'],
        [sequelize.fn('SUM', sequelize.col('employees_count')), 'total_employees']
      ],
      raw: true
    });

    // Get by business nature
    const byNature = await Business.findAll({
      where: queryScope.where,
      attributes: [
        'business_nature',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['business_nature'],
      raw: true
    });

    res.json({ 
      statistics: stats[0] || {},
      byNature
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/businesses/:id - Get business details
router.get('/:id', isStaff, async (req, res) => {
  try {
    const queryScope = getQueryScope(req.user);

    const business = await Business.findOne({
      where: { id: req.params.id, ...queryScope.where },
      include: [
        {
          model: Resident,
          as: 'owner'
        },
        {
          model: Barangay,
          as: 'barangay'
        },
        {
          model: BusinessPermit,
          as: 'permits',
          limit: 10,
          order: [['created_at', 'DESC']]
        }
      ]
    });

    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    res.json({ business });
  } catch (error) {
    console.error('Get business error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/businesses - Create new business
router.post('/', isStaff, businessValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const barangay_id = req.isSuperAdmin ? req.body.barangay_id : req.barangayId;

    if (!barangay_id) {
      return res.status(400).json({ message: 'Barangay ID is required' });
    }

    const business = await Business.create({
      ...req.body,
      barangay_id
    });

    res.status(201).json({ 
      message: 'Business created successfully',
      business 
    });
  } catch (error) {
    console.error('Create business error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/businesses/:id - Update business
router.put('/:id', isStaff, async (req, res) => {
  try {
    const queryScope = getQueryScope(req.user);

    const business = await Business.findOne({
      where: { id: req.params.id, ...queryScope.where }
    });

    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    const updateData = { ...req.body };
    if (!req.isSuperAdmin) {
      delete updateData.barangay_id;
    }

    await business.update(updateData);

    res.json({ 
      message: 'Business updated successfully',
      business 
    });
  } catch (error) {
    console.error('Update business error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/businesses/:id - Delete business (Admin only)
router.delete('/:id', checkRole('admin', 'super_admin'), async (req, res) => {
  try {
    const queryScope = getQueryScope(req.user);

    const business = await Business.findOne({
      where: { id: req.params.id, ...queryScope.where }
    });

    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    // Soft delete
    await business.update({ status: 'closed' });

    res.json({ message: 'Business deleted successfully' });
  } catch (error) {
    console.error('Delete business error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/businesses/:id/permits - Get business permits
router.get('/:id/permits', isStaff, async (req, res) => {
  try {
    const queryScope = getQueryScope(req.user);

    const business = await Business.findOne({
      where: { id: req.params.id, ...queryScope.where }
    });

    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    const permits = await BusinessPermit.findAll({
      where: { business_id: req.params.id },
      order: [['created_at', 'DESC']]
    });

    res.json({ permits });
  } catch (error) {
    console.error('Get business permits error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
