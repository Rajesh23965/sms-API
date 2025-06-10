const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "admins",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      super_admin: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      last_login: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('active', 'inactive', 'suspended'),
        defaultValue: 'active',
      },
      school_id: {
        type: DataTypes.INTEGER,
        references: {
          model: 'schoolinfo',
          key: 'id'
        }
      },
      role_id: {
        type: DataTypes.INTEGER,
        references: {
          model: 'role',
          key: 'id'
        }
      },
      home_layout_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'home_layout',
          key: 'id'
        }
      },
      home_layout_url_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'home_layout_url',
          key: 'id'
        }
      }
    },
    {
      timestamps: true,
      paranoid: true,
      tableName: "admins",
      hooks: {
        beforeCreate: async (admin) => {
          if (admin.password) {
            const salt = await bcrypt.genSalt(10);
            admin.password = await bcrypt.hash(admin.password, salt);
          }
        },
        beforeUpdate: async (admin) => {
          if (admin.changed('password')) {
            const salt = await bcrypt.genSalt(10);
            admin.password = await bcrypt.hash(admin.password, salt);
          }
        }
      }
    }
  );
};