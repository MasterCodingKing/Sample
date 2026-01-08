'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('business_permits', {
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
      business_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'businesses',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      processed_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      permit_number: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      permit_type: {
        type: Sequelize.ENUM('new', 'renewal'),
        defaultValue: 'new'
      },
      year: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      or_number: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      permit_fee: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0.00
      },
      mayors_fee: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0.00
      },
      sanitary_fee: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0.00
      },
      other_fees: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0.00
      },
      total_amount: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0.00
      },
      issue_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      expiry_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'released', 'expired', 'rejected', 'cancelled'),
        defaultValue: 'pending'
      },
      rejection_reason: {
        type: Sequelize.TEXT,
        allowNull: true
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
    await queryInterface.addIndex('business_permits', ['barangay_id']);
    await queryInterface.addIndex('business_permits', ['business_id']);
    await queryInterface.addIndex('business_permits', ['processed_by']);
    await queryInterface.addIndex('business_permits', ['permit_number']);
    await queryInterface.addIndex('business_permits', ['year']);
    await queryInterface.addIndex('business_permits', ['status']);
    await queryInterface.addIndex('business_permits', ['expiry_date']);
    
    // Unique permit number per barangay
    await queryInterface.addIndex('business_permits', ['barangay_id', 'permit_number'], {
      unique: true,
      name: 'unique_permit_number_per_barangay'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('business_permits');
  }
};
