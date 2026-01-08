const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { Household, Resident, Barangay } = require('../models');
const { auth } = require('../middleware/auth');
const { barangayFilter, getQueryScope } = require('../middleware/barangayFilter');
const { checkRole, isStaff } = require('../middleware/roleCheck');

// Apply auth and barangay filter to all routes
router.use(auth);
router.use(barangayFilter);

// Validation rules
const householdValidation = [
  body('household_number').trim().notEmpty().withMessage('Household number is required'),
  body('address').trim().notEmpty().withMessage('Address is required')
];

// GET /api/households - Get all households (paginated)
router.get('/', isStaff, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search,
      zone_purok,
      economic_status,
      housing_type,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const queryScope = getQueryScope(req.user);

    const whereClause = { ...queryScope.where };

    if (search) {
      whereClause[Op.or] = [
        { household_number: { [Op.like]: `%${search}%` } },
        { address: { [Op.like]: `%${search}%` } }
      ];
    }

    if (zone_purok) whereClause.zone_purok = zone_purok;
    if (economic_status) whereClause.economic_status = economic_status;
    if (housing_type) whereClause.housing_type = housing_type;

    const { count, rows: households } = await Household.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Resident,
          as: 'head',
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
      households,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get households error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/households/statistics - Get household statistics
router.get('/statistics', isStaff, async (req, res) => {
  try {
    const queryScope = getQueryScope(req.user);
    const { sequelize } = require('../models');

    const stats = await Household.findAll({
      where: queryScope.where,
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN economic_status = 'below_poverty' THEN 1 ELSE 0 END")), 'below_poverty'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN economic_status = 'indigent' THEN 1 ELSE 0 END")), 'indigent'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN housing_type = 'rented' THEN 1 ELSE 0 END")), 'renters'],
        [sequelize.fn('AVG', sequelize.col('total_members')), 'avg_members']
      ],
      raw: true
    });

    res.json({ statistics: stats[0] || {} });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/households/:id - Get household details
router.get('/:id', isStaff, async (req, res) => {
  try {
    const queryScope = getQueryScope(req.user);

    const household = await Household.findOne({
      where: { id: req.params.id, ...queryScope.where },
      include: [
        {
          model: Resident,
          as: 'head',
          attributes: ['id', 'first_name', 'middle_name', 'last_name', 'photo_url', 'contact_number']
        },
        {
          model: Barangay,
          as: 'barangay',
          attributes: ['id', 'name']
        }
      ]
    });

    if (!household) {
      return res.status(404).json({ message: 'Household not found' });
    }

    res.json({ household });
  } catch (error) {
    console.error('Get household error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/households/:id/members - Get household members
router.get('/:id/members', isStaff, async (req, res) => {
  try {
    const queryScope = getQueryScope(req.user);

    const household = await Household.findOne({
      where: { id: req.params.id, ...queryScope.where }
    });

    if (!household) {
      return res.status(404).json({ message: 'Household not found' });
    }

    const members = await Resident.findAll({
      where: { household_id: req.params.id },
      include: [{
        model: Barangay,
        as: 'barangay',
        attributes: ['id', 'name']
      }],
      order: [['created_at', 'ASC']]
    });

    res.json({ members });
  } catch (error) {
    console.error('Get household members error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/households - Create household
router.post('/', isStaff, householdValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const barangay_id = req.isSuperAdmin ? req.body.barangay_id : req.barangayId;

    if (!barangay_id) {
      return res.status(400).json({ message: 'Barangay ID is required' });
    }

    // Check for duplicate household number in the same barangay
    const existing = await Household.findOne({
      where: { 
        household_number: req.body.household_number,
        barangay_id 
      }
    });

    if (existing) {
      return res.status(400).json({ message: 'Household number already exists in this barangay' });
    }

    const household = await Household.create({
      ...req.body,
      barangay_id
    });

    res.status(201).json({ 
      message: 'Household created successfully',
      household 
    });
  } catch (error) {
    console.error('Create household error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/households/:id - Update household
router.put('/:id', isStaff, async (req, res) => {
  try {
    const queryScope = getQueryScope(req.user);

    const household = await Household.findOne({
      where: { id: req.params.id, ...queryScope.where }
    });

    if (!household) {
      return res.status(404).json({ message: 'Household not found' });
    }

    const updateData = { ...req.body };
    if (!req.isSuperAdmin) {
      delete updateData.barangay_id;
    }

    await household.update(updateData);

    // Update total members count
    const memberCount = await Resident.count({
      where: { household_id: req.params.id }
    });
    await household.update({ total_members: memberCount });

    res.json({ 
      message: 'Household updated successfully',
      household 
    });
  } catch (error) {
    console.error('Update household error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/households/:id - Delete household (Admin only)
router.delete('/:id', checkRole('admin', 'super_admin'), async (req, res) => {
  try {
    const queryScope = getQueryScope(req.user);

    const household = await Household.findOne({
      where: { id: req.params.id, ...queryScope.where }
    });

    if (!household) {
      return res.status(404).json({ message: 'Household not found' });
    }

    // Remove household_id from all members
    await Resident.update(
      { household_id: null },
      { where: { household_id: req.params.id } }
    );

    // Soft delete
    await household.update({ status: 'inactive' });

    res.json({ message: 'Household deleted successfully' });
  } catch (error) {
    console.error('Delete household error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/households/:id/add-member - Add member to household
router.post('/:id/add-member', isStaff, async (req, res) => {
  try {
    const queryScope = getQueryScope(req.user);
    const { resident_id, is_head = false } = req.body;

    const household = await Household.findOne({
      where: { id: req.params.id, ...queryScope.where }
    });

    if (!household) {
      return res.status(404).json({ message: 'Household not found' });
    }

    const resident = await Resident.findOne({
      where: { id: resident_id, ...queryScope.where }
    });

    if (!resident) {
      return res.status(404).json({ message: 'Resident not found' });
    }

    // Update resident's household
    await resident.update({ household_id: req.params.id });

    // If this resident should be the head
    if (is_head) {
      await household.update({ head_id: resident_id });
    }

    // Update total members count
    const memberCount = await Resident.count({
      where: { household_id: req.params.id }
    });
    await household.update({ total_members: memberCount });

    res.json({ message: 'Member added to household successfully' });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/households/:id/remove-member - Remove member from household
router.post('/:id/remove-member', isStaff, async (req, res) => {
  try {
    const queryScope = getQueryScope(req.user);
    const { resident_id } = req.body;

    const household = await Household.findOne({
      where: { id: req.params.id, ...queryScope.where }
    });

    if (!household) {
      return res.status(404).json({ message: 'Household not found' });
    }

    const resident = await Resident.findOne({
      where: { id: resident_id, household_id: req.params.id }
    });

    if (!resident) {
      return res.status(404).json({ message: 'Resident not found in this household' });
    }

    // Remove from household
    await resident.update({ household_id: null });

    // If this was the head, clear head_id
    if (household.head_id === parseInt(resident_id)) {
      await household.update({ head_id: null });
    }

    // Update total members count
    const memberCount = await Resident.count({
      where: { household_id: req.params.id }
    });
    await household.update({ total_members: memberCount });

    res.json({ message: 'Member removed from household successfully' });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
