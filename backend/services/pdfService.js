const { jsPDF } = require('jspdf');
const path = require('path');
const fs = require('fs');
const { format } = require('date-fns');

// Certificate templates
const generateCertificate = async (document) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter'
  });

  const resident = document.resident;
  const barangay = document.barangay;
  
  // Page dimensions
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;

  // Add border
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.rect(margin - 5, margin - 5, pageWidth - (margin * 2) + 10, pageHeight - (margin * 2) + 10);
  doc.setLineWidth(0.2);
  doc.rect(margin - 3, margin - 3, pageWidth - (margin * 2) + 6, pageHeight - (margin * 2) + 6);

  // Header
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Republic of the Philippines', pageWidth / 2, margin + 5, { align: 'center' });
  doc.text(barangay?.municipality || 'Municipality', pageWidth / 2, margin + 11, { align: 'center' });
  doc.text(barangay?.province || 'Province', pageWidth / 2, margin + 17, { align: 'center' });

  // Barangay name
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`BARANGAY ${barangay?.name?.toUpperCase() || 'BARANGAY'}`, pageWidth / 2, margin + 28, { align: 'center' });

  // Office of the Punong Barangay
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Office of the Punong Barangay', pageWidth / 2, margin + 35, { align: 'center' });

  // Horizontal line
  doc.setLineWidth(0.5);
  doc.line(margin + 10, margin + 40, pageWidth - margin - 10, margin + 40);

  // Document title based on type
  const titles = {
    'barangay_clearance': 'BARANGAY CLEARANCE',
    'certificate_of_residency': 'CERTIFICATE OF RESIDENCY',
    'certificate_of_indigency': 'CERTIFICATE OF INDIGENCY',
    'good_moral_character': 'CERTIFICATE OF GOOD MORAL CHARACTER',
    'certificate_of_no_income': 'CERTIFICATE OF NO INCOME',
    'certificate_of_late_registration': 'CERTIFICATE OF LATE REGISTRATION',
    'barangay_id': 'BARANGAY ID',
    'business_permit': 'BARANGAY BUSINESS CLEARANCE'
  };

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(titles[document.document_type] || 'CERTIFICATE', pageWidth / 2, margin + 55, { align: 'center' });

  // Control number
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Control No.: ${document.control_number}`, pageWidth - margin - 10, margin + 65, { align: 'right' });

  // TO WHOM IT MAY CONCERN
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('TO WHOM IT MAY CONCERN:', margin + 10, margin + 80);

  // Resident info
  const fullName = `${resident.first_name} ${resident.middle_name ? resident.middle_name + ' ' : ''}${resident.last_name}${resident.suffix ? ' ' + resident.suffix : ''}`;
  const age = calculateAge(resident.date_of_birth);
  const civilStatus = resident.civil_status.charAt(0).toUpperCase() + resident.civil_status.slice(1);

  // Body text based on document type
  let bodyText = '';
  const yStart = margin + 95;
  const lineHeight = 7;

  switch (document.document_type) {
    case 'barangay_clearance':
      bodyText = `This is to certify that ${fullName.toUpperCase()}, ${age} years old, ${civilStatus}, Filipino, and a resident of ${resident.address}, Barangay ${barangay?.name}, ${barangay?.municipality}, ${barangay?.province}, has no derogatory record filed in this Barangay.\n\nThis certification is issued upon the request of the above-named person for ${document.purpose}.`;
      break;
    case 'certificate_of_residency':
      bodyText = `This is to certify that ${fullName.toUpperCase()}, ${age} years old, ${civilStatus}, Filipino, is a bonafide resident of ${resident.address}, Barangay ${barangay?.name}, ${barangay?.municipality}, ${barangay?.province}.\n\nThis certification is issued upon the request of the above-named person for ${document.purpose}.`;
      break;
    case 'certificate_of_indigency':
      bodyText = `This is to certify that ${fullName.toUpperCase()}, ${age} years old, ${civilStatus}, Filipino, and a resident of ${resident.address}, Barangay ${barangay?.name}, ${barangay?.municipality}, ${barangay?.province}, is known to be an INDIGENT in this Barangay.\n\nThis certification is issued upon the request of the above-named person for ${document.purpose}.`;
      break;
    case 'good_moral_character':
      bodyText = `This is to certify that ${fullName.toUpperCase()}, ${age} years old, ${civilStatus}, Filipino, and a resident of ${resident.address}, Barangay ${barangay?.name}, ${barangay?.municipality}, ${barangay?.province}, is known to me to be a person of GOOD MORAL CHARACTER and has no derogatory record filed in this Barangay.\n\nThis certification is issued upon the request of the above-named person for ${document.purpose}.`;
      break;
    default:
      bodyText = `This is to certify that ${fullName.toUpperCase()}, ${age} years old, ${civilStatus}, Filipino, and a resident of ${resident.address}, Barangay ${barangay?.name}, ${barangay?.municipality}, ${barangay?.province}.\n\nThis certification is issued upon the request of the above-named person for ${document.purpose}.`;
  }

  // Add body text with word wrapping
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  const splitText = doc.splitTextToSize(bodyText, pageWidth - (margin * 2) - 20);
  doc.text(splitText, margin + 10, yStart);

  // Issued date
  const issuedDate = document.issued_date ? format(new Date(document.issued_date), 'MMMM dd, yyyy') : format(new Date(), 'MMMM dd, yyyy');
  doc.text(`Issued this ${issuedDate} at Barangay ${barangay?.name}, ${barangay?.municipality}, ${barangay?.province}.`, margin + 10, yStart + (splitText.length * lineHeight) + 15);

  // Signature section
  const sigY = pageHeight - margin - 60;
  
  // Punong Barangay signature
  doc.setFont('helvetica', 'bold');
  doc.text(barangay?.captain_name?.toUpperCase() || 'PUNONG BARANGAY', pageWidth - margin - 50, sigY, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text('Punong Barangay', pageWidth - margin - 50, sigY + 5, { align: 'center' });

  // OR Number and Amount (if applicable)
  if (document.or_number) {
    doc.setFontSize(9);
    doc.text(`O.R. No.: ${document.or_number}`, margin + 10, pageHeight - margin - 25);
    doc.text(`Amount Paid: PHP ${parseFloat(document.amount_paid || 0).toFixed(2)}`, margin + 10, pageHeight - margin - 20);
  }

  // Footer
  doc.setFontSize(8);
  doc.text('This document is valid for 6 months from the date of issuance.', pageWidth / 2, pageHeight - margin - 10, { align: 'center' });
  doc.text('Not valid without official dry seal.', pageWidth / 2, pageHeight - margin - 5, { align: 'center' });

  return doc.output('arraybuffer');
};

// Calculate age from birthdate
const calculateAge = (birthdate) => {
  const today = new Date();
  const birth = new Date(birthdate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

// Generate business permit certificate
const generateBusinessPermit = async (permit) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter'
  });

  const business = permit.business;
  const barangay = permit.barangay;
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;

  // Add border
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.rect(margin - 5, margin - 5, pageWidth - (margin * 2) + 10, pageHeight - (margin * 2) + 10);

  // Header
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Republic of the Philippines', pageWidth / 2, margin + 5, { align: 'center' });
  doc.text(barangay?.municipality || 'Municipality', pageWidth / 2, margin + 11, { align: 'center' });
  doc.text(barangay?.province || 'Province', pageWidth / 2, margin + 17, { align: 'center' });

  // Barangay name
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`BARANGAY ${barangay?.name?.toUpperCase() || 'BARANGAY'}`, pageWidth / 2, margin + 28, { align: 'center' });

  // Title
  doc.setFontSize(18);
  doc.text('BARANGAY BUSINESS CLEARANCE', pageWidth / 2, margin + 50, { align: 'center' });

  // Permit number
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Permit No.: ${permit.permit_number}`, pageWidth - margin - 10, margin + 60, { align: 'right' });

  // Business details
  const detailsStart = margin + 80;
  const labelWidth = 50;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Business Name:', margin + 10, detailsStart);
  doc.setFont('helvetica', 'normal');
  doc.text(business?.business_name || '', margin + 10 + labelWidth, detailsStart);

  doc.setFont('helvetica', 'bold');
  doc.text('Owner:', margin + 10, detailsStart + 10);
  doc.setFont('helvetica', 'normal');
  doc.text(business?.owner_name || '', margin + 10 + labelWidth, detailsStart + 10);

  doc.setFont('helvetica', 'bold');
  doc.text('Address:', margin + 10, detailsStart + 20);
  doc.setFont('helvetica', 'normal');
  doc.text(business?.address || '', margin + 10 + labelWidth, detailsStart + 20);

  doc.setFont('helvetica', 'bold');
  doc.text('Business Type:', margin + 10, detailsStart + 30);
  doc.setFont('helvetica', 'normal');
  doc.text(business?.business_type || '', margin + 10 + labelWidth, detailsStart + 30);

  doc.setFont('helvetica', 'bold');
  doc.text('Valid Until:', margin + 10, detailsStart + 40);
  doc.setFont('helvetica', 'normal');
  doc.text(permit.expiry_date ? format(new Date(permit.expiry_date), 'MMMM dd, yyyy') : '', margin + 10 + labelWidth, detailsStart + 40);

  // Certification text
  const certText = `This certifies that the above-named business establishment has complied with the requirements and is hereby granted this BARANGAY BUSINESS CLEARANCE in accordance with the existing barangay ordinances.`;
  
  doc.setFontSize(11);
  const splitText = doc.splitTextToSize(certText, pageWidth - (margin * 2) - 20);
  doc.text(splitText, margin + 10, detailsStart + 60);

  // Signature
  const sigY = pageHeight - margin - 50;
  doc.setFont('helvetica', 'bold');
  doc.text(barangay?.captain_name?.toUpperCase() || 'PUNONG BARANGAY', pageWidth - margin - 50, sigY, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text('Punong Barangay', pageWidth - margin - 50, sigY + 5, { align: 'center' });

  // OR Number
  doc.setFontSize(9);
  doc.text(`O.R. No.: ${permit.or_number || 'N/A'}`, margin + 10, pageHeight - margin - 20);
  doc.text(`Amount Paid: PHP ${parseFloat(permit.amount_paid || 0).toFixed(2)}`, margin + 10, pageHeight - margin - 15);

  return doc.output('arraybuffer');
};

