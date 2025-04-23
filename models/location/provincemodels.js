module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "province",
    {
      pnumber: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      pname: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      pname_np: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      headquarter: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      map_index: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      status: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      inserted_on: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "provinces",
      timestamps: false,
    }
  );
};
