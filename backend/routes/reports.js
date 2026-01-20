const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { 
  Resident, Household, Document, Business, BusinessPermit, 
  Incident, Barangay, User, Official 
} = require('../models');
const { auth } = require('../middleware/auth');
const { barangayFilter, getQueryScope } = require('../middleware/barangayFilter');
const { checkRole, isStaff, isAdmin } = require('../middleware/roleCheck');
const ExcelJS = require('exceljs');

// Apply auth and barangay filter to all routes
router.use(auth);
router.use(barangayFilter);

// GET /api/reports/dashboard - Get dashboard statistics
router.get('/dashboard', isStaff, async (req, res) => {
  try {
    const queryScope = getQueryScope(req.user);
    const { sequelize } = require('../models');

    // Get counts
    const [
      totalResidents,
      totalHouseholds,
      totalBusinesses,
      pendingDocuments,
      pendingIncidents,
      activePermits,
      expiringPermits
    ] = await Promise.all([
      Resident.count({ where: { ...queryScope.where, status: 'active' } }),
      Household.count({ where: { ...queryScope.where, status: 'active' } }),
      Business.count({ where: { ...queryScope.where, status: 'active' } }),
      Document.count({ where: { ...queryScope.where, status: 'pending' } }),
      Incident.count({ where: { ...queryScope.where, status: 'pending' } }),
      BusinessPermit.count({ where: { ...queryScope.where, status: 'active' } }),
      BusinessPermit.count({
        where: {
          ...queryScope.where,
          status: 'active',
          expiry_date: {
            [Op.between]: [new Date(), new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)]
          }
        }
      })
    ]);

    // Get recent activity
    const recentDocuments = await Document.findAll({
      where: queryScope.where,
      include: [{ model: Resident, as: 'resident', attributes: ['first_name', 'last_name'] }],
      order: [['created_at', 'DESC']],
      limit: 5
    });

    const recentIncidents = await Incident.findAll({
      where: queryScope.where,
      order: [['created_at', 'DESC']],
      limit: 5
    });

    res.json({
      statistics: {
        totalResidents,
        totalHouseholds,
        totalBusinesses,
        pendingDocuments,
        pendingIncidents,
        activePermits,
        expiringPermits
      },
      recentActivity: {
        documents: recentDocuments,
        incidents: recentIncidents
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/reports/population - Population report
router.get('/population', isStaff, async (req, res) => {
  try {
    const queryScope = getQueryScope(req.user);
    const { sequelize } = require('../models');

    // Total count
    const total = await Resident.count({
      where: { ...queryScope.where, status: 'active' }
    });

    // Gender distribution
    const genderDistribution = await Resident.findAll({
      where: { ...queryScope.where, status: 'active' },
      attributes: [
        'gender',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['gender'],
      raw: true
    });

    // Transform to expected format
    const byGender = { male: 0, female: 0 };
    genderDistribution.forEach(item => {
      if (item.gender === 'male') byGender.male = parseInt(item.count) || 0;
      if (item.gender === 'female') byGender.female = parseInt(item.count) || 0;
    });

    // Civil status distribution
    const civilStatusDistribution = await Resident.findAll({
      where: { ...queryScope.where, status: 'active' },
      attributes: [
        'civil_status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['civil_status'],
      raw: true
    });

    // Transform to expected format
    const byCivilStatus = {};
    civilStatusDistribution.forEach(item => {
      byCivilStatus[item.civil_status] = parseInt(item.count) || 0;
    });

    // Age distribution
    const barangayId = req.barangayId || queryScope.where?.barangay_id || 0;
    let ageGroups = [];
    
    if (barangayId) {
      ageGroups = await sequelize.query(`
        SELECT 
          CASE 
            WHEN TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) < 18 THEN 'Minor (0-17)'
            WHEN TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) BETWEEN 18 AND 30 THEN 'Young Adult (18-30)'
            WHEN TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) BETWEEN 31 AND 45 THEN 'Adult (31-45)'
            WHEN TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) BETWEEN 46 AND 60 THEN 'Middle Age (46-60)'
            ELSE 'Senior (60+)'
          END as age_group,
          COUNT(*) as count
        FROM residents 
        WHERE barangay_id = :barangayId AND status = 'active'
        GROUP BY age_group
        ORDER BY age_group
      `, {
        replacements: { barangayId },
        type: sequelize.QueryTypes.SELECT
      });
    }

    // Transform to expected format
    const byAgeGroup = {};
    ageGroups.forEach(item => {
      byAgeGroup[item.age_group] = parseInt(item.count) || 0;
    });

    // Purok distribution
    const purokDistribution = await Resident.findAll({
      where: { ...queryScope.where, status: 'active' },
      attributes: [
        'zone_purok',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['zone_purok'],
      raw: true
    });

    const byPurok = {};
    purokDistribution.forEach(item => {
      if (item.zone_purok) {
        byPurok[item.zone_purok] = parseInt(item.count) || 0;
      }
    });

    // Special categories
    const specialCategories = await Resident.findAll({
      where: { ...queryScope.where, status: 'active' },
      attributes: [
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN voter_status = true THEN 1 ELSE 0 END")), 'voters'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN is_pwd = true THEN 1 ELSE 0 END")), 'pwd'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN is_senior_citizen = true THEN 1 ELSE 0 END")), 'senior_citizens'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN is_4ps_member = true THEN 1 ELSE 0 END")), 'fourps_members'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN is_solo_parent = true THEN 1 ELSE 0 END")), 'solo_parents']
      ],
      raw: true
    });

    const categories = specialCategories[0] || {};

    res.json({
      total,
      byGender,
      byAgeGroup,
      byCivilStatus,
      byPurok,
      voters: parseInt(categories.voters) || 0,
      pwd: parseInt(categories.pwd) || 0,
      seniorCitizens: parseInt(categories.senior_citizens) || 0,
      soloParents: parseInt(categories.solo_parents) || 0,
      fourpsMembers: parseInt(categories.fourps_members) || 0
    });
  } catch (error) {
    console.error('Population report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/reports/documents - Document statistics
router.get('/documents', isStaff, async (req, res) => {
  try {
    const queryScope = getQueryScope(req.user);
    const { sequelize } = require('../models');
    const { from, to } = req.query;

    const whereClause = { ...queryScope.where };

    if (from || to) {
      whereClause.created_at = {};
      if (from) whereClause.created_at[Op.gte] = new Date(from);
      if (to) whereClause.created_at[Op.lte] = new Date(to);
    }

    // Total count
    const total = await Document.count({ where: whereClause });

    // Total revenue
    const revenueResult = await Document.findAll({
      where: whereClause,
      attributes: [
        [sequelize.fn('SUM', sequelize.col('amount_paid')), 'total_revenue']
      ],
      raw: true
    });

    // By document type
    const byTypeResult = await Document.findAll({
      where: whereClause,
      attributes: [
        'document_type',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('amount_paid')), 'revenue']
      ],
      group: ['document_type'],
      raw: true
    });

    // Transform to expected format
    const byType = {};
    byTypeResult.forEach(item => {
      byType[item.document_type] = parseInt(item.count) || 0;
    });

    // By status
    const byStatusResult = await Document.findAll({
      where: whereClause,
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    // Transform to expected format
    const byStatus = {};
    byStatusResult.forEach(item => {
      byStatus[item.status] = parseInt(item.count) || 0;
    });

    // Monthly trend
    const barangayId = req.barangayId || queryScope.where?.barangay_id || 0;
    let monthlyTrend = [];
    
    if (barangayId) {
      monthlyTrend = await sequelize.query(`
        SELECT 
          DATE_FORMAT(created_at, '%Y-%m') as month,
          COUNT(*) as count,
          SUM(amount_paid) as revenue
        FROM documents 
        WHERE barangay_id = :barangayId
        ${from ? 'AND created_at >= :fromDate' : ''}
        ${to ? 'AND created_at <= :toDate' : ''}
        GROUP BY month
        ORDER BY month DESC
        LIMIT 12
      `, {
        replacements: { 
          barangayId,
          fromDate: from,
          toDate: to
        },
        type: sequelize.QueryTypes.SELECT
      });
    }

    res.json({
      total,
      byType,
      byStatus,
      revenue: parseFloat(revenueResult[0]?.total_revenue) || 0,
      monthlyTrend: monthlyTrend.map(item => ({
        month: item.month,
        count: parseInt(item.count) || 0,
        revenue: parseFloat(item.revenue) || 0
      }))
    });
  } catch (error) {
    console.error('Documents report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/reports/financial - Financial report
router.get('/financial', checkRole('admin', 'treasurer', 'captain', 'super_admin'), async (req, res) => {
  try {
    const queryScope = getQueryScope(req.user);
    const { sequelize } = require('../models');
    const { year } = req.query;

    const currentYear = year || new Date().getFullYear();
    const barangayId = req.barangayId || queryScope.where?.barangay_id || 0;

    // Document revenue
    const documentRevenue = await Document.findAll({
      where: {
        ...queryScope.where,
        status: 'released',
        issued_date: {
          [Op.gte]: new Date(currentYear, 0, 1),
          [Op.lt]: new Date(parseInt(currentYear) + 1, 0, 1)
        }
      },
      attributes: [
        [sequelize.fn('SUM', sequelize.col('amount_paid')), 'total']
      ],
      raw: true
    });

    // Business permit revenue
    const permitRevenue = await BusinessPermit.findAll({
      where: {
        ...queryScope.where,
        issued_date: {
          [Op.gte]: new Date(currentYear, 0, 1),
          [Op.lt]: new Date(parseInt(currentYear) + 1, 0, 1)
        }
      },
      attributes: [
        [sequelize.fn('SUM', sequelize.col('amount_paid')), 'total']
      ],
      raw: true
    });

    // Monthly breakdown
    let monthlyRevenue = [];
    if (barangayId) {
      monthlyRevenue = await sequelize.query(`
        SELECT 
          DATE_FORMAT(issued_date, '%Y-%m') as month,
          SUM(amount_paid) as amount
        FROM documents 
        WHERE barangay_id = :barangayId 
          AND status = 'released'
          AND YEAR(issued_date) = :year
        GROUP BY month
        ORDER BY month
      `, {
        replacements: { barangayId, year: currentYear },
        type: sequelize.QueryTypes.SELECT
      });
    }

    const documentFees = parseFloat(documentRevenue[0]?.total) || 0;
    const permitFees = parseFloat(permitRevenue[0]?.total) || 0;

    res.json({
      year: parseInt(currentYear),
      documentFees,
      permitFees,
      otherFees: 0,
      total: documentFees + permitFees,
      byMonth: monthlyRevenue.map(item => ({
        month: item.month,
        amount: parseFloat(item.amount) || 0
      }))
    });
  } catch (error) {
    console.error('Financial report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/reports/incidents - Incident statistics
router.get('/incidents', isStaff, async (req, res) => {
  try {
    const queryScope = getQueryScope(req.user);
    const { sequelize } = require('../models');
    const { from_date, to_date } = req.query;

    const whereClause = { ...queryScope.where };

    if (from_date || to_date) {
      whereClause.incident_date = {};
      if (from_date) whereClause.incident_date[Op.gte] = new Date(from_date);
      if (to_date) whereClause.incident_date[Op.lte] = new Date(to_date);
    }

    // By type
    const byType = await Incident.findAll({
      where: whereClause,
      attributes: [
        'incident_type',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['incident_type'],
      raw: true
    });

    // By status
    const byStatus = await Incident.findAll({
      where: whereClause,
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    // Monthly trend
    const monthlyTrend = await sequelize.query(`
      SELECT 
        DATE_FORMAT(incident_date, '%Y-%m') as month,
        COUNT(*) as count
      FROM incidents 
      WHERE barangay_id = :barangayId
      ${from_date ? 'AND incident_date >= :fromDate' : ''}
      ${to_date ? 'AND incident_date <= :toDate' : ''}
      GROUP BY month
      ORDER BY month DESC
      LIMIT 12
    `, {
      replacements: { 
        barangayId: req.barangayId || 0,
        fromDate: from_date,
        toDate: to_date
      },
      type: sequelize.QueryTypes.SELECT
    });

    res.json({
      byType,
      byStatus,
      monthlyTrend
    });
  } catch (error) {
    console.error('Incidents report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/reports/export/residents - Export residents to Excel
router.get('/export/residents', isAdmin, async (req, res) => {
  try {
    const queryScope = getQueryScope(req.user);

    const residents = await Resident.findAll({
      where: { ...queryScope.where, status: 'active' },
      include: [
        { model: Household, as: 'household', attributes: ['household_number'] },
        { model: Barangay, as: 'barangay', attributes: ['name'] }
      ],
      order: [['last_name', 'ASC'], ['first_name', 'ASC']]
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Residents');

    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Last Name', key: 'last_name', width: 20 },
      { header: 'First Name', key: 'first_name', width: 20 },
      { header: 'Middle Name', key: 'middle_name', width: 20 },
      { header: 'Date of Birth', key: 'date_of_birth', width: 15 },
      { header: 'Gender', key: 'gender', width: 10 },
      { header: 'Civil Status', key: 'civil_status', width: 15 },
      { header: 'Address', key: 'address', width: 40 },
      { header: 'Contact Number', key: 'contact_number', width: 15 },
      { header: 'Household #', key: 'household_number', width: 15 },
      { header: 'Voter', key: 'voter_status', width: 10 },
      { header: 'PWD', key: 'is_pwd', width: 10 },
      { header: 'Senior', key: 'is_senior_citizen', width: 10 }
    ];

    residents.forEach(resident => {
      worksheet.addRow({
        id: resident.id,
        last_name: resident.last_name,
        first_name: resident.first_name,
        middle_name: resident.middle_name,
        date_of_birth: resident.date_of_birth,
        gender: resident.gender,
        civil_status: resident.civil_status,
        address: resident.address,
        contact_number: resident.contact_number,
        household_number: resident.household?.household_number,
        voter_status: resident.voter_status ? 'Yes' : 'No',
        is_pwd: resident.is_pwd ? 'Yes' : 'No',
        is_senior_citizen: resident.is_senior_citizen ? 'Yes' : 'No'
      });
    });

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=residents_${new Date().toISOString().split('T')[0]}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export residents error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/reports/export/businesses - Export businesses to Excel
router.get('/export/businesses', isAdmin, async (req, res) => {
  try {
    const queryScope = getQueryScope(req.user);

    const businesses = await Business.findAll({
      where: queryScope.where,
      include: [
        { model: Barangay, as: 'barangay', attributes: ['name'] }
      ],
      order: [['business_name', 'ASC']]
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Businesses');

    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Business Name', key: 'business_name', width: 30 },
      { header: 'Trade Name', key: 'trade_name', width: 25 },
      { header: 'Owner', key: 'owner_name', width: 25 },
      { header: 'Business Type', key: 'business_type', width: 20 },
      { header: 'Nature', key: 'business_nature', width: 20 },
      { header: 'Address', key: 'address', width: 40 },
      { header: 'Contact', key: 'contact_number', width: 15 },
      { header: 'DTI Reg', key: 'dti_registration', width: 15 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Date Started', key: 'date_started', width: 15 }
    ];

    businesses.forEach(business => {
      worksheet.addRow({
        id: business.id,
        business_name: business.business_name,
        trade_name: business.trade_name,
        owner_name: business.owner_name,
        business_type: business.business_type,
        business_nature: business.business_nature,
        address: business.address,
        contact_number: business.contact_number,
        dti_registration: business.dti_registration,
        status: business.status,
        date_started: business.date_started
      });
    });

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=businesses_${new Date().toISOString().split('T')[0]}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export businesses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
