'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      barangay_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'barangays',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      email: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      password: {
        type: Sequelize.STRING(255),
        allowNull: false
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
      role: {
        type: Sequelize.ENUM('super_admin', 'admin', 'captain', 'secretary', 'treasurer', 'staff', 'resident'),
        defaultValue: 'resident'
      },
      phone: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      avatar: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive', 'suspended'),
        defaultValue: 'active'
      },
      email_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      email_verified_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      verification_token: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      reset_token: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      reset_token_expires: {
        type: Sequelize.DATE,
        allowNull: true
      },
      refresh_token: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      last_login: {
        type: Sequelize.DATE,
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
    await queryInterface.addIndex('users', ['barangay_id']);
    await queryInterface.addIndex('users', ['email']);
    await queryInterface.addIndex('users', ['role']);
    await queryInterface.addIndex('users', ['status']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('users');
  }
};
