module.exports = (sequelize, DataTypes) => {
  return sequelize.define("subject", {
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    passmarks: { 
      type: DataTypes.INTEGER, 
      allowNull: false,
      validate: {
        min: 0
      }
    },
    fullmarks: { 
      type: DataTypes.INTEGER, 
      allowNull: false,
      validate: {
        min: 1
      }
    }
  });
};

  