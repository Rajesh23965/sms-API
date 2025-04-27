module.exports = (sequelize, DataTypes) => {
    return sequelize.define("teacher_schedule", {
        teacher_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        subject_id: { type: DataTypes.INTEGER, allowNull: false },
        class_id: { type: DataTypes.INTEGER, allowNull: false },
        section_id: { type: DataTypes.INTEGER, allowNull: false },

    },
        {
            timestamps: true,
            tableName: "teacher_schedule",
            createdAt: "createdAt",
            updatedAt: "updatedAt",
        })
}