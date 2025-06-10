module.exports = (sequelize, DataTypes) => {
    const HomeLayoutRole = sequelize.define('home_layout_roles', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        home_layout_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'home_layout',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        role_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'role',
                key: 'id'
            },
            onDelete: 'CASCADE'
        }
    }, {
        tableName: 'home_layout_roles',
        timestamps: false
    });

    return HomeLayoutRole;
};
