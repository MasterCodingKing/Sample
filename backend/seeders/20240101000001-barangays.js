'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('barangays', [
      {
        name: 'Barangay Luta Sur',
        code: 'LUTA-SUR',
        city: 'Malvar',
        province: 'Batangas',
        region: 'Region IV-A (CALABARZON)',
        zip_code: '4233',
        address: 'Luta Sur, Malvar, Batangas',
        contact_number: null,
        email: null,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Barangay Luta Norte',
        code: 'LUTA-NORTE',
        city: 'Malvar',
        province: 'Batangas',
        region: 'Region IV-A (CALABARZON)',
        zip_code: '4233',
        address: 'Luta Norte, Malvar, Batangas',
        contact_number: null,
        email: null,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Barangay San Pioquinto',
        code: 'SAN-PIO',
        city: 'Malvar',
        province: 'Batangas',
        region: 'Region IV-A (CALABARZON)',
        zip_code: '4233',
        address: 'San Pioquinto, Malvar, Batangas',
        contact_number: null,
        email: null,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Barangay San Gregorio',
        code: 'SAN-GREG',
        city: 'Malvar',
        province: 'Batangas',
        region: 'Region IV-A (CALABARZON)',
        zip_code: '4233',
        address: 'San Gregorio, Malvar, Batangas',
        contact_number: null,
        email: null,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Barangay Santiago',
        code: 'SANTIAGO',
        city: 'Malvar',
        province: 'Batangas',
        region: 'Region IV-A (CALABARZON)',
        zip_code: '4233',
        address: 'Santiago, Malvar, Batangas',
        contact_number: null,
        email: null,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('barangays', null, {});
  }
};
