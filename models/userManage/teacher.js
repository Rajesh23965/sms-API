module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "teachers",
    {
      name: DataTypes.STRING(100),
      email: DataTypes.STRING(100),
      phone: DataTypes.STRING(20),
      image: DataTypes.STRING(100),
      gender: DataTypes.ENUM("male", "female", "others"),
      qualification: DataTypes.STRING(100),
      address: DataTypes.TEXT,
      joining_date: DataTypes.DATE,
      status: DataTypes.STRING(10),
    },
    {
      timestamps: true,
      tableName: "teachers",
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    }
  );
};
