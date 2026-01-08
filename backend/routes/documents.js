const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { Document, Resident, Barangay, User } = require('../models');
const { auth } = require('../middleware/auth');
const { barangayFilter, getQueryScope } = require('../middleware/barangayFilter');
const { checkRole, isStaff } = require('../middleware/roleCheck');
const emailService = require('../services/emailService');
const pdfService = require('../services/pdfService');

// Apply auth and barangay filter to all routes
router.use(auth);
router.use(barangayFilter);

// Validation rules
const documentValidation = [
  body('resident_id').isInt().withMessage('Valid resident ID is required'),
  body('document_type').isIn([
    'barangay_clearance',
    'certificate_of_residency',
    'certificate_of_indigency',
    'business_permit',
    'good_moral_character',
    'certificate_of_no_income',
    'certificate_of_late_registration',
    'barangay_id',
    'other'
  ]).withMessage('Invalid document type'),
  body('purpose').trim().notEmpty().withMessage('Purpose is required')
];

// Generate control number
const generateControlNumber = async (barangayId, documentType) => {
  const year = new Date().getFullYear();
  const prefix = documentType.substring(0, 3).toUpperCase();
  
  const count = await Document.count({
    where: {
      barangay_id: barangayId,
      created_at: {
        [Op.gte]: new Date(year, 0, 1),
        [Op.lt]: new Date(year + 1, 0, 1)
      }
    }
  });

  return `${prefix}-${year}-${String(count + 1).padStart(5, '0')}`;
};

// GET /api/documents - Get all documents (paginated)
router.get('/', isStaff, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search,
      document_type,
      status,
      resident_id,
      from_date,
      to_date,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const queryScope = getQueryScope(req.user);

    const whereClause = { ...queryScope.where };

    if (search) {
      whereClause[Op.or] = [
        { control_number: { [Op.like]: `%${search}%` } },
        { or_number: { [Op.like]: `%${search}%` } },
        { purpose: { [Op.like]: `%${search}%` } }
      ];
    }

    if (document_type) whereClause.document_type = document_type;
    if (status) whereClause.status = status;
    if (resident_id) whereClause.resident_id = resident_id;

    if (from_date || to_date) {
      whereClause.created_at = {};
      if (from_date) whereClause.created_at[Op.gte] = new Date(from_date);
      if (to_date) whereClause.created_at[Op.lte] = new Date(to_date);
    }

    const { count, rows: documents } = await Document.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Resident,
          as: 'resident',
          attributes: ['id', 'first_name', 'middle_name', 'last_name', 'photo_url', 'address']
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
      documents,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/documents/statistics - Get document statistics
router.get('/statistics', isStaff, async (req, res) => {
  try {
    const queryScope = getQueryScope(req.user);
    const { sequelize } = require('../models');

    const stats = await Document.findAll({
      where: queryScope.where,
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'pending' THEN 1 ELSE 0 END")), 'pending'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'processing' THEN 1 ELSE 0 END")), 'processing'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'ready' THEN 1 ELSE 0 END")), 'ready'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'released' THEN 1 ELSE 0 END")), 'released'],
        [sequelize.fn('SUM', sequelize.col('amount_paid')), 'total_revenue']
      ],
      raw: true
    });

    // Get by document type
    const byType = await Document.findAll({
      where: queryScope.where,
      attributes: [
        'document_type',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['document_type'],
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

// GET /api/documents/:id - Get document details
router.get('/:id', isStaff, async (req, res) => {
  try {
    const queryScope = getQueryScope(req.user);

    const document = await Document.findOne({
      where: { id: req.params.id, ...queryScope.where },
      include: [
        {
          model: Resident,
          as: 'resident'
        },
        {
          model: User,
          as: 'issuer',
          attributes: ['id', 'first_name', 'last_name', 'role']
        },
        {
          model: User,
          as: 'requester',
          attributes: ['id', 'first_name', 'last_name']
        },
        {
          model: Barangay,
          as: 'barangay'
        }
      ]
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    res.json({ document });
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/documents - Request new document
router.post('/', isStaff, documentValidation, async (req, res) => {
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

    // Generate control number
    const control_number = await generateControlNumber(barangay_id, req.body.document_type);

    const document = await Document.create({
      ...req.body,
      barangay_id,
      control_number,
      requested_by: req.user.id,
      request_date: new Date()
    });

    // Send email notification
    try {
      if (resident.email) {
        await emailService.sendDocumentRequestNotification(resident, document);
      }
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError);
    }

    res.status(201).json({ 
      message: 'Document request created successfully',
      document 
    });
  } catch (error) {
    console.error('Create document error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/documents/:id - Update document
router.put('/:id', isStaff, async (req, res) => {
  try {
    const queryScope = getQueryScope(req.user);

    const document = await Document.findOne({
      where: { id: req.params.id, ...queryScope.where }
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const updateData = { ...req.body };
    if (!req.isSuperAdmin) {
      delete updateData.barangay_id;
    }

    await document.update(updateData);

    res.json({ 
      message: 'Document updated successfully',
      document 
    });
  } catch (error) {
    console.error('Update document error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/documents/:id/status - Update document status
router.put('/:id/status', isStaff, async (req, res) => {
  try {
    const queryScope = getQueryScope(req.user);
    const { status, rejection_reason, or_number, amount_paid } = req.body;

    const document = await Document.findOne({
      where: { id: req.params.id, ...queryScope.where },
      include: [{ model: Resident, as: 'resident' }]
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const updateData = { status };

    if (status === 'rejected') {
      updateData.rejection_reason = rejection_reason;
    }

    if (status === 'released') {
      updateData.issued_by = req.user.id;
      updateData.issued_date = new Date();
      updateData.or_number = or_number;
      updateData.amount_paid = amount_paid || 0;
    }

    await document.update(updateData);

    // Send email notification for status change
    try {
      if (document.resident && document.resident.email) {
        await emailService.sendDocumentStatusNotification(document.resident, document);
      }
    } catch (emailError) {
      console.error('Failed to send status email:', emailError);
    }

    res.json({ 
      message: 'Document status updated successfully',
      document 
    });
  } catch (error) {
    console.error('Update document status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/documents/:id/download - Download document PDF
router.get('/:id/download', isStaff, async (req, res) => {
  try {
    const queryScope = getQueryScope(req.user);

    const document = await Document.findOne({
      where: { id: req.params.id, ...queryScope.where },
      include: [
        { model: Resident, as: 'resident' },
        { model: Barangay, as: 'barangay' },
        { model: User, as: 'issuer', attributes: ['first_name', 'last_name'] }
      ]
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    if (document.status !== 'ready' && document.status !== 'released') {
      return res.status(400).json({ message: 'Document is not ready for download' });
    }

    // Generate PDF
    const pdfBuffer = await pdfService.generateCertificate(document);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${document.control_number}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Download document error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/documents/:id - Delete document (Admin only)
router.delete('/:id', checkRole('admin', 'super_admin'), async (req, res) => {
  try {
    const queryScope = getQueryScope(req.user);

    const document = await Document.findOne({
      where: { id: req.params.id, ...queryScope.where }
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Only allow deleting pending or cancelled documents
    if (!['pending', 'cancelled'].includes(document.status)) {
      return res.status(400).json({ message: 'Cannot delete processed documents' });
    }

    await document.destroy();

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
