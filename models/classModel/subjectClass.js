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
      },
      practicalMarks: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
      },
    },
     practicalPassmarks: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
          min: 0,
        },
      },
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
  