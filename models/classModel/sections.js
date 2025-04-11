module.exports = (sequelize, DataTypes) => {
    return sequelize.define("section", {
      section_name: DataTypes.STRING(10),
    });
  };
  