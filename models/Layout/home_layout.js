module.exports = (sequelize, DataTypes) => {
    const HomeLayout = sequelize.define(
        "home_layout",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            parent_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
                references: {
                    model: 'home_layout',
                    key: 'id',
                },
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
            },
            title: {
                type: DataTypes.STRING(50),
                allowNull: true,
            },
            icon: {
                type: DataTypes.STRING(100),
                allowNull: false,
            },
            access_to: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'role',
                    key: 'id',
                },
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
            },
            status: {
                type: DataTypes.ENUM('active', 'inactive'),
                allowNull: false,
                defaultValue: 'active',
            },
            order: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
                comment: 'Sorting order for menu items'
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
            tableName: "home_layout",
        }
    );






    return HomeLayout;
};
