module.exports = (sequelize, DataTypes) => {
    return sequelize.define(
        "role",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            name: {
                type: DataTypes.STRING(100),
                allowNull: false,
            },

            // description: {
            //     type: DataTypes.INTEGER,
            //     allowNull: true,
            // },
            home_layout_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
                references: {
                    model: 'home_layout',
                    key: 'id'
                }
            },
            home_layout_url_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
                references: {
                    model: 'home_layout_url',
                    key: 'id'
                }
            }

        },
        {
            timestamps: true,
            paranoid: true,
            tableName: "role",
        }
    );
};
