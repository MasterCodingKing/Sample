'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('incidents', {
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
      complainant_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'residents',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      respondent_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'residents',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      recorded_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      blotter_number: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      incident_type: {
        type: Sequelize.ENUM(
          'physical_assault',
          'verbal_abuse',
          'property_dispute',
          'noise_complaint',
          'domestic_violence',
          'theft',
          'trespassing',
          'public_disturbance',
          'animal_complaint',
          'traffic_incident',
          'other'
        ),
        allowNull: false
      },
      incident_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      incident_time: {
        type: Sequelize.TIME,
        allowNull: true
      },
      incident_location: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      complainant_name: {
        type: Sequelize.STRING(200),
        allowNull: false,
        comment: 'For non-resident complainants'
      },
      complainant_address: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      complainant_contact: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      respondent_name: {
        type: Sequelize.STRING(200),
        allowNull: true
      },
      respondent_address: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      respondent_contact: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      narrative: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Detailed account of the incident'
      },
      action_taken: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      hearing_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      resolution: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      resolution_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('reported', 'under_investigation', 'scheduled_hearing', 'mediation', 'resolved', 'escalated', 'dismissed'),
        defaultValue: 'reported'
      },
      priority: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'urgent'),
        defaultValue: 'medium'
      },
      witnesses: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'JSON array of witness names'
      },
      attachments: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'JSON array of file paths'
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
    await queryInterface.addIndex('incidents', ['barangay_id']);
    await queryInterface.addIndex('incidents', ['complainant_id']);
    await queryInterface.addIndex('incidents', ['respondent_id']);
    await queryInterface.addIndex('incidents', ['recorded_by']);
    await queryInterface.addIndex('incidents', ['blotter_number']);
    await queryInterface.addIndex('incidents', ['incident_type']);
    await queryInterface.addIndex('incidents', ['incident_date']);
    await queryInterface.addIndex('incidents', ['status']);
    await queryInterface.addIndex('incidents', ['priority']);
    
    // Unique blotter number per barangay
    await queryInterface.addIndex('incidents', ['barangay_id', 'blotter_number'], {
      unique: true,
      name: 'unique_blotter_number_per_barangay'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('incidents');
  }
};
