'use strict';

module.exports = (sequelize, DataTypes) => {
  const Barangay = sequelize.define('Barangay', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    address: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    municipality: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    province: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    contact_number: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        isEmail: true
      }
    },
    logo_url: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    captain_name: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'barangays',
    timestamps: true,
    underscored: true
  });

  Barangay.associate = function(models) {
    Barangay.hasMany(models.User, { foreignKey: 'barangay_id', as: 'users' });
    Barangay.hasMany(models.Resident, { foreignKey: 'barangay_id', as: 'residents' });
    Barangay.hasMany(models.Household, { foreignKey: 'barangay_id', as: 'households' });
    Barangay.hasMany(models.Document, { foreignKey: 'barangay_id', as: 'documents' });
    Barangay.hasMany(models.Official, { foreignKey: 'barangay_id', as: 'officials' });
    Barangay.hasMany(models.Incident, { foreignKey: 'barangay_id', as: 'incidents' });
    Barangay.hasMany(models.Business, { foreignKey: 'barangay_id', as: 'businesses' });
    Barangay.hasMany(models.BusinessPermit, { foreignKey: 'barangay_id', as: 'businessPermits' });
    Barangay.hasMany(models.Announcement, { foreignKey: 'barangay_id', as: 'announcements' });
    Barangay.hasMany(models.Event, { foreignKey: 'barangay_id', as: 'events' });
  };

  return Barangay;
};
