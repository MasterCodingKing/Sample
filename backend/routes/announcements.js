const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { Announcement, Barangay, User } = require('../models');
const { auth, optionalAuth } = require('../middleware/auth');
const { barangayFilter, getQueryScope } = require('../middleware/barangayFilter');
const { checkRole, isStaff, isAdmin } = require('../middleware/roleCheck');

// Validation rules
const announcementValidation = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 255 }),
  body('content').trim().notEmpty().withMessage('Content is required'),
  body('category').optional().isIn(['general', 'emergency', 'event', 'notice', 'health', 'other'])
];

// GET /api/announcements/public - Get public announcements (no auth required)
router.get('/public', optionalAuth, async (req, res) => {
  try {
    const { barangay_id, limit = 10 } = req.query;

    const whereClause = {
      is_published: true,
      published_at: { [Op.lte]: new Date() }
    };

    if (barangay_id) {
      whereClause.barangay_id = barangay_id;
    }

    const announcements = await Announcement.findAll({
      where: whereClause,
      include: [
        {
          model: Barangay,
          as: 'barangay',
          attributes: ['id', 'name', 'logo_url']
        }
      ],
      order: [['published_at', 'DESC']],
      limit: parseInt(limit)
    });

    res.json({ announcements });
  } catch (error) {
    console.error('Get public announcements error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Apply auth and barangay filter to remaining routes
router.use(auth);
router.use(barangayFilter);

// GET /api/announcements - Get all announcements (paginated)
router.get('/', isStaff, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search,
      category,
      is_published,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const queryScope = getQueryScope(req.user);

    const whereClause = { ...queryScope.where };

    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { content: { [Op.like]: `%${search}%` } }
      ];
    }

    if (category) whereClause.category = category;
    if (is_published !== undefined) whereClause.is_published = is_published === 'true';

    const { count, rows: announcements } = await Announcement.findAndCountAll({
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
      announcements,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/announcements/:id - Get announcement details
router.get('/:id', isStaff, async (req, res) => {
  try {
    const queryScope = getQueryScope(req.user);

    const announcement = await Announcement.findOne({
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

    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    res.json({ announcement });
  } catch (error) {
    console.error('Get announcement error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/announcements - Create announcement (Admin only)
router.post('/', isAdmin, announcementValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const barangay_id = req.isSuperAdmin ? req.body.barangay_id : req.barangayId;

    if (!barangay_id) {
      return res.status(400).json({ message: 'Barangay ID is required' });
    }

    const { is_published = false } = req.body;

    const announcement = await Announcement.create({
      ...req.body,
      barangay_id,
      created_by: req.user.id,
      is_published,
      published_at: is_published ? new Date() : null
    });

    res.status(201).json({ 
      message: 'Announcement created successfully',
      announcement 
    });
  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/announcements/:id - Update announcement (Admin only)
router.put('/:id', isAdmin, async (req, res) => {
  try {
    const queryScope = getQueryScope(req.user);

    const announcement = await Announcement.findOne({
      where: { id: req.params.id, ...queryScope.where }
    });

    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    const updateData = { ...req.body };
    if (!req.isSuperAdmin) {
      delete updateData.barangay_id;
    }

    // Set published_at if publishing for first time
    if (updateData.is_published && !announcement.is_published) {
      updateData.published_at = new Date();
    }

    await announcement.update(updateData);

    res.json({ 
      message: 'Announcement updated successfully',
      announcement 
    });
  } catch (error) {
    console.error('Update announcement error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/announcements/:id/publish - Publish/unpublish announcement
router.put('/:id/publish', isAdmin, async (req, res) => {
  try {
    const queryScope = getQueryScope(req.user);
    const { is_published } = req.body;

    const announcement = await Announcement.findOne({
      where: { id: req.params.id, ...queryScope.where }
    });

    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    await announcement.update({
      is_published,
      published_at: is_published && !announcement.published_at ? new Date() : announcement.published_at
    });

    res.json({ 
      message: is_published ? 'Announcement published successfully' : 'Announcement unpublished',
      announcement 
    });
  } catch (error) {
    console.error('Publish announcement error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/announcements/:id - Delete announcement (Admin only)
router.delete('/:id', checkRole('admin', 'super_admin'), async (req, res) => {
  try {
    const queryScope = getQueryScope(req.user);

    const announcement = await Announcement.findOne({
      where: { id: req.params.id, ...queryScope.where }
    });

    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    await announcement.destroy();

    res.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error('Delete announcement error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
