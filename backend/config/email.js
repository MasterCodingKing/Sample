require('dotenv').config();

module.exports = {
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  from: process.env.EMAIL_FROM || 'Barangay System <noreply@barangay.gov.ph>',
  
  // Email templates
  templates: {
    welcome: {
      subject: 'Welcome to Barangay Management System',
      template: 'welcome'
    },
    passwordReset: {
      subject: 'Password Reset Request',
      template: 'password-reset'
    },
    documentRequest: {
      subject: 'Document Request Received',
      template: 'document-request'
    },
    documentReady: {
      subject: 'Your Document is Ready',
      template: 'document-ready'
    },
    incidentReport: {
      subject: 'Incident Report Notification',
      template: 'incident-report'
    },
    announcement: {
      subject: 'Barangay Announcement',
      template: 'announcement'
    }
  }
};
