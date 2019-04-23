const models = require('../models');
const sequelize = require('sequelize');
const ProjectHelper = require('../helpers/ProjectHelper');

const Stories = models.Stories;
const User = models.User;

async function isValidName(userStory) {
    // Check if there is another story with same name, case insensitive
    let existing = await Stories.findAll({
        where: {
            name: sequelize.where(sequelize.fn('LOWER', sequelize.col('name')), userStory.name.toLowerCase())
        }
    });
    if (existing.length === 0){
        return true;
    } else {
        // If saving same object - it is ok.
        return existing[0].id === userStory.id;
    }
}

async function listSelectableSprintStories(projectId,sprintId) {
    return await Stories.findAll( {
        where: {
            project_id: projectId,
            estimatedTime:{
                [models.Sequelize.Op.and]: [{[models.Sequelize.Op.not]:null},{[models.Sequelize.Op.not]:0}], // TODO FIX...accept null or 0
            },
            is_done: false,
            sprint_id:{
                [models.Sequelize.Op.or]: [sprintId,null],
            }

        }
    });
}

async function listProjectSprintStories(projectId) {
    return await Stories.findAll( {
        where: {
            project_id: projectId,
            //estimatedTime: {$not: null},
            estimatedTime:{
                 [models.Sequelize.Op.and]: [{[models.Sequelize.Op.not]:null},{[models.Sequelize.Op.not]:0}], // TODO FIX...accept null or 0
            },
            is_done: false,
            sprint_id: null
        }
    });
}

async function listSprintStories(projectId, sprintId) {
    return await Stories.findAll( {
        where: {
            project_id: projectId,
            sprint_id: sprintId
        }
    });
}

async function listStories(projectId) {
    return await Stories.findAll( {
        where: {
            project_id: projectId,
        }
    });
}

async function getStory(storyID) {
    return await Stories.findOne( {
        where: {
            id: storyID,
        }
    });
}

async function setSprintStories(sprint_id,stories_array) {
    await Stories.update(
        {sprint_id: null},
        {where: {sprint_id: sprint_id}}
    );


    if (stories_array == null) return;

    await Stories.update(
        {sprint_id: sprint_id},
        {
            where: {
                id: {
                    [models.Sequelize.Op.or]: [stories_array]
                }
            }
        },
    )
}

async function checkIfSMorPM(req, res, next) {
    // check if user story is editable by SM or PM
    // and if story is not yet assigned or completed

    if (!req.isAuthenticated()) {
        return res.redirect('/');
    }

    let user = await User.findById(req.user.id);
    if (!user) {
        return res.redirect('/');
    }

    if (req.params.id) {
        let story = await getStory(req.params.id);
        let project = await ProjectHelper.getProjectToEdit(story.project_id);
        let sm = user.id === project.scrum_master;
        let pm = user.id === project.product_owner;

        if (req.isAuthenticated() && user && (sm || pm)) {
            return next();
        } else {
            console.log('isSMorPM scrum master || admin MIDDLEWARE SAYS:', false);
            res.redirect(req.headers.referer);
        }
    } else {
        // No info allow
        return next();
    }
}

async function isSM(project_id, user_id) {
    // check if user story estimated time field is editable by SM

    let project = await ProjectHelper.getProjectToEdit(project_id);
    let sm = user_id === project.scrum_master;

    return sm;
}

async function deleteStoryById(storyId) {
    if (!storyId) {
        return {msg: 'No Id specified..', payload: 1};
    }
    try {
        // !! - return true if successful, else false
        return !!await Stories.destroy({
            where: {
                id: storyId
            }
        });
    } catch (e) {
        console.log("Can't delete " + e);
        return false;
    }

}

module.exports = {
    listSprintStories,
    listStories,
    getStory,
    isValidName,
    listSelectableSprintStories,
    setSprintStories,
    checkIfSMorPM,
    isSM,
    deleteStoryById,
    listProjectSprintStories
};