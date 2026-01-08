'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('residents', {
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
      household_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'households',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
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
      birthdate: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      birthplace: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      gender: {
        type: Sequelize.ENUM('Male', 'Female'),
        allowNull: false
      },
      civil_status: {
        type: Sequelize.ENUM('Single', 'Married', 'Widowed', 'Separated', 'Divorced', 'Annulled'),
        defaultValue: 'Single'
      },
      nationality: {
        type: Sequelize.STRING(50),
        defaultValue: 'Filipino'
      },
      religion: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      blood_type: {
        type: Sequelize.ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'),
        defaultValue: 'Unknown'
      },
      contact_number: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      email: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      address: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      purok: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      photo: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      education: {
        type: Sequelize.ENUM('Elementary', 'High School', 'Vocational', 'College', 'Post Graduate', 'None'),
        allowNull: true
      },
      occupation: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      monthly_income: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true
      },
      voter_status: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      precinct_number: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      is_household_head: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      relationship_to_head: {
        type: Sequelize.ENUM('Head', 'Spouse', 'Son', 'Daughter', 'Father', 'Mother', 'Brother', 'Sister', 'Grandparent', 'Grandchild', 'Other'),
        defaultValue: 'Head'
      },
      philhealth_number: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      sss_number: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      tin_number: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      is_pwd: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      pwd_type: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      is_senior_citizen: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      is_solo_parent: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      is_ofw: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      ofw_country: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      residency_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      residency_type: {
        type: Sequelize.ENUM('permanent', 'temporary'),
        defaultValue: 'permanent'
      },
      status: {
        type: Sequelize.ENUM('active', 'deceased', 'transferred', 'inactive'),
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
    await queryInterface.addIndex('residents', ['barangay_id']);
    await queryInterface.addIndex('residents', ['household_id']);
    await queryInterface.addIndex('residents', ['user_id']);
    await queryInterface.addIndex('residents', ['last_name', 'first_name']);
    await queryInterface.addIndex('residents', ['status']);
    await queryInterface.addIndex('residents', ['purok']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('residents');
  }
};
