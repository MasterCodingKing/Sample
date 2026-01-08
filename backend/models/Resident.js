'use strict';

module.exports = (sequelize, DataTypes) => {
  const Resident = sequelize.define('Resident', {
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
    household_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'households',
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
    date_of_birth: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    place_of_birth: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    gender: {
      type: DataTypes.ENUM('male', 'female', 'other'),
      allowNull: false
    },
    civil_status: {
      type: DataTypes.ENUM('single', 'married', 'widowed', 'separated', 'divorced'),
      allowNull: false,
      defaultValue: 'single'
    },
    nationality: {
      type: DataTypes.STRING(50),
      defaultValue: 'Filipino'
    },
    religion: {
      type: DataTypes.STRING(50),
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
    address: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    zone_purok: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    occupation: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    monthly_income: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    education_level: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    voter_status: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    is_pwd: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    pwd_type: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    is_senior_citizen: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    is_4ps_member: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    is_solo_parent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    blood_type: {
      type: DataTypes.STRING(5),
      allowNull: true
    },
    photo_url: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    id_type: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    id_number: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    emergency_contact_name: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    emergency_contact_number: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    emergency_contact_relationship: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    residency_status: {
      type: DataTypes.ENUM('permanent', 'temporary', 'transient'),
      defaultValue: 'permanent'
    },
    years_of_residency: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'deceased', 'transferred'),
      defaultValue: 'active'
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'residents',
    timestamps: true,
    underscored: true
  });

  Resident.prototype.getFullName = function() {
    let name = `${this.first_name}`;
    if (this.middle_name) name += ` ${this.middle_name}`;
    name += ` ${this.last_name}`;
    if (this.suffix) name += ` ${this.suffix}`;
    return name;
  };

  Resident.associate = function(models) {
    Resident.belongsTo(models.Barangay, { foreignKey: 'barangay_id', as: 'barangay' });
    Resident.belongsTo(models.Household, { foreignKey: 'household_id', as: 'household' });
    Resident.hasMany(models.Document, { foreignKey: 'resident_id', as: 'documents' });
    Resident.hasMany(models.Business, { foreignKey: 'owner_id', as: 'businesses' });
  };

  return Resident;
};
