module.exports = (sequelize, DataTypes) => {
  return sequelize.define("subjects", {
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },

    passmarks: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    fullmarks: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
      },
    },
    practicalMarks: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
      },
    },
     practicalPassmarks: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
      },
    },
    creditHour: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1,
      },
    }
  });
};