// Generate Barangay ID
const generateBarangayID = async (resident, barangay) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [85.6, 53.98] // Standard ID card size
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Background
  doc.setFillColor(240, 240, 245);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Header
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, pageWidth, 12, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(6);
  doc.text('Republic of the Philippines', pageWidth / 2, 3, { align: 'center' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(`BARANGAY ${barangay?.name?.toUpperCase() || 'BARANGAY'}`, pageWidth / 2, 8, { align: 'center' });

  // Reset text color
  doc.setTextColor(0, 0, 0);

  // Photo placeholder
  doc.setFillColor(200, 200, 200);
  doc.rect(5, 15, 20, 25, 'F');
  doc.setFontSize(5);
  doc.text('PHOTO', 15, 28, { align: 'center' });

  // Resident info
  const fullName = `${resident.first_name} ${resident.middle_name ? resident.middle_name.charAt(0) + '. ' : ''}${resident.last_name}`;
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(fullName.toUpperCase(), 28, 20);

  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.text(`Address: ${resident.address}`, 28, 26);
  doc.text(`Birthday: ${format(new Date(resident.date_of_birth), 'MM/dd/yyyy')}`, 28, 30);
  doc.text(`Civil Status: ${resident.civil_status}`, 28, 34);
  doc.text(`Contact: ${resident.contact_number || 'N/A'}`, 28, 38);

  // Footer
  doc.setFontSize(5);
  doc.text(`Issued: ${format(new Date(), 'MM/dd/yyyy')}`, 5, 50);
  doc.text('NOT VALID WITHOUT SEAL', pageWidth - 5, 50, { align: 'right' });

  return doc.output('arraybuffer');
};

module.exports = {
  generateCertificate,
  generateBusinessPermit,
  generateBarangayID
};
