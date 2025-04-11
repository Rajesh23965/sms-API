module.exports = (sequelize, DataTypes) => {
    return sequelize.define("teacher", {
      name: DataTypes.STRING(100),
      email: DataTypes.STRING(100),
      phone: DataTypes.STRING(20),
      qualification: DataTypes.STRING(100),
      address: DataTypes.TEXT,
      joining_date: DataTypes.DATE,
      status: DataTypes.STRING(10),
    });
  };