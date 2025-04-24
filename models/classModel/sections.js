module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "sections",
    {
      section_name: DataTypes.STRING(10),
      class_id: DataTypes.INTEGER,
    },
    {
      class_id: DataTypes.INTEGER,
    },
    {
      timestamps: true,
      tableName: "sections",
    }
  );
};

