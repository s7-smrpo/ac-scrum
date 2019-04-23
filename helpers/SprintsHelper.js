const models = require('../models');
const Sprint = models.Sprint;
const Project= models.Project;
const User   = models.User;
var ProjectHelper = require('../helpers/ProjectHelper');

async function getSprint(sid) {
    return await Sprint.findOne({
        where: {
            id: sid
        },
    });
}

async function currentActiveSprint(project_id){
    let sprint = await Sprint.findAll({
        include: [
            {
                model: models.Project,
                as: 'Project',
                attributes: ['name','id'],

            },
        ],
        where: {
            startDate: {
                [models.Sequelize.Op.lte]: new Date()
            },
            endDate: {
                [models.Sequelize.Op.gte]: new Date()
            },
            project_id: project_id,
        }
    });

    if (sprint.length > 0){
        return sprint[0].id;
    }

    return null
}

async function sprintsInProjects(project_ids){
    console.log("sprint query");
    let sprints = await models.Sprint.findAll({
        include: [
            {
                model: models.Project,
                as: 'Project',
                attributes: ['name','id'],

            },
        ],
        where: {
            [models.Sequelize.Op.or]: [{project_id: project_ids}]
        }
    });
    return sprints
}

async function isSM(req, res, next) {

    if (!req.isAuthenticated()) {
        console.log('isSMorAdmin not logined');
        res.redirect('/');
    }

    var user = await User.findById(req.user.id);
    if (!user) {
        console.log('isSMorAdmin no user info MIDDLEWARE SAYS:', false);
        res.redirect('/');
        return;
    }

    if (req.params.id) {
        // Check for permissions
        let sprint = await getSprint(req.params.id);
        let toEditProject = await ProjectHelper.getProjectToEdit(sprint.project_id);
        let sm = user.id === toEditProject.scrum_master;

        if (req.isAuthenticated() && user && (sm || !user.is_user)) {
            return next();
        } else {
            console.log('isSMorAdmin scrum master || admin MIDDLEWARE SAYS:', false);
            res.redirect('/');
        }
    } else {
        // No info allow
        return next();
    }
}

async function canAccessProjectBySprintId(req, res, next) {
    let user = req.user;
    let sprint = await getSprint(req.params.id);
    let toCheckProject = await ProjectHelper.getProjectToEdit(sprint.project_id);
    if (!toCheckProject || !user) {
        console.log(`No project or user info user: ${user} proj: ${toCheckProject}`);
        res.redirect('/');
        return;
    }
    let allowedProjects =  await ProjectHelper.getAllowedProjects(user.id);
    let isAllowed = allowedProjects.find( p => p.id === toCheckProject.id);
    if (req.isAuthenticated() && isAllowed) {
        return next();
    } else {
        console.log('canAccessProject project MIDDLEWARE SAYS:', false);
        res.redirect('/');
    }
}

module.exports = {
    currentActiveSprint,
    sprintsInProjects,
    getSprint,
    isSM,
    canAccessProjectBySprintId
};