module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "attendance",
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
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      status: {
        type: DataTypes.ENUM('present', 'absent', 'late', 'half_day', 'holiday', 'sick', 'excused'),
        allowNull: false,
        defaultValue: 'present'
      },
      remark: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      recorded_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'teachers', key: 'id' }
      },
      school_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'schoolinfo', key: 'id' }
      },
      session: {
        type: DataTypes.ENUM('morning', 'afternoon', 'full_day'),
        allowNull: false,
        defaultValue: 'full_day'
      },
      is_synced: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      }
    },
    {
      timestamps: true,
      paranoid: true,
      tableName: "attendances",
      indexes: [
        {
          unique: false,
          fields: ['student_id', 'date'],
          name: 'attendance_student_date_index'
        },
        {
          fields: ['date'],
          name: 'attendance_date_index'
        },
        {
          fields: ['status'],
          name: 'attendance_status_index'
        },
        {
          fields: ['academic_history_id'],
          name: 'attendance_academic_history_index'
        }
      ]
    }
  );
};