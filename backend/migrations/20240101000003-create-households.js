'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('households', {
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
      household_number: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      address: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      purok: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      zone: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      housing_type: {
        type: Sequelize.ENUM('owned', 'rented', 'shared', 'informal_settler'),
        defaultValue: 'owned'
      },
      house_condition: {
        type: Sequelize.ENUM('good', 'fair', 'poor', 'dilapidated'),
        defaultValue: 'good'
      },
      toilet_type: {
        type: Sequelize.ENUM('water_sealed', 'pit', 'none'),
        defaultValue: 'water_sealed'
      },
      water_source: {
        type: Sequelize.ENUM('piped', 'well', 'spring', 'other'),
        defaultValue: 'piped'
      },
      electricity: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      monthly_income: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true
      },
      income_source: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      is_4ps_beneficiary: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      notes: {
        type: Sequelize.TEXT,
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

    // Add indexes
    await queryInterface.addIndex('households', ['barangay_id']);
    await queryInterface.addIndex('households', ['household_number']);
    await queryInterface.addIndex('households', ['purok']);
    await queryInterface.addIndex('households', ['status']);
    
    // Add unique constraint
    await queryInterface.addIndex('households', ['barangay_id', 'household_number'], {
      unique: true,
      name: 'unique_household_per_barangay'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('households');
  }
};
