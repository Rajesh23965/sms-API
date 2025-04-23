module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "district",
    {
      name: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      name_np: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      province_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      district_index: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      tableName: "district",
      timestamps: false,
    }
  );
};
