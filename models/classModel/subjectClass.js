
module.exports = (sequelize, DataTypes) => {
    const SubjectClass= sequelize.define("subjectClass", {
      subject_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      class_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      }
    });
    return SubjectClass
  };
  