'use strict';

const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    barangay_id: {
      type: DataTypes.INTEGER,
      allowNull: true, // NULL for Super Admin
      references: {
        model: 'barangays',
        key: 'id'
      }
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('super_admin', 'admin', 'captain', 'secretary', 'treasurer', 'staff', 'resident'),
      allowNull: false,
      defaultValue: 'staff'
    },
    first_name: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    last_name: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    middle_name: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    avatar: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'suspended'),
      defaultValue: 'active'
    },
    approval_status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'approved', // Default approved for admin/staff, pending for resident self-registration
      allowNull: false
    },
    is_approved: {
      type: DataTypes.BOOLEAN,
      defaultValue: true, // Default true for admin/staff, false for resident self-registration
      allowNull: false
    },
    email_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    email_verified_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    verification_token: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    reset_token: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    reset_token_expires: {
      type: DataTypes.DATE,
      allowNull: true
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: true
    },
    refresh_token: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'users',
    timestamps: true,
    underscored: true
  });

  User.prototype.validatePassword = async function(password) {
    return bcrypt.compare(password, this.password);
  };

  User.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    delete values.password;
    delete values.refresh_token;
    delete values.verification_token;
    delete values.reset_token;
    delete values.reset_token_expires;
    return values;
  };

  User.associate = function(models) {
    User.belongsTo(models.Barangay, { foreignKey: 'barangay_id', as: 'barangay' });
  };

  return User;
};
