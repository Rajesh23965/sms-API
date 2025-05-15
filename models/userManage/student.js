module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "student",
    {
      first_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      middle_name: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      last_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      gender: {
        type: DataTypes.STRING(10),
        allowNull: false,
      },
      dob: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      phone: {
        type: DataTypes.STRING(20),
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
      image: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      // Permanent address
      pprovince: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      pdistrict: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      pmuncipality: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      pward: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      // Temporary address
      tprovince: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      tdistrict: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      tmuncipality: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      tward: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      // Parent's details
      fname: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      foccupation: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      fcontactnumber: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      femail: {
        type: DataTypes.STRING(100),
        allowNull: true,
        validate: {
          isEmail: true,
        },
      },
      // Guardian's details
      lgname: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      lgoccupation: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      lgcontactnumber: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      lgemail: {
        type: DataTypes.STRING(100),
        allowNull: true,
        validate: {
          isEmail: true,
        },
      },
      admission_no: {
        type: DataTypes.STRING(50),
        unique: true,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING(10),
        defaultValue: "active",
      },
      school_id: {
        type: DataTypes.INTEGER,
        references: {
          model: 'schoolinfo',
          key: 'id'
        }
      },

    },
    {
      timestamps: true,
      paranoid: true,
      tableName: "students",
    }
  );
};
