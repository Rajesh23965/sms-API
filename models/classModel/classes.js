module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "classes",
    {
      class_name: DataTypes.STRING(50),
      numeric_name: DataTypes.INTEGER,
      note: DataTypes.TEXT,
    },
    {
      timestamps: false,
      tableName: "classes",
    }
  );
};
