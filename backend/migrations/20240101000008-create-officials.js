'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('officials', {
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
        allowNull: true,
        references: {
          model: 'residents',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      first_name: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      last_name: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      middle_name: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      suffix: {
        type: Sequelize.STRING(10),
        allowNull: true
      },
      position: {
        type: Sequelize.ENUM('Captain', 'Kagawad', 'Secretary', 'Treasurer', 'SK Chairman', 'SK Kagawad', 'Tanod'),
        allowNull: false
      },
      committee: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Committee chairmanship if applicable'
      },
      term_start: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      term_end: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      contact_number: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      email: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      photo: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      order: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: 'Display order for Kagawads'
      },
      is_current: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive', 'resigned', 'suspended'),
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
    await queryInterface.addIndex('officials', ['barangay_id']);
    await queryInterface.addIndex('officials', ['resident_id']);
    await queryInterface.addIndex('officials', ['position']);
    await queryInterface.addIndex('officials', ['is_current']);
    await queryInterface.addIndex('officials', ['status']);
    await queryInterface.addIndex('officials', ['term_start', 'term_end']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('officials');
  }
};
