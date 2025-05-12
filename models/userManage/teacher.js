module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "teachers",
    {
      name:{type: DataTypes.STRING(100)},
      email: {type:DataTypes.STRING(100)},
      phone: {type:DataTypes.STRING(20)},
      image: {type:DataTypes.STRING(100)},
      gender: {type:DataTypes.ENUM("male", "female", "others")},
      qualification:{type: DataTypes.STRING(100)},
      address:{type: DataTypes.TEXT},
      class_id: {
        type: DataTypes.TEXT,
        allowNull: true,
        references: {
          model: "classes",
          key: "id",
        },
      },
      section_id: DataTypes.TEXT,
      subject_id: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
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
