module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "holidays_leaves",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      title: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      start_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      end_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      is_recurring: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      recurring_pattern: {
        type: DataTypes.ENUM('daily', 'weekly', 'monthly', 'yearly'),
        allowNull: true
      },
      applies_to: {
        type: DataTypes.ENUM('all', 'class', 'section', 'individual'),
        allowNull: false,
        defaultValue: 'all'
      },
      class_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'classes', key: 'id' }
      },
      section_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'sections', key: 'id' }
      },
      student_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'students', key: 'id' }
      },
      school_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'schoolinfo', key: 'id' }
      }
    },
    {
      timestamps: true,
      tableName: "holidays_leaves",
      indexes: [
        {
          fields: ['start_date', 'end_date'],
          name: 'holiday_date_range_index'
        },
        {
          fields: ['class_id'],
          name: 'holiday_class_index'
        },
        {
          fields: ['section_id'],
          name: 'holiday_section_index'
        }
      ]
    }
  );
};