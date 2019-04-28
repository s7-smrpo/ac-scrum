const models = require('../models');

const Tasks = models.Tasks;
const User = models.User;

var sequelize = require('sequelize');
const ProjectHelper = require('../helpers/ProjectHelper');
const StoriesHelper = require('../helpers/StoriesHelper');
const SprintsHelper = require('../helpers/SprintsHelper');

var moment = require('moment');

async function listTasks(storyId) {
    return await Tasks.findAll( {
        where: {
            story_id: storyId,
        }
    });
}

async function listProjectTasks(projectId) {
    return await Tasks.findAll( {
        where: {
            project_id: projectId,
        }
    });
}

async function getTask(taskID) {
    const x = await Tasks.findOne( {
        where: {
            id: taskID,
        }
    });
    if (x) {
        timeLogsPropToJson(x);
    }
    return x;
}

async function deleteTaskById(taskId) {
    if (!taskId) {
        return {msg: 'No Id specified..', payload: 1};
    }
    try {
        // !! - return true if successful, else false
        return !!await Tasks.destroy({
            where: {
                id: taskId
            },
            force:true,
        });
    } catch (e) {
        console.log("Can't delete " + e);
        return false;
    }
}

async function deleteTasksByStoryId(storyId) {
    if (!storyId) {
        return {msg: 'No Id specified..', payload: 1};
    }
    try {
        // !! - return true if successful, else false
        return !!await Tasks.destroy({
            where: {
                story_id: storyId
            }
        });
    } catch (e) {
        console.log("Can't delete " + e);
        return false;
    }
}

async function isValidTaskChange(task) {
    // Check if there is another task in the story with same name, case insensitive
    let existing = await Tasks.findAll({
        where: {
            story_id: task.story_id,
            name: sequelize.where(sequelize.fn('LOWER', sequelize.col('name')), task.name.toLowerCase())
        }
    });

    //Name
    if (existing.length !== 0 && existing[0].id !== task.id) {
        return false;
    }
    //Story unrealised
    let story = await StoriesHelper.getStory(task.story_id);
    if (story.is_done || !story.sprint_id) {
        return false;
    }
    //In active sprint
    let sprint =  SprintsHelper.getSprint(story.sprint_id);
    if (!moment().isBetween(moment(sprint.startDate), moment(sprint.endDate), 'days', '[]')) {
        return false;
    }

    return true;
}

async function isPO(project_id, user_id) {
    let project = await ProjectHelper.getProjectToEdit(project_id);
    return user_id === project.product_owner;
}

async function checkIfSMorMember(req, res, next) {
    // check if user story is editable by SM or member

    if (!req.isAuthenticated()) {
        return res.redirect('/');
    }

    let user = await User.findById(req.user.id);
    if (!user) {
        return res.redirect('/');
    }

    let projId = null;
    if (req.params.taskId) {
        let task = await getTask(req.params.taskId);
        projId = task.project_id;
    } else {
        projId = req.params.projectId;
    }

    if (!projId) {
        return res.redirect('/');
    }

    let project = await ProjectHelper.getProject(projId);
    let inProject = req.user.id === project.scrum_master;
    project.ProjectMembers.forEach(function (member) {
        if (req.user.id === member.id) {
            inProject = true;
        }
    });

    if (inProject) {
        return next();
    } else {
        return res.redirect('/');
    }
}

function timeLogsPropToJson(x) {
    try {
        x.timeLogs = JSON.parse(x.timeLogs || '[]');
        x.timeLogs = x.timeLogs.map(x => ({ ...x, spend: + x.spend, date: new Date(x.date) }));
        x.timeLogs = x.timeLogs.sort((a, b) => a.date - b.date);
    } catch (e) {
        console.error(e);
        x.timeLogs = [];
    }
}


module.exports = {
    timeLogsPropToJson,
    listTasks,
    listProjectTasks,
    getTask,
    deleteTaskById,
    deleteTasksByStoryId,
    isValidTaskChange,
    checkIfSMorMember
};