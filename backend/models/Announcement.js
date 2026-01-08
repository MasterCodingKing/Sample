'use strict';

module.exports = (sequelize, DataTypes) => {
  const Announcement = sequelize.define('Announcement', {
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
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    category: {
      type: DataTypes.ENUM('general', 'health', 'safety', 'events', 'government', 'emergency', 'other'),
      defaultValue: 'general'
    },
    priority: {
      type: DataTypes.ENUM('low', 'normal', 'high', 'urgent'),
      defaultValue: 'normal'
    },
    image_url: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    attachments: {
      type: DataTypes.JSON,
      allowNull: true
    },
    is_published: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    is_pinned: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    published_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    views_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    tableName: 'announcements',
    timestamps: true,
    underscored: true
  });

  Announcement.associate = function(models) {
    Announcement.belongsTo(models.Barangay, { foreignKey: 'barangay_id', as: 'barangay' });
    Announcement.belongsTo(models.User, { foreignKey: 'created_by', as: 'author' });
  };

  return Announcement;
};
