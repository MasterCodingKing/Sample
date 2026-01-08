const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { Official, Resident, Barangay } = require('../models');
const { auth } = require('../middleware/auth');
const { barangayFilter, getQueryScope } = require('../middleware/barangayFilter');
const { checkRole, isStaff, isAdmin } = require('../middleware/roleCheck');

// Apply auth and barangay filter to all routes
router.use(auth);
router.use(barangayFilter);

// Validation rules
const officialValidation = [
  body('resident_id').isInt().withMessage('Valid resident ID is required'),
  body('position').trim().notEmpty().withMessage('Position is required'),
  body('term_start').isDate().withMessage('Valid term start date is required')
];

// GET /api/officials - Get all officials (paginated)
router.get('/', isStaff, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      position,
      committee,
      status,
      sortBy = 'position',
      sortOrder = 'ASC'
    } = req.query;

    const offset = (page - 1) * limit;
    const queryScope = getQueryScope(req.user);

    const whereClause = { ...queryScope.where };

    if (position) whereClause.position = position;
    if (committee) whereClause.committee = committee;
    if (status) whereClause.status = status;

    const { count, rows: officials } = await Official.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Resident,
          as: 'resident',
          attributes: ['id', 'first_name', 'middle_name', 'last_name', 'photo_url', 'contact_number', 'email']
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
      officials,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get officials error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/officials/current - Get current officials
router.get('/current', isStaff, async (req, res) => {
  try {
    const queryScope = getQueryScope(req.user);

    const officials = await Official.findAll({
      where: {
        ...queryScope.where,
        status: 'active',
        [Op.or]: [
          { term_end: null },
          { term_end: { [Op.gte]: new Date() } }
        ]
      },
      include: [
        {
          model: Resident,
          as: 'resident',
          attributes: ['id', 'first_name', 'middle_name', 'last_name', 'photo_url', 'contact_number', 'email']
        }
      ],
      order: [['position', 'ASC']]
    });

    res.json({ officials });
  } catch (error) {
    console.error('Get current officials error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/officials/:id - Get official details
router.get('/:id', isStaff, async (req, res) => {
  try {
    const queryScope = getQueryScope(req.user);

    const official = await Official.findOne({
      where: { id: req.params.id, ...queryScope.where },
      include: [
        {
          model: Resident,
          as: 'resident'
        },
        {
          model: Barangay,
          as: 'barangay'
        }
      ]
    });

    if (!official) {
      return res.status(404).json({ message: 'Official not found' });
    }

    res.json({ official });
  } catch (error) {
    console.error('Get official error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/officials - Add new official (Admin only)
router.post('/', isAdmin, officialValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const barangay_id = req.isSuperAdmin ? req.body.barangay_id : req.barangayId;

    if (!barangay_id) {
      return res.status(400).json({ message: 'Barangay ID is required' });
    }

    // Verify resident belongs to same barangay
    const resident = await Resident.findOne({
      where: { id: req.body.resident_id, barangay_id }
    });

    if (!resident) {
      return res.status(404).json({ message: 'Resident not found in this barangay' });
    }

    // Check if position is already filled (if it's a unique position)
    const uniquePositions = ['punong_barangay', 'barangay_secretary', 'barangay_treasurer'];
    if (uniquePositions.includes(req.body.position)) {
      const existing = await Official.findOne({
        where: {
          barangay_id,
          position: req.body.position,
          status: 'active'
        }
      });

      if (existing) {
        return res.status(400).json({ message: `Position ${req.body.position} is already filled` });
      }
    }

    const official = await Official.create({
      ...req.body,
      barangay_id,
      status: 'active'
    });

    res.status(201).json({ 
      message: 'Official added successfully',
      official 
    });
  } catch (error) {
    console.error('Create official error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/officials/:id - Update official (Admin only)
router.put('/:id', isAdmin, async (req, res) => {
  try {
    const queryScope = getQueryScope(req.user);

    const official = await Official.findOne({
      where: { id: req.params.id, ...queryScope.where }
    });

    if (!official) {
      return res.status(404).json({ message: 'Official not found' });
    }

    const updateData = { ...req.body };
    if (!req.isSuperAdmin) {
      delete updateData.barangay_id;
    }

    await official.update(updateData);

    res.json({ 
      message: 'Official updated successfully',
      official 
    });
  } catch (error) {
    console.error('Update official error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/officials/:id - Remove official (Admin only)
router.delete('/:id', checkRole('admin', 'super_admin'), async (req, res) => {
  try {
    const queryScope = getQueryScope(req.user);

    const official = await Official.findOne({
      where: { id: req.params.id, ...queryScope.where }
    });

    if (!official) {
      return res.status(404).json({ message: 'Official not found' });
    }

    // Soft delete - set status to inactive and term_end
    await official.update({ 
      status: 'inactive',
      term_end: new Date()
    });

    res.json({ message: 'Official removed successfully' });
  } catch (error) {
    console.error('Delete official error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
