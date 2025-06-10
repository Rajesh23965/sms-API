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
      marks_obtained: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      practical_marks: {
        type: DataTypes.FLOAT,
        allowNull: true,
        validate: {
          min: 0
        }
      },
      practicalPassmarks: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
          min: 0,
        },
      },
      grade: {
        type: DataTypes.STRING(2)
      },
      remarks: {
        type: DataTypes.TEXT
      },
      is_passed: {
        type: DataTypes.BOOLEAN
      },
      academic_year: {
        type: DataTypes.STRING(9),
        allowNull: false,
      },
      class_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      section_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      subject_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'subjects', key: 'id' }
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
      indexes: [
        {
           name: 'uniq_exam_result_index',
          unique: false,
          fields: ['student_id', 'exam_id', 'subject_code', 'academic_year', 'class_id', 'subject_id']
        }
      ]
    }
  );
};
