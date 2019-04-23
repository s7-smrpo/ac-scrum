'use strict';
module.exports = (sequelize, DataTypes) => {
    var Tasks = sequelize.define('Tasks', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: {
                args: true,
                msg: 'Task name already exists!'
            }
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        time: {
            type: DataTypes.FLOAT,
            allowNull: false,
            validate: {
                min: {
                    args: [0.0],
                    msg: 'Cant be a negative value.'
                }
            }
        },
        assignee: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        is_accepted: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        is_done: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        story_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        project_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        createdAt: {
            field: 'createdat',
            type: DataTypes.DATE,
        },
        updatedAt: {
            field: 'updatedat',
            type: DataTypes.DATE,
        },
    });

    return Tasks;
};