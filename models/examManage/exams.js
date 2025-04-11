module.exports = (sequelize, DataTypes) => {
    return sequelize.define("exam", {
      name: DataTypes.STRING(100),
      description: DataTypes.TEXT,
      start_date: DataTypes.DATE,
      end_date: DataTypes.DATE,
    });
  };