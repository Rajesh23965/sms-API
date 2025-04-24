module.exports = (sequelize, DataTypes) => {
    const SubjectTeacher= sequelize.define("subjectTeacher", {
      subject_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      teacher_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      }
    });
    return SubjectTeacher
  };
  