module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "sections",
    {
      section_name: DataTypes.STRING(10),
    },
    {
      timestamps: true,
      tableName: "sections",
    }
  );
};
