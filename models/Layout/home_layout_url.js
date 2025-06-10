module.exports = (sequelize, DataTypes) => {
    return sequelize.define(
        "home_layout_url",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            layout_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'home_layout',
                    key: 'id',
                },
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
            },
            url: {
                type: DataTypes.STRING(100),
                allowNull: false,
            },
       
            deletedAt: {
                type: DataTypes.DATE,
                allowNull: true,
                validate: {
                    isDate: true,
                    isValidDate(value) {
                        if (value && !(value instanceof Date || !isNaN(new Date(value)))) {
                            throw new Error('Invalid date value');
                        }
                    }
                }
            }
        },
        {
            timestamps: true,
            paranoid: true,
            tableName: "home_layout_url",

        },

    );
};
