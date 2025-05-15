module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "student_academic_histories",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      student_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'students', key: 'id' }
      },
      admission_no: {
        type: DataTypes.STRING(50),
        allowNull: false,
        references: { model: 'students', key: 'admission_no' }
      },
      academic_year: {
        type: DataTypes.STRING(9),
        allowNull: false
      },
      class_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'classes', key: 'id' }
      },
      section_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'sections', key: 'id' }
      },
       school_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'schoolinfo',
        key: 'id'
      }
    },
      roll_number: {
        type: DataTypes.STRING(20),
        allowNull: true
      },
      status: {
        type: DataTypes.ENUM(
          'passed',
          'failed',
          'promoted',
          'retained',
          'dropped',
          'transferred',
          'graduated'
        ),
        allowNull: false,
        defaultValue: 'promoted'
      },
      is_current: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      promotion_date: {
        type: DataTypes.DATEONLY,
        allowNull: true
      },
      remarks: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      attendance_percentage: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true
      },
      conduct_rating: {
        type: DataTypes.ENUM('A', 'B', 'C', 'D', 'E'),
        allowNull: true
      },
      term: {
        type: DataTypes.ENUM('first', 'second', 'third', 'final'),
        allowNull: true
      },
      is_active_term: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      }
    },
    {
      timestamps: true,
      paranoid: true,
      tableName: "student_academic_histories",
      indexes: [
        {
          unique: true,
          fields: ['student_id', 'academic_year']
        },
        {
          fields: ['class_id', 'section_id', 'academic_year']
        },
        {
          fields: ['is_current']
        },
        {
          fields: ['status']
        }
      ]
    }
  );
};
