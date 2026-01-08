'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('businesses', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      barangay_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'barangays',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      owner_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'residents',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      business_name: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      trade_name: {
        type: Sequelize.STRING(200),
        allowNull: true
      },
      business_type: {
        type: Sequelize.ENUM('sole_proprietorship', 'partnership', 'corporation', 'cooperative'),
        defaultValue: 'sole_proprietorship'
      },
      business_nature: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      business_category: {
        type: Sequelize.ENUM('micro', 'small', 'medium', 'large'),
        defaultValue: 'micro'
      },
      dti_registration: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      sec_registration: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      bir_tin: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      address: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      purok: {
        type: Sequelize.STRING(50),
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
      floor_area: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Floor area in square meters'
      },
      capital: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true
      },
      gross_sales: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true
      },
      employees_count: {
        type: Sequelize.INTEGER,
        defaultValue: 1
      },
      date_established: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('active', 'closed', 'suspended'),
        defaultValue: 'active'
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
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

    // Add indexes
    await queryInterface.addIndex('businesses', ['barangay_id']);
    await queryInterface.addIndex('businesses', ['owner_id']);
    await queryInterface.addIndex('businesses', ['business_name']);
    await queryInterface.addIndex('businesses', ['status']);
    await queryInterface.addIndex('businesses', ['purok']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('businesses');
  }
};
