module.exports = (sequelize, DataTypes) => {
    return sequelize.define(
      "terms",
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        name: {
          type: DataTypes.STRING(50),
          allowNull: false
        },
        academic_year: {
          type: DataTypes.STRING(9),
          allowNull: false
        },
        start_date: DataTypes.DATEONLY,
        end_date: DataTypes.DATEONLY,
        is_current: {
          type: DataTypes.BOOLEAN,
          defaultValue: false
        }
      },
      {
        tableName: "terms",
        indexes: [
          {
            unique: true,
            fields: ['name', 'academic_year']
          }
        ]
      }
    );
  };