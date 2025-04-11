module.exports = (sequelize, DataTypes) => {
    return sequelize.define("subject", {
      name: DataTypes.STRING(100),
      code: DataTypes.STRING(20),
    });
  };