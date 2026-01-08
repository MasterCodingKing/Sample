'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('barangays', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      code: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true
      },
      city: {
        type: Sequelize.STRING(100),
        allowNull: false,
        defaultValue: 'Malvar'
      },
      province: {
        type: Sequelize.STRING(100),
        allowNull: false,
        defaultValue: 'Batangas'
      },
      region: {
        type: Sequelize.STRING(100),
        allowNull: false,
        defaultValue: 'Region IV-A (CALABARZON)'
      },
      zip_code: {
        type: Sequelize.STRING(10),
        allowNull: true
      },
      address: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      contact_number: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      email: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      logo: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive'),
        defaultValue: 'active'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Add index
    await queryInterface.addIndex('barangays', ['code']);
    await queryInterface.addIndex('barangays', ['status']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('barangays');
  }
};
