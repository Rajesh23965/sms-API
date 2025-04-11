module.exports = (sequelize, DataTypes) => {
    return sequelize.define("parent", {
      father_name: DataTypes.STRING(100),
      mother_name: DataTypes.STRING(100),
      guardian_name: DataTypes.STRING(100),
      phone: DataTypes.STRING(20),
      email: DataTypes.STRING(100),
      address: DataTypes.TEXT,
      occupation: DataTypes.STRING(100),
    });
  };