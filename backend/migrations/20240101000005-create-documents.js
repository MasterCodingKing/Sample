'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('documents', {
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
      resident_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'residents',
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
      document_type: {
        type: Sequelize.ENUM(
          'barangay_clearance',
          'certificate_of_residency',
          'certificate_of_indigency',
          'business_clearance',
          'barangay_id',
          'cedula',
          'first_time_job_seeker',
          'good_moral_certificate',
          'lot_ownership',
          'travel_permit',
          'other'
        ),
        allowNull: false
      },
      control_number: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      purpose: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      or_number: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0.00
      },
      status: {
        type: Sequelize.ENUM('pending', 'processing', 'ready', 'released', 'rejected', 'cancelled'),
        defaultValue: 'pending'
      },
      rejection_reason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      valid_until: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      released_at: {
        type: Sequelize.DATE,
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
    await queryInterface.addIndex('documents', ['barangay_id']);
    await queryInterface.addIndex('documents', ['resident_id']);
    await queryInterface.addIndex('documents', ['processed_by']);
    await queryInterface.addIndex('documents', ['control_number']);
    await queryInterface.addIndex('documents', ['document_type']);
    await queryInterface.addIndex('documents', ['status']);
    
    // Unique control number per barangay
    await queryInterface.addIndex('documents', ['barangay_id', 'control_number'], {
      unique: true,
      name: 'unique_control_number_per_barangay'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('documents');
  }
};
