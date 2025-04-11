const { DataTypes, Sequelize } = require("sequelize");
const sequelize = require("../../config/db");

const User = sequelize.define(
    "students",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        admission_no: {
            type: DataTypes.UUID,
            defaultValueSchemable: DataTypes.UUIDV4,
        },
        first_name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        last_name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        dob: {
            type: DataTypes.DATE,
            allowNull: false
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true,
            },
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        phone: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        address: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        gender: {
            type: Sequelize.ENUM("male", "female", "others"),
            allowNull: false,
        },
        status: {
            type: Sequelize.ENUM('active', 'inactive'),
            allowNull: false
        },
        class_id: {
            type: DataTypes.UUIDV4,
            allowNull: false
        },
        section_id: {
            type: DataTypes.UUIDV4,
            allowNull: false
        },
        parent_id: {
            type: DataTypes.UUIDV4
        },
        admission_date: {
            type: DataTypes.DATE,
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            field: "created_at",
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            field: "updated_at",
        },
    },
    {
        timestamps: true,
        underscored: true,
    },
);

module.exports = User;









