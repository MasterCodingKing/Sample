'use strict';

module.exports = (sequelize, DataTypes) => {
  const Official = sequelize.define('Official', {
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
    resident_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'residents',
        key: 'id'
      }
    },
    first_name: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    middle_name: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    last_name: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    suffix: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    position: {
      type: DataTypes.ENUM(
        'captain',
        'kagawad',
        'secretary',
        'treasurer',
        'sk_chairman',
        'sk_kagawad',
        'tanod',
        'lupon',
        'bhw',
        'other'
      ),
      allowNull: false
    },
    committee: {
      type: DataTypes.STRING(100),
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
    address: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    photo_url: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    term_start: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    term_end: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    oath_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'suspended', 'resigned', 'terminated'),
      defaultValue: 'active'
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'officials',
    timestamps: true,
    underscored: true
  });

  Official.prototype.getFullName = function() {
    let name = `${this.first_name}`;
    if (this.middle_name) name += ` ${this.middle_name}`;
    name += ` ${this.last_name}`;
    if (this.suffix) name += ` ${this.suffix}`;
    return name;
  };

  Official.associate = function(models) {
    Official.belongsTo(models.Barangay, { foreignKey: 'barangay_id', as: 'barangay' });
    Official.belongsTo(models.Resident, { foreignKey: 'resident_id', as: 'resident' });
  };

  return Official;
};
