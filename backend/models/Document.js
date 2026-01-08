'use strict';

module.exports = (sequelize, DataTypes) => {
  const Document = sequelize.define('Document', {
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
      allowNull: false,
      references: {
        model: 'residents',
        key: 'id'
      }
    },
    document_type: {
      type: DataTypes.ENUM(
        'barangay_clearance',
        'certificate_of_residency',
        'certificate_of_indigency',
        'business_permit',
        'good_moral_character',
        'certificate_of_no_income',
        'certificate_of_late_registration',
        'barangay_id',
        'other'
      ),
      allowNull: false
    },
    purpose: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    control_number: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true
    },
    or_number: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    amount_paid: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    issued_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    issued_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    valid_until: {
      type: DataTypes.DATE,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('pending', 'processing', 'ready', 'released', 'cancelled', 'rejected'),
      defaultValue: 'pending'
    },
    rejection_reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    document_url: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    requested_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    request_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    pickup_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'documents',
    timestamps: true,
    underscored: true
  });

  Document.associate = function(models) {
    Document.belongsTo(models.Barangay, { foreignKey: 'barangay_id', as: 'barangay' });
    Document.belongsTo(models.Resident, { foreignKey: 'resident_id', as: 'resident' });
    Document.belongsTo(models.User, { foreignKey: 'issued_by', as: 'issuer' });
    Document.belongsTo(models.User, { foreignKey: 'requested_by', as: 'requester' });
  };

  // Generate control number
  Document.generateControlNumber = async function(barangayId, documentType) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const prefix = documentType.substring(0, 3).toUpperCase();
    
    const count = await Document.count({
      where: {
        barangay_id: barangayId,
        created_at: {
          [sequelize.Sequelize.Op.gte]: new Date(year, 0, 1),
          [sequelize.Sequelize.Op.lt]: new Date(year + 1, 0, 1)
        }
      }
    });
    
    return `${prefix}-${barangayId}-${year}${month}-${String(count + 1).padStart(5, '0')}`;
  };

  return Document;
};
