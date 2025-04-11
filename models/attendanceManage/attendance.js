module.exports = (sequelize, DataTypes) => {
    return sequelize.define("attendance", {
      date: DataTypes.DATE,
      status: DataTypes.STRING(10),
    });
  };
  