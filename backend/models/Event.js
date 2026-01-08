'use strict';

module.exports = (sequelize, DataTypes) => {
  const Event = sequelize.define('Event', {
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
    title: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    category: {
      type: DataTypes.ENUM('meeting', 'assembly', 'health', 'sports', 'cultural', 'cleanup', 'seminar', 'other'),
      defaultValue: 'other'
    },
    event_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    start_time: {
      type: DataTypes.TIME,
      allowNull: true
    },
    end_time: {
      type: DataTypes.TIME,
      allowNull: true
    },
    location: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    venue_details: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    organizer: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    contact_person: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    contact_number: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    max_participants: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    current_participants: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    is_public: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    requires_registration: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    image_url: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    attachments: {
      type: DataTypes.JSON,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('upcoming', 'ongoing', 'completed', 'cancelled', 'postponed'),
      defaultValue: 'upcoming'
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'events',
    timestamps: true,
    underscored: true
  });

  Event.associate = function(models) {
    Event.belongsTo(models.Barangay, { foreignKey: 'barangay_id', as: 'barangay' });
    Event.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });
  };

  return Event;
};
