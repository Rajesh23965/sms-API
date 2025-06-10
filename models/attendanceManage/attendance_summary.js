module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "attendance_summary",
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
      academic_history_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'student_academic_histories', key: 'id' }
      },
      month: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      year: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      present_days: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      absent_days: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      late_days: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      half_days: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      holiday_days: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      total_school_days: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      percentage: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      school_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'schoolinfo', key: 'id' }
      }
    },
    {
      timestamps: true,
      tableName: "attendance_summaries",
      indexes: [
        {
          unique: true,
          fields: ['student_id', 'academic_history_id', 'month', 'year'],
          name: 'attendance_summary_unique_index'
        },
        {
          fields: ['student_id'],
          name: 'attendance_summary_student_index'
        },
        {
          fields: ['academic_history_id'],
          name: 'attendance_summary_academic_history_index'
        }
      ]
    }
  );
};