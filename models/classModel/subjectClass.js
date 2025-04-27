module.exports = (sequelize, DataTypes) => {
    const SubjectClass = sequelize.define("subjectClass", {
      subject_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      class_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      section_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      passmarks: { 
        type: DataTypes.INTEGER,
        allowNull: true 
      },
      fullmarks: {
        type: DataTypes.INTEGER,
        allowNull: true 
      }
    }, {
      indexes: [
        {
          unique: true,
          fields: ['class_id', 'section_id', 'subject_id']
        }
      ]
    });
  
    return SubjectClass;
  };
  