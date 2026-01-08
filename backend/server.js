const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const db = require('./models');

// Import routes
const authRoutes = require('./routes/auth');
const residentRoutes = require('./routes/residents');
const householdRoutes = require('./routes/households');
const documentRoutes = require('./routes/documents');
const officialRoutes = require('./routes/officials');
const incidentRoutes = require('./routes/incidents');
const businessRoutes = require('./routes/businesses');
const businessPermitRoutes = require('./routes/businessPermits');
const announcementRoutes = require('./routes/announcements');
const eventRoutes = require('./routes/events');
const reportRoutes = require('./routes/reports');
const barangayRoutes = require('./routes/barangays');
const userRoutes = require('./routes/users');
const contactRoutes = require('./routes/contact');

const app = express();

// Security middleware
app.use(helmet());

// Rate limiting - different limits for different endpoints
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased limit for general API requests
  message: { message: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit auth attempts
  message: { message: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', generalLimiter);
app.use('/api/auth/', authLimiter);

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/residents', residentRoutes);
app.use('/api/households', householdRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/officials', officialRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/businesses', businessRoutes);
app.use('/api/business-permits', businessPermitRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/barangays', barangayRoutes);
app.use('/api/users', userRoutes);
app.use('/api/contact', contactRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Barangay Management System API is running' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 5000;

// Database connection and server start
db.sequelize.authenticate()
  .then(() => {
    console.log('Database connection established successfully.');
    // Don't use sync in production - use migrations instead
    // return db.sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
  })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`API: http://localhost:${PORT}/api`);
    });
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
    process.exit(1);
  });

module.exports = app;
