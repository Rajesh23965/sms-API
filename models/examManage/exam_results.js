module.exports = (sequelize, DataTypes) => {
    return sequelize.define("exam_result", {
      marks_obtained: DataTypes.FLOAT,
      total_marks: DataTypes.FLOAT,
      grade: DataTypes.STRING(10),
    });
  };