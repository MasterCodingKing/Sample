const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { Resident, Household, Barangay, Document, User } = require('../models');
const { auth } = require('../middleware/auth');
const { barangayFilter, getQueryScope } = require('../middleware/barangayFilter');
const { checkRole, isStaff } = require('../middleware/roleCheck');
const { upload } = require('../middleware/upload');

// Apply auth and barangay filter to all routes
router.use(auth);
router.use(barangayFilter);

// Validation rules
const residentValidation = [
  body('first_name').trim().notEmpty().withMessage('First name is required').isLength({ max: 50 }),
  body('last_name').trim().notEmpty().withMessage('Last name is required').isLength({ max: 50 }),
  body('date_of_birth').isDate().withMessage('Valid date of birth is required'),
  body('gender').isIn(['male', 'female', 'other']).withMessage('Invalid gender'),
  body('civil_status').optional().isIn(['single', 'married', 'widowed', 'separated', 'divorced']),
  body('address').trim().notEmpty().withMessage('Address is required'),
  body('email').optional().isEmail().normalizeEmail()
];

// GET /api/residents - Get all residents (paginated)
router.get('/', isStaff, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      gender, 
      civil_status,
      zone_purok,
      is_voter,
      is_pwd,
      is_senior,
      household_id,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const queryScope = getQueryScope(req.user);

    // Build where clause
    const whereClause = { ...queryScope.where };

    if (search) {
      whereClause[Op.or] = [
        { first_name: { [Op.like]: `%${search}%` } },
        { last_name: { [Op.like]: `%${search}%` } },
        { middle_name: { [Op.like]: `%${search}%` } },
        { contact_number: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }

    if (gender) whereClause.gender = gender;
    if (civil_status) whereClause.civil_status = civil_status;
    if (zone_purok) whereClause.zone_purok = zone_purok;
    if (is_voter !== undefined) whereClause.voter_status = is_voter === 'true';
    if (is_pwd !== undefined) whereClause.is_pwd = is_pwd === 'true';
    if (is_senior !== undefined) whereClause.is_senior_citizen = is_senior === 'true';
    if (household_id) whereClause.household_id = household_id;

    const { count, rows: residents } = await Resident.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Household,
          as: 'household',
          attributes: ['id', 'household_number', 'address']
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
      residents,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get residents error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/residents/search - Search residents
router.get('/search', isStaff, async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    const queryScope = getQueryScope(req.user);

    if (!q || q.length < 2) {
      return res.json({ residents: [] });
    }

    const residents = await Resident.findAll({
      where: {
        ...queryScope.where,
        [Op.or]: [
          { first_name: { [Op.like]: `%${q}%` } },
          { last_name: { [Op.like]: `%${q}%` } },
          { middle_name: { [Op.like]: `%${q}%` } }
        ]
      },
      attributes: ['id', 'first_name', 'middle_name', 'last_name', 'photo_url', 'address'],
      limit: parseInt(limit)
    });

    res.json({ residents });
  } catch (error) {
    console.error('Search residents error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/residents/statistics - Get resident statistics
router.get('/statistics', isStaff, async (req, res) => {
  try {
    const queryScope = getQueryScope(req.user);
    const { sequelize } = require('../models');

    const stats = await Resident.findAll({
      where: queryScope.where,
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN gender = 'male' THEN 1 ELSE 0 END")), 'male'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN gender = 'female' THEN 1 ELSE 0 END")), 'female'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN voter_status = true THEN 1 ELSE 0 END")), 'voters'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN is_pwd = true THEN 1 ELSE 0 END")), 'pwd'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN is_senior_citizen = true THEN 1 ELSE 0 END")), 'seniors'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN is_4ps_member = true THEN 1 ELSE 0 END")), 'fourps']
      ],
      raw: true
    });

    res.json({ statistics: stats[0] || {} });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/residents/:id - Get resident details
router.get('/:id', isStaff, async (req, res) => {
  try {
    const queryScope = getQueryScope(req.user);

    const resident = await Resident.findOne({
      where: { id: req.params.id, ...queryScope.where },
      include: [
        {
          model: Household,
          as: 'household',
          attributes: ['id', 'household_number', 'address', 'zone_purok', 'economic_status']
        },
        {
          model: Barangay,
          as: 'barangay',
          attributes: ['id', 'name', 'address', 'captain_name']
        },
        {
          model: Document,
          as: 'documents',
          limit: 10,
          order: [['created_at', 'DESC']],
          attributes: ['id', 'document_type', 'status', 'issued_date', 'control_number']
        }
      ]
    });

    if (!resident) {
      return res.status(404).json({ message: 'Resident not found' });
    }

    res.json({ resident });
  } catch (error) {
    console.error('Get resident error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/residents - Create new resident
router.post('/', isStaff, residentValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Set barangay_id based on user's barangay
    const barangay_id = req.isSuperAdmin ? req.body.barangay_id : req.barangayId;

    if (!barangay_id) {
      return res.status(400).json({ message: 'Barangay ID is required' });
    }

    const resident = await Resident.create({
      ...req.body,
      barangay_id
    });

    res.status(201).json({ 
      message: 'Resident created successfully',
      resident 
    });
  } catch (error) {
    console.error('Create resident error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/residents/:id - Update resident
router.put('/:id', isStaff, async (req, res) => {
  try {
    const queryScope = getQueryScope(req.user);

    const resident = await Resident.findOne({
      where: { id: req.params.id, ...queryScope.where }
    });

    if (!resident) {
      return res.status(404).json({ message: 'Resident not found' });
    }

    // Don't allow changing barangay_id unless super admin
    const updateData = { ...req.body };
    if (!req.isSuperAdmin) {
      delete updateData.barangay_id;
    }

    await resident.update(updateData);

    res.json({ 
      message: 'Resident updated successfully',
      resident 
    });
  } catch (error) {
    console.error('Update resident error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/residents/:id - Delete resident (Admin only)
router.delete('/:id', checkRole('admin', 'super_admin'), async (req, res) => {
  try {
    const queryScope = getQueryScope(req.user);

    const resident = await Resident.findOne({
      where: { id: req.params.id, ...queryScope.where }
    });

    if (!resident) {
      return res.status(404).json({ message: 'Resident not found' });
    }

    // Soft delete by updating status
    await resident.update({ status: 'inactive' });

    res.json({ message: 'Resident deleted successfully' });
  } catch (error) {
    console.error('Delete resident error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/residents/:id/upload-photo - Upload resident photo
router.post('/:id/upload-photo', isStaff, upload.single('photo'), async (req, res) => {
  try {
    const queryScope = getQueryScope(req.user);

    const resident = await Resident.findOne({
      where: { id: req.params.id, ...queryScope.where }
    });

    if (!resident) {
      return res.status(404).json({ message: 'Resident not found' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const photo_url = `/uploads/${req.file.filename}`;
    await resident.update({ photo_url });

    res.json({ 
      message: 'Photo uploaded successfully',
      photo_url 
    });
  } catch (error) {
    console.error('Upload photo error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/residents/:id/documents - Get resident's documents
router.get('/:id/documents', isStaff, async (req, res) => {
  try {
    const queryScope = getQueryScope(req.user);

    const resident = await Resident.findOne({
      where: { id: req.params.id, ...queryScope.where }
    });

    if (!resident) {
      return res.status(404).json({ message: 'Resident not found' });
    }

    const documents = await Document.findAll({
      where: { resident_id: req.params.id },
      order: [['created_at', 'DESC']]
    });

    res.json({ documents });
  } catch (error) {
    console.error('Get resident documents error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
