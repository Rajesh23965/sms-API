module.exports = (sequelize, DataTypes) => {
    return sequelize.define(
      "exam_summary",
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
        total_marks: {
          type: DataTypes.FLOAT,
          allowNull: false,
        },
        obtained_marks: {
          type: DataTypes.FLOAT,
          allowNull: false,
        },
        percentage: {
          type: DataTypes.FLOAT,
          allowNull: false,
        },
        cgpa: {
          type: DataTypes.FLOAT,
          allowNull: false,
        },
        percentile: {
          type: DataTypes.FLOAT,
          allowNull: false,
        },
        overall_grade: {
          type: DataTypes.STRING(2),
          allowNull: false,
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
        tableName: "exam_summary",
        timestamps: true,
        indexes: [
          {
            unique: true,
            fields: ['student_id', 'exam_id']
          }
        ]
      }
    );
  };