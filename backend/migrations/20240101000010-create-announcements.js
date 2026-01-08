'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('announcements', {
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
      content: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      excerpt: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      category: {
        type: Sequelize.ENUM('general', 'health', 'education', 'safety', 'environment', 'events', 'emergency', 'advisory'),
        defaultValue: 'general'
      },
      priority: {
        type: Sequelize.ENUM('low', 'normal', 'high', 'urgent'),
        defaultValue: 'normal'
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
        defaultValue: true,
        comment: 'If true, visible to non-logged in users'
      },
      is_pinned: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      publish_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      expiry_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      views: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      status: {
        type: Sequelize.ENUM('draft', 'published', 'archived'),
        defaultValue: 'draft'
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
    await queryInterface.addIndex('announcements', ['barangay_id']);
    await queryInterface.addIndex('announcements', ['created_by']);
    await queryInterface.addIndex('announcements', ['category']);
    await queryInterface.addIndex('announcements', ['status']);
    await queryInterface.addIndex('announcements', ['is_public']);
    await queryInterface.addIndex('announcements', ['is_pinned']);
    await queryInterface.addIndex('announcements', ['publish_date']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('announcements');
  }
};
