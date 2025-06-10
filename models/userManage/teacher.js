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
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "classes",
          key: "id",
        },
      },
      section_id: DataTypes.INTEGER,
      subject_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      school_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'schoolinfo',
        key: 'id'
      }
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
