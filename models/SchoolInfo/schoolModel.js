module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "schoolinfo",
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      school_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      address: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      established_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      logo: {
        type: DataTypes.STRING(255),
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
      phone_number: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      principal_name: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      website: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      affiliation: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      school_type: {
        type: DataTypes.ENUM('Public', 'Private', 'Charter', 'Other'),
        defaultValue: 'Private',
        allowNull: true,
      }
    },
    {
      timestamps: true,
      paranoid: true,
      tableName: "schoolinfo",
    }
  );
};
