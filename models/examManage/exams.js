module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "exams",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: DataTypes.STRING(100),
      description: DataTypes.TEXT,
      term_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'terms', key: 'id' }
      },
      exam_type: {
        type: DataTypes.ENUM('weekly', 'monthly', 'terminal', 'final'),
        allowNull: false
      },
      max_marks: DataTypes.FLOAT,
      weightage: DataTypes.FLOAT
    },
    {
      tableName: "exams"
    }
  );
};