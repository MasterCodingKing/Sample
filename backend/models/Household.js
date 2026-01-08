'use strict';

module.exports = (sequelize, DataTypes) => {
  const Household = sequelize.define('Household', {
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
    household_number: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    head_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'residents',
        key: 'id'
      }
    },
    address: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    zone_purok: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    housing_type: {
      type: DataTypes.ENUM('owned', 'rented', 'shared', 'informal_settler'),
      defaultValue: 'owned'
    },
    housing_condition: {
      type: DataTypes.ENUM('good', 'fair', 'poor', 'dilapidated'),
      defaultValue: 'good'
    },
    lot_ownership: {
      type: DataTypes.ENUM('owned', 'rented', 'government', 'private'),
      defaultValue: 'owned'
    },
    economic_status: {
      type: DataTypes.ENUM('above_poverty', 'below_poverty', 'indigent'),
      defaultValue: 'above_poverty'
    },
    has_electricity: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    has_water_supply: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    water_source: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    toilet_type: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    garbage_disposal: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    monthly_income: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    income_source: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    total_members: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active'
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'households',
    timestamps: true,
    underscored: true
  });

  Household.associate = function(models) {
    Household.belongsTo(models.Barangay, { foreignKey: 'barangay_id', as: 'barangay' });
    Household.belongsTo(models.Resident, { foreignKey: 'head_id', as: 'head' });
    Household.hasMany(models.Resident, { foreignKey: 'household_id', as: 'members' });
  };

  return Household;
};
