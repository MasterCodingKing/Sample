const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { Event, Barangay, User } = require('../models');
const { auth, optionalAuth } = require('../middleware/auth');
const { barangayFilter, getQueryScope } = require('../middleware/barangayFilter');
const { checkRole, isStaff, isAdmin } = require('../middleware/roleCheck');

// Validation rules
const eventValidation = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 255 }),
  body('event_date').isDate().withMessage('Valid event date is required'),
  body('location').trim().notEmpty().withMessage('Location is required')
];

// GET /api/events/public - Get public events (no auth required)
router.get('/public', optionalAuth, async (req, res) => {
  try {
    const { barangay_id, limit = 10, upcoming = 'true' } = req.query;

    const whereClause = {
      status: 'scheduled'
    };

    if (barangay_id) {
      whereClause.barangay_id = barangay_id;
    }

    if (upcoming === 'true') {
      whereClause.event_date = { [Op.gte]: new Date() };
    }

    const events = await Event.findAll({
      where: whereClause,
      include: [
        {
          model: Barangay,
          as: 'barangay',
          attributes: ['id', 'name', 'logo_url']
        }
      ],
      order: [['event_date', 'ASC']],
      limit: parseInt(limit)
    });

    res.json({ events });
  } catch (error) {
    console.error('Get public events error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Apply auth and barangay filter to remaining routes
router.use(auth);
router.use(barangayFilter);

// GET /api/events - Get all events (paginated)
router.get('/', isStaff, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search,
      status,
      from_date,
      to_date,
      sortBy = 'event_date',
      sortOrder = 'ASC'
    } = req.query;

    const offset = (page - 1) * limit;
    const queryScope = getQueryScope(req.user);

    const whereClause = { ...queryScope.where };

    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { location: { [Op.like]: `%${search}%` } }
      ];
    }

    if (status) whereClause.status = status;

    if (from_date || to_date) {
      whereClause.event_date = {};
      if (from_date) whereClause.event_date[Op.gte] = new Date(from_date);
      if (to_date) whereClause.event_date[Op.lte] = new Date(to_date);
    }

    const { count, rows: events } = await Event.findAndCountAll({
      where: whereClause,
      include: [
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
      events,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/events/upcoming - Get upcoming events
router.get('/upcoming', isStaff, async (req, res) => {
  try {
    const queryScope = getQueryScope(req.user);
    const { days = 30 } = req.query;

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + parseInt(days));

    const events = await Event.findAll({
      where: {
        ...queryScope.where,
        status: 'scheduled',
        event_date: {
          [Op.between]: [new Date(), futureDate]
        }
      },
      include: [
        {
          model: Barangay,
          as: 'barangay',
          attributes: ['id', 'name']
        }
      ],
      order: [['event_date', 'ASC']]
    });

    res.json({ events });
  } catch (error) {
    console.error('Get upcoming events error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/events/:id - Get event details
router.get('/:id', isStaff, async (req, res) => {
  try {
    const queryScope = getQueryScope(req.user);

    const event = await Event.findOne({
      where: { id: req.params.id, ...queryScope.where },
      include: [
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

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json({ event });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/events - Create event (Admin only)
router.post('/', isAdmin, eventValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const barangay_id = req.isSuperAdmin ? req.body.barangay_id : req.barangayId;

    if (!barangay_id) {
      return res.status(400).json({ message: 'Barangay ID is required' });
    }

    const event = await Event.create({
      ...req.body,
      barangay_id,
      created_by: req.user.id,
      status: 'scheduled'
    });

    res.status(201).json({ 
      message: 'Event created successfully',
      event 
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/events/:id - Update event (Admin only)
router.put('/:id', isAdmin, async (req, res) => {
  try {
    const queryScope = getQueryScope(req.user);

    const event = await Event.findOne({
      where: { id: req.params.id, ...queryScope.where }
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const updateData = { ...req.body };
    if (!req.isSuperAdmin) {
      delete updateData.barangay_id;
    }

    await event.update(updateData);

    res.json({ 
      message: 'Event updated successfully',
      event 
    });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/events/:id/status - Update event status
router.put('/:id/status', isAdmin, async (req, res) => {
  try {
    const queryScope = getQueryScope(req.user);
    const { status } = req.body;

    if (!['scheduled', 'ongoing', 'completed', 'cancelled', 'postponed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const event = await Event.findOne({
      where: { id: req.params.id, ...queryScope.where }
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    await event.update({ status });

    res.json({ 
      message: 'Event status updated successfully',
      event 
    });
  } catch (error) {
    console.error('Update event status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/events/:id - Delete event (Admin only)
router.delete('/:id', checkRole('admin', 'super_admin'), async (req, res) => {
  try {
    const queryScope = getQueryScope(req.user);

    const event = await Event.findOne({
      where: { id: req.params.id, ...queryScope.where }
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    await event.destroy();

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
