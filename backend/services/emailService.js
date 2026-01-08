const nodemailer = require('nodemailer');
const emailConfig = require('../config/email');

// Only create transporter if credentials are provided
let transporter = null;
let emailEnabled = false;

if (emailConfig.auth.user && emailConfig.auth.pass) {
  try {
    transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      auth: emailConfig.auth
    });

    // Verify transporter connection (but don't crash if it fails)
    transporter.verify((error, success) => {
      if (error) {
        console.warn('⚠ Email service verification failed:', error.message);
        console.warn('  Email notifications will be disabled.');
        emailEnabled = false;
      } else {
        console.log('✓ Email service is ready to send messages');
        emailEnabled = true;
      }
    });
  } catch (error) {
    console.warn('⚠ Email service could not be initialized:', error.message);
  }
} else {
  console.warn('⚠ Email credentials not configured. Email notifications are disabled.');
}

// Base email template
const baseTemplate = (content, title = 'Barangay Management System') => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
    .content { padding: 30px; background: #f9fafb; }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
    .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 15px 0; }
    .info-box { background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin: 15px 0; }
    .label { font-weight: bold; color: #374151; }
    .value { color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${title}</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>This is an automated message from the Barangay Management System.</p>
      <p>Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
`;

// Helper function to check if email can be sent
const canSendEmail = () => {
  if (!transporter || !emailEnabled) {
    console.warn('Email sending skipped - service not configured');
    return false;
  }
  return true;
};

// Send verification email
const sendVerificationEmail = async (user, token) => {
  if (!canSendEmail()) return;
  
  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email/${token}`;
  
  const content = `
    <h2>Welcome, ${user.first_name || user.username}!</h2>
    <p>Thank you for registering with the Barangay Management System.</p>
    <p>Please click the button below to verify your email address:</p>
    <p style="text-align: center;">
      <a href="${verifyUrl}" class="button">Verify Email</a>
    </p>
    <p>Or copy and paste this link in your browser:</p>
    <p style="word-break: break-all; color: #2563eb;">${verifyUrl}</p>
    <p>This link will expire in 24 hours.</p>
  `;

  await transporter.sendMail({
    from: emailConfig.from,
    to: user.email,
    subject: 'Verify Your Email - Barangay Management System',
    html: baseTemplate(content, 'Email Verification')
  });
};

// Send password reset email
const sendPasswordResetEmail = async (user, token) => {
  if (!canSendEmail()) return;
  
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;
  
  const content = `
    <h2>Password Reset Request</h2>
    <p>Hello ${user.first_name || user.username},</p>
    <p>We received a request to reset your password. Click the button below to proceed:</p>
    <p style="text-align: center;">
      <a href="${resetUrl}" class="button">Reset Password</a>
    </p>
    <p>Or copy and paste this link in your browser:</p>
    <p style="word-break: break-all; color: #2563eb;">${resetUrl}</p>
    <p>This link will expire in 1 hour.</p>
    <p>If you didn't request this, please ignore this email. Your password will remain unchanged.</p>
  `;

  await transporter.sendMail({
    from: emailConfig.from,
    to: user.email,
    subject: 'Password Reset Request - Barangay Management System',
    html: baseTemplate(content, 'Password Reset')
  });
};

// Send document request notification
const sendDocumentRequestNotification = async (resident, document) => {  if (!canSendEmail()) return;
    if (!canSendEmail()) return;
  
  const content = `
    <h2>Document Request Received</h2>
    <p>Hello ${resident.first_name} ${resident.last_name},</p>
    <p>Your document request has been received and is being processed.</p>
    <div class="info-box">
      <p><span class="label">Control Number:</span> <span class="value">${document.control_number}</span></p>
      <p><span class="label">Document Type:</span> <span class="value">${document.document_type.replace(/_/g, ' ').toUpperCase()}</span></p>
      <p><span class="label">Purpose:</span> <span class="value">${document.purpose}</span></p>
      <p><span class="label">Status:</span> <span class="value">${document.status.toUpperCase()}</span></p>
    </div>
    <p>You will receive another notification once your document is ready for pickup.</p>
  `;

  await transporter.sendMail({
    from: emailConfig.from,
    to: resident.email,
    subject: `Document Request Received - ${document.control_number}`,
    html: baseTemplate(content, 'Document Request')
  });
};

// Send document status notification
const sendDocumentStatusNotification = async (resident, document) => {
  const statusMessages = {
    processing: 'Your document is now being processed.',
    ready: 'Your document is ready for pickup!',
    released: 'Your document has been released.',
    rejected: `Your document request has been rejected. Reason: ${document.rejection_reason || 'Not specified'}`,
    cancelled: 'Your document request has been cancelled.'
  };

  const content = `
    <h2>Document Status Update</h2>
    <p>Hello ${resident.first_name} ${resident.last_name},</p>
    <p>${statusMessages[document.status] || 'Your document status has been updated.'}</p>
    <div class="info-box">
      <p><span class="label">Control Number:</span> <span class="value">${document.control_number}</span></p>
      <p><span class="label">Document Type:</span> <span class="value">${document.document_type.replace(/_/g, ' ').toUpperCase()}</span></p>
      <p><span class="label">Status:</span> <span class="value">${document.status.toUpperCase()}</span></p>
    </div>
    ${document.status === 'ready' ? '<p><strong>Please visit the Barangay Hall to claim your document.</strong></p>' : ''}
  `;

  await transporter.sendMail({
    from: emailConfig.from,
    to: resident.email,
    subject: `Document Status: ${document.status.toUpperCase()} - ${document.control_number}`,
    html: baseTemplate(content, 'Document Status Update')
  });
};

// Send incident notification
const sendIncidentNotification = async (complainant, incident) => {
  if (!canSendEmail()) return;
  
  const content = `
    <h2>Incident Report Filed</h2>
    <p>Hello ${complainant.first_name} ${complainant.last_name},</p>
    <p>Your incident report has been filed and recorded.</p>
    <div class="info-box">
      <p><span class="label">Blotter Number:</span> <span class="value">${incident.blotter_number}</span></p>
      <p><span class="label">Incident Type:</span> <span class="value">${incident.incident_type}</span></p>
      <p><span class="label">Date:</span> <span class="value">${new Date(incident.incident_date).toLocaleDateString()}</span></p>
      <p><span class="label">Status:</span> <span class="value">${incident.status.toUpperCase()}</span></p>
    </div>
    <p>We will keep you updated on the progress of your case.</p>
  `;

  await transporter.sendMail({
    from: emailConfig.from,
    to: complainant.email,
    subject: `Incident Report Filed - ${incident.blotter_number}`,
    html: baseTemplate(content, 'Incident Report')
  });
};

// Send incident resolution notification
const sendIncidentResolutionNotification = async (complainant, incident) => {
  if (!canSendEmail()) return;
  
  const content = `
    <h2>Incident Resolved</h2>
    <p>Hello ${complainant.first_name} ${complainant.last_name},</p>
    <p>Your incident case has been resolved.</p>
    <div class="info-box">
      <p><span class="label">Blotter Number:</span> <span class="value">${incident.blotter_number}</span></p>
      <p><span class="label">Resolution:</span> <span class="value">${incident.resolution || 'Case closed'}</span></p>
      <p><span class="label">Settled Date:</span> <span class="value">${new Date(incident.settled_date).toLocaleDateString()}</span></p>
    </div>
    <p>Thank you for your patience and cooperation.</p>
  `;

  await transporter.sendMail({
    from: emailConfig.from,
    to: complainant.email,
    subject: `Incident Resolved - ${incident.blotter_number}`,
    html: baseTemplate(content, 'Case Resolution')
  });
};

// Send contact form email
const sendContactFormEmail = async (data) => {
  if (!canSendEmail()) return;
  
  const content = `
    <h2>New Contact Form Submission</h2>
    <div class="info-box">
      <p><span class="label">Name:</span> <span class="value">${data.name}</span></p>
      <p><span class="label">Email:</span> <span class="value">${data.email}</span></p>
      <p><span class="label">Subject:</span> <span class="value">${data.subject}</span></p>
      ${data.barangay_id ? `<p><span class="label">Barangay ID:</span> <span class="value">${data.barangay_id}</span></p>` : ''}
    </div>
    <h3>Message:</h3>
    <div class="info-box">
      <p>${data.message}</p>
    </div>
  `;

  await transporter.sendMail({
    from: emailConfig.from,
    to: process.env.ADMIN_EMAIL || emailConfig.auth.user,
    replyTo: data.email,
    subject: `Contact Form: ${data.subject}`,
    html: baseTemplate(content, 'Contact Form Submission')
  });
};

// Send contact confirmation
const sendContactConfirmation = async (data) => {
  if (!canSendEmail()) return;
  
  const content = `
    <h2>We Received Your Message</h2>
    <p>Hello ${data.name},</p>
    <p>Thank you for contacting us. We have received your message regarding:</p>
    <div class="info-box">
      <p><strong>${data.subject}</strong></p>
    </div>
    <p>Our team will review your inquiry and get back to you as soon as possible.</p>
  `;

  await transporter.sendMail({
    from: emailConfig.from,
    to: data.email,
    subject: 'We Received Your Message - Barangay Management System',
    html: baseTemplate(content, 'Message Received')
  });
};

// Send feedback email
const sendFeedbackEmail = async (data) => {
  const stars = '⭐'.repeat(data.rating);
  
  const content = `
    <h2>New Feedback Received</h2>
    <div class="info-box">
      <p><span class="label">Rating:</span> <span class="value">${stars} (${data.rating}/5)</span></p>
      ${data.category ? `<p><span class="label">Category:</span> <span class="value">${data.category}</span></p>` : ''}
      ${data.user ? `<p><span class="label">User:</span> <span class="value">${data.user.username} (${data.user.email})</span></p>` : '<p><span class="label">User:</span> <span class="value">Anonymous</span></p>'}
    </div>
    <h3>Feedback:</h3>
    <div class="info-box">
      <p>${data.feedback}</p>
    </div>
  `;

  await transporter.sendMail({
    from: emailConfig.from,
    to: process.env.ADMIN_EMAIL || emailConfig.auth.user,
    subject: `Feedback Received - Rating: ${data.rating}/5`,
    html: baseTemplate(content, 'User Feedback')
  });
};

// Send announcement email
const sendAnnouncementEmail = async (recipients, announcement) => {
  if (!canSendEmail()) return;
  
  const content = `
    <h2>${announcement.title}</h2>
    <p><em>Category: ${announcement.category}</em></p>
    <div class="info-box">
      ${announcement.content}
    </div>
  `;

  // Send in batches to avoid rate limiting
  const batchSize = 50;
  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);
    
    await transporter.sendMail({
      from: emailConfig.from,
      bcc: batch.map(r => r.email).join(','),
      subject: `Announcement: ${announcement.title}`,
      html: baseTemplate(content, 'Barangay Announcement')
    });
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendDocumentRequestNotification,
  sendDocumentStatusNotification,
  sendIncidentNotification,
  sendIncidentResolutionNotification,
  sendContactFormEmail,
  sendContactConfirmation,
  sendFeedbackEmail,
  sendAnnouncementEmail,
  transporter
};
