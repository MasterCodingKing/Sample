const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const emailService = require('../services/emailService');
const { optionalAuth } = require('../middleware/auth');

// Validation rules
const contactValidation = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('subject').trim().notEmpty().withMessage('Subject is required').isLength({ max: 255 }),
  body('message').trim().notEmpty().withMessage('Message is required').isLength({ max: 2000 })
];

// POST /api/contact - Submit contact form
router.post('/', optionalAuth, contactValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, subject, message, barangay_id } = req.body;

    // Send email notification to admin
    try {
      await emailService.sendContactFormEmail({
        name,
        email,
        subject,
        message,
        barangay_id,
        user: req.user || null
      });

      // Send confirmation to sender
      await emailService.sendContactConfirmation({ name, email, subject });
    } catch (emailError) {
      console.error('Failed to send contact emails:', emailError);
      // Still return success - email failure shouldn't block the submission
    }

    res.json({ 
      message: 'Your message has been sent successfully. We will get back to you soon.' 
    });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/contact/feedback - Submit feedback
router.post('/feedback', optionalAuth, [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('feedback').trim().notEmpty().withMessage('Feedback is required').isLength({ max: 1000 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { rating, feedback, category } = req.body;

    // Send feedback notification to admin
    try {
      await emailService.sendFeedbackEmail({
        rating,
        feedback,
        category,
        user: req.user || null
      });
    } catch (emailError) {
      console.error('Failed to send feedback email:', emailError);
    }

    res.json({ 
      message: 'Thank you for your feedback!' 
    });
  } catch (error) {
    console.error('Feedback error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
