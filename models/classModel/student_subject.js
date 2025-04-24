
module.exports = (sequelize, DataTypes) => {
  return sequelize.define("student_subject", {
    sudent_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    subject_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    }
  });
};
