'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('events', {
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
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      event_type: {
        type: Sequelize.ENUM('meeting', 'assembly', 'fiesta', 'medical_mission', 'clean_up_drive', 'sports', 'seminar', 'outreach', 'other'),
        defaultValue: 'meeting'
      },
      start_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      end_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      all_day: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      location: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      venue_details: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      organizer: {
        type: Sequelize.STRING(200),
        allowNull: true
      },
      contact_person: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      contact_number: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      max_participants: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      registration_required: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      registration_deadline: {
        type: Sequelize.DATE,
        allowNull: true
      },
      image: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      attachments: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'JSON array of file paths'
      },
      is_public: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      color: {
        type: Sequelize.STRING(20),
        allowNull: true,
        comment: 'Color for calendar display'
      },
      status: {
        type: Sequelize.ENUM('upcoming', 'ongoing', 'completed', 'cancelled', 'postponed'),
        defaultValue: 'upcoming'
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
    await queryInterface.addIndex('events', ['barangay_id']);
    await queryInterface.addIndex('events', ['created_by']);
    await queryInterface.addIndex('events', ['event_type']);
    await queryInterface.addIndex('events', ['start_date']);
    await queryInterface.addIndex('events', ['end_date']);
    await queryInterface.addIndex('events', ['status']);
    await queryInterface.addIndex('events', ['is_public']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('events');
  }
};
