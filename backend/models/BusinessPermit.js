'use strict';

module.exports = (sequelize, DataTypes) => {
  const BusinessPermit = sequelize.define('BusinessPermit', {
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
    business_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'businesses',
        key: 'id'
      }
    },
    permit_number: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true
    },
    permit_type: {
      type: DataTypes.ENUM('new', 'renewal'),
      defaultValue: 'new'
    },
    application_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    issued_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    expiry_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    amount_paid: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    or_number: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    payment_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('pending', 'processing', 'approved', 'released', 'expired', 'cancelled', 'rejected'),
      defaultValue: 'pending'
    },
    issued_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    approved_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    requirements_submitted: {
      type: DataTypes.JSON,
      allowNull: true
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'business_permits',
    timestamps: true,
    underscored: true
  });

  BusinessPermit.associate = function(models) {
    BusinessPermit.belongsTo(models.Barangay, { foreignKey: 'barangay_id', as: 'barangay' });
    BusinessPermit.belongsTo(models.Business, { foreignKey: 'business_id', as: 'business' });
    BusinessPermit.belongsTo(models.User, { foreignKey: 'issued_by', as: 'issuer' });
    BusinessPermit.belongsTo(models.User, { foreignKey: 'approved_by', as: 'approver' });
  };

  // Generate permit number
  BusinessPermit.generatePermitNumber = async function(barangayId) {
    const date = new Date();
    const year = date.getFullYear();
    
    const count = await BusinessPermit.count({
      where: {
        barangay_id: barangayId,
        created_at: {
          [sequelize.Sequelize.Op.gte]: new Date(year, 0, 1),
          [sequelize.Sequelize.Op.lt]: new Date(year + 1, 0, 1)
        }
      }
    });
    
    return `BP-${barangayId}-${year}-${String(count + 1).padStart(5, '0')}`;
  };

  return BusinessPermit;
};
