module.exports = (sequelize, DataTypes) => {
    return sequelize.define("subjectCode", {
      code: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true
      },
      subject_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      }
    });
  };
  