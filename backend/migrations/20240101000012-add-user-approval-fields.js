'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add approval_status column
    await queryInterface.addColumn('users', 'approval_status', {
      type: Sequelize.ENUM('pending', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'approved',
      after: 'status'
    });

    // Add is_approved column
    await queryInterface.addColumn('users', 'is_approved', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      after: 'approval_status'
    });

    // Set existing users to approved
    await queryInterface.sequelize.query(`
      UPDATE users 
      SET approval_status = 'approved', is_approved = true 
      WHERE approval_status IS NULL OR is_approved IS NULL
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('users', 'approval_status');
    await queryInterface.removeColumn('users', 'is_approved');
  }
};
