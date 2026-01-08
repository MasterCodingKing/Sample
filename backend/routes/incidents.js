const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { Incident, Resident, Barangay, User } = require('../models');
const { auth } = require('../middleware/auth');
const { barangayFilter, getQueryScope } = require('../middleware/barangayFilter');
const { checkRole, isStaff, isAdmin } = require('../middleware/roleCheck');
const emailService = require('../services/emailService');

// Apply auth and barangay filter to all routes
router.use(auth);
router.use(barangayFilter);

// Validation rules
const incidentValidation = [
  body('incident_type').trim().notEmpty().withMessage('Incident type is required'),
  body('incident_date').isISO8601().withMessage('Valid incident date is required'),
  body('description').trim().notEmpty().withMessage('Description is required')
];

// Generate blotter number
const generateBlotterNumber = async (barangayId) => {
  const year = new Date().getFullYear();
  
  const count = await Incident.count({
    where: {
      barangay_id: barangayId,
      created_at: {
        [Op.gte]: new Date(year, 0, 1),
        [Op.lt]: new Date(year + 1, 0, 1)
      }
    }
  });

  return `BLT-${year}-${String(count + 1).padStart(5, '0')}`;
};

// GET /api/incidents - Get all incidents (paginated)
router.get('/', isStaff, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search,
      incident_type,
      status,
      from_date,
      to_date,
      sortBy = 'incident_date',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const queryScope = getQueryScope(req.user);

    const whereClause = { ...queryScope.where };

    if (search) {
      whereClause[Op.or] = [
        { blotter_number: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { location: { [Op.like]: `%${search}%` } }
      ];
    }

    if (incident_type) whereClause.incident_type = incident_type;
    if (status) whereClause.status = status;

    if (from_date || to_date) {
      whereClause.incident_date = {};
      if (from_date) whereClause.incident_date[Op.gte] = new Date(from_date);
      if (to_date) whereClause.incident_date[Op.lte] = new Date(to_date);
    }

    const { count, rows: incidents } = await Incident.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Resident,
          as: 'complainant',
          attributes: ['id', 'first_name', 'middle_name', 'last_name', 'contact_number']
        },
        {
          model: Resident,
          as: 'respondent',
          attributes: ['id', 'first_name', 'middle_name', 'last_name', 'contact_number']
        },
        {
          model: User,
          as: 'creator',
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
      incidents,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get incidents error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/incidents/statistics - Get incident statistics
router.get('/statistics', isStaff, async (req, res) => {
  try {
    const queryScope = getQueryScope(req.user);
    const { sequelize } = require('../models');

    const stats = await Incident.findAll({
      where: queryScope.where,
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'pending' THEN 1 ELSE 0 END")), 'pending'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'investigating' THEN 1 ELSE 0 END")), 'investigating'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'resolved' THEN 1 ELSE 0 END")), 'resolved'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'dismissed' THEN 1 ELSE 0 END")), 'dismissed']
      ],
      raw: true
    });

    // Get by incident type
    const byType = await Incident.findAll({
      where: queryScope.where,
      attributes: [
        'incident_type',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['incident_type'],
      raw: true
    });

    res.json({ 
      statistics: stats[0] || {},
      byType
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/incidents/:id - Get incident details
router.get('/:id', isStaff, async (req, res) => {
  try {
    const queryScope = getQueryScope(req.user);

    const incident = await Incident.findOne({
      where: { id: req.params.id, ...queryScope.where },
      include: [
        {
          model: Resident,
          as: 'complainant'
        },
        {
          model: Resident,
          as: 'respondent'
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'first_name', 'last_name', 'role']
        },
        {
          model: Barangay,
          as: 'barangay'
        }
      ]
    });

    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    res.json({ incident });
  } catch (error) {
    console.error('Get incident error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/incidents - Create incident report
router.post('/', isStaff, incidentValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const barangay_id = req.isSuperAdmin ? req.body.barangay_id : req.barangayId;

    if (!barangay_id) {
      return res.status(400).json({ message: 'Barangay ID is required' });
    }

    // Generate blotter number
    const blotter_number = await generateBlotterNumber(barangay_id);

    const incident = await Incident.create({
      ...req.body,
      barangay_id,
      blotter_number,
      created_by: req.user.id,
      status: 'pending'
    });

    // Send email notification if complainant has email
    try {
      if (req.body.complainant_id) {
        const complainant = await Resident.findByPk(req.body.complainant_id);
        if (complainant && complainant.email) {
          await emailService.sendIncidentNotification(complainant, incident);
        }
      }
    } catch (emailError) {
      console.error('Failed to send incident notification:', emailError);
    }

    res.status(201).json({ 
      message: 'Incident report created successfully',
      incident 
    });
  } catch (error) {
    console.error('Create incident error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/incidents/:id - Update incident
router.put('/:id', isStaff, async (req, res) => {
  try {
    const queryScope = getQueryScope(req.user);

    const incident = await Incident.findOne({
      where: { id: req.params.id, ...queryScope.where }
    });

    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    const updateData = { ...req.body };
    if (!req.isSuperAdmin) {
      delete updateData.barangay_id;
    }

    await incident.update(updateData);

    res.json({ 
      message: 'Incident updated successfully',
      incident 
    });
  } catch (error) {
    console.error('Update incident error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/incidents/:id/resolve - Resolve incident
router.put('/:id/resolve', isStaff, async (req, res) => {
  try {
    const queryScope = getQueryScope(req.user);
    const { resolution, settled_date } = req.body;

    const incident = await Incident.findOne({
      where: { id: req.params.id, ...queryScope.where },
      include: [{ model: Resident, as: 'complainant' }]
    });

    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    await incident.update({
      status: 'resolved',
      resolution,
      settled_date: settled_date || new Date()
    });

    // Send resolution notification
    try {
      if (incident.complainant && incident.complainant.email) {
        await emailService.sendIncidentResolutionNotification(incident.complainant, incident);
      }
    } catch (emailError) {
      console.error('Failed to send resolution notification:', emailError);
    }

    res.json({ 
      message: 'Incident resolved successfully',
      incident 
    });
  } catch (error) {
    console.error('Resolve incident error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/incidents/:id - Delete incident (Admin only)
router.delete('/:id', checkRole('admin', 'super_admin'), async (req, res) => {
  try {
    const queryScope = getQueryScope(req.user);

    const incident = await Incident.findOne({
      where: { id: req.params.id, ...queryScope.where }
    });

    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    await incident.destroy();

    res.json({ message: 'Incident deleted successfully' });
  } catch (error) {
    console.error('Delete incident error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
