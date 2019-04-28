const models = require('../models');
const User   = models.User;
const TasksHelper = require('../helpers/TasksHelper');


async function getUser(uid) {
    return await User.findOne({
        where: {
            id: uid
        },
    });
}

async function set_users_pending_task_id(uid,task_id){
    let user = await getUser(uid);
    user.setAttributes({
        pending_task_id: task_id,
    });
    await user.save();
}

async function reset_users_pending_task_id(uid){
    let user = await getUser(uid);
    let assignees_unaccepted_tasks = await TasksHelper.listAssigneesUnacceptedTasks(uid);
    let pti = (assignees_unaccepted_tasks.length) ? assignees_unaccepted_tasks[0].id : 0;
    user.setAttributes({
        pending_task_id: pti,
    });
    await user.save();
}


module.exports = {
    getUser,
    set_users_pending_task_id,
    reset_users_pending_task_id,
};