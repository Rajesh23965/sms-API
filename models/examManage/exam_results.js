module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "exam_results",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      student_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      exam_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      subject_code: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      marks: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('Pass', 'Fail'),
        allowNull: true,
      },
      grade: {
        type: DataTypes.STRING(2),
        allowNull: true,
      },
      grade_point: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "exam_results",
      timestamps: true,
    }
  );
};
