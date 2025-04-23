module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "vdc",
    {
      name: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },

      district_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      tableName: "vdc",
      timestamps: false,
    }
  );
};
