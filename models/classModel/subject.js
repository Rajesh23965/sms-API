module.exports = (sequelize, DataTypes) => {
  return sequelize.define("subject", {
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
  });
};