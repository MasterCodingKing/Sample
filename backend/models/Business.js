'use strict';

module.exports = (sequelize, DataTypes) => {
  const Business = sequelize.define('Business', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    barangay_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'barangays',
        key: 'id'
      }
    },
    business_name: {
      type: DataTypes.STRING(150),
      allowNull: false
    },
    trade_name: {
      type: DataTypes.STRING(150),
      allowNull: true
    },
    owner_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    owner_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'residents',
        key: 'id'
      }
    },
    business_type: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    business_nature: {
      type: DataTypes.ENUM('single_proprietorship', 'partnership', 'corporation', 'cooperative'),
      defaultValue: 'single_proprietorship'
    },
    dti_registration: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    sec_registration: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    tin_number: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    address: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    zone_purok: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    contact_number: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    floor_area: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    employees_count: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    capitalization: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true
    },
    gross_sales: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true
    },
    date_started: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'closed', 'suspended'),
      defaultValue: 'active'
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'businesses',
    timestamps: true,
    underscored: true
  });

  Business.associate = function(models) {
    Business.belongsTo(models.Barangay, { foreignKey: 'barangay_id', as: 'barangay' });
    Business.belongsTo(models.Resident, { foreignKey: 'owner_id', as: 'owner' });
    Business.hasMany(models.BusinessPermit, { foreignKey: 'business_id', as: 'permits' });
  };

  return Business;
};
