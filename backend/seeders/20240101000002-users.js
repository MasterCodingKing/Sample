'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const hashedPassword = await bcrypt.hash('SuperAdmin@123', 12);
    
    await queryInterface.bulkInsert('users', [
      {
        barangay_id: null, // Super admin has access to all barangays
        email: 'superadmin@barangay.gov.ph',
        password: hashedPassword,
        first_name: 'Super',
        last_name: 'Admin',
        middle_name: null,
        role: 'super_admin',
        phone: null,
        avatar: null,
        status: 'active',
        email_verified: true,
        email_verified_at: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});

    // Create admin users for each barangay
    const barangays = await queryInterface.sequelize.query(
      'SELECT id, code FROM barangays',
      { type: Sequelize.QueryTypes.SELECT }
    );

    const adminUsers = barangays.map((brgy, index) => ({
      barangay_id: brgy.id,
      email: `admin.${brgy.code.toLowerCase()}@barangay.gov.ph`,
      password: hashedPassword,
      first_name: 'Admin',
      last_name: brgy.code.replace('-', ' '),
      middle_name: null,
      role: 'admin',
      phone: null,
      avatar: null,
      status: 'active',
      email_verified: true,
      email_verified_at: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    }));

    await queryInterface.bulkInsert('users', adminUsers, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('users', null, {});
  }
};
