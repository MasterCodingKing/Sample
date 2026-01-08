'use strict';

module.exports = (sequelize, DataTypes) => {
  const Incident = sequelize.define('Incident', {
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
    blotter_number: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true
    },
    incident_type: {
      type: DataTypes.ENUM(
        'dispute',
        'theft',
        'assault',
        'vandalism',
        'noise_complaint',
        'domestic_violence',
        'trespassing',
        'harassment',
        'traffic_incident',
        'property_damage',
        'other'
      ),
      allowNull: false
    },
    incident_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    reported_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    location: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    complainant_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'residents',
        key: 'id'
      }
    },
    complainant_name: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    complainant_contact: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    complainant_address: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    respondent_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'residents',
        key: 'id'
      }
    },
    respondent_name: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    respondent_contact: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    respondent_address: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    witnesses: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('pending', 'under_investigation', 'mediation', 'settled', 'escalated', 'dismissed', 'closed'),
      defaultValue: 'pending'
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
      defaultValue: 'medium'
    },
    resolution: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    settlement_agreement: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    settled_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    hearing_dates: {
      type: DataTypes.JSON,
      allowNull: true
    },
    assigned_to: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    attachments: {
      type: DataTypes.JSON,
      allowNull: true
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'incidents',
    timestamps: true,
    underscored: true
  });

  Incident.associate = function(models) {
    Incident.belongsTo(models.Barangay, { foreignKey: 'barangay_id', as: 'barangay' });
    Incident.belongsTo(models.Resident, { foreignKey: 'complainant_id', as: 'complainant' });
    Incident.belongsTo(models.Resident, { foreignKey: 'respondent_id', as: 'respondent' });
    Incident.belongsTo(models.User, { foreignKey: 'assigned_to', as: 'assignee' });
    Incident.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });
  };

  // Generate blotter number
  Incident.generateBlotterNumber = async function(barangayId) {
    const date = new Date();
    const year = date.getFullYear();
    
    const count = await Incident.count({
      where: {
        barangay_id: barangayId,
        created_at: {
          [sequelize.Sequelize.Op.gte]: new Date(year, 0, 1),
          [sequelize.Sequelize.Op.lt]: new Date(year + 1, 0, 1)
        }
      }
    });
    
    return `BLT-${barangayId}-${year}-${String(count + 1).padStart(5, '0')}`;
  };

  return Incident;
};
