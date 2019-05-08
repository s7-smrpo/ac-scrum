var express = require('express');
var moment = require('moment');
var router = express.Router();
var models = require('../models/');

const User = models.User;
const Story = models.Story;
const Tasks = models.Tasks;

var middleware = require('./middleware.js');

var ProjectHelper = require('../helpers/ProjectHelper');
var TasksHelper = require('../helpers/TasksHelper');
var StoriesHelper = require('../helpers/StoriesHelper');
var UsersHelper = require('../helpers/UsersHelper');


//  ------------- create a task ----------------
router.get('/create/:projectId/:storyId', TasksHelper.checkIfSMorMember, async function(req, res, next) {
    let projectUsers = await ProjectHelper.getProjectMembers(req.params.projectId);

    let taskStory    = await StoriesHelper.getStory(req.params.storyId);
    let storyTasksTimeSum = 0;
    let storyTasks   = await TasksHelper.listTasks(req.params.storyId);
    for(var i = 0; i < storyTasks.length; i++){
        storyTasksTimeSum += storyTasks[i].time;
    }
    let available_time_for_new_task = (taskStory.estimatedTime - storyTasksTimeSum) > 0 ? taskStory.estimatedTime - storyTasksTimeSum : 0 ;
    let project = await ProjectHelper.getProject(req.params.projectId);

    res.render('add_edit_task', {
        errorMessages: 0,
        success: 0,
        pageName: 'tasks',
        uid: req.user.id,
        username: req.user.username, user: req.user,
        isUser: req.user.is_user,
        projectId: req.params.projectId,
        storyId: req.params.storyId,
        projectUsers: projectUsers,
        toEditTask: false,
        timeForNewTask:available_time_for_new_task,
        project:project,
    });
});

router.post('/create/:projectId/:storyId', TasksHelper.checkIfSMorMember, async function(req, res, next) {
    let data = req.body;
    let projectId = req.params.projectId;
    let projectUsers = await ProjectHelper.getProjectMembers(req.params.projectId);
    let taskStory    = await StoriesHelper.getStory(req.params.storyId);
    let storyTasksTimeSum = 0;
    let storyTasks   = await TasksHelper.listTasks(req.params.storyId);
    let project = await ProjectHelper.getProject(req.params.projectId);

    for(var i = 0; i < storyTasks.length; i++){
        storyTasksTimeSum += storyTasks[i].time;
    }
    let available_time_for_new_task = (taskStory.estimatedTime - storyTasksTimeSum) > 0 ? taskStory.estimatedTime - storyTasksTimeSum : 0 ;

    let assignee = null;
    if (data.assignee) {
        assignee = data.assignee;
    }

    try {
        // Create new task
        const createdTask = Tasks.build({
            name: data.name,
            description: data.description,
            time: data.time/6,
            assignee: assignee,
            story_id: req.params.storyId,
            project_id: projectId
        });

        // validate task
        if (!await TasksHelper.isValidTaskChange(createdTask)){
            req.flash('error', `Task name: ${createdTask.name} already in use`);
            res.render('add_edit_task', {
                errorMessages: req.flash('error'),
                success: 0,
                pageName: 'tasks',
                uid: req.user.id,
                username: req.user.username, user: req.user,
                isUser: req.user.is_user,
                projectId: req.params.projectId,
                storyId: req.params.storyId,
                projectUsers: projectUsers,
                toEditTask: false,
                timeForNewTask:available_time_for_new_task,
                project:project,
            });
            return;
        }

        await createdTask.save();

        if(data.assignee){
            var newTaskId = createdTask.id;
            await UsersHelper.set_users_pending_task_id(data.assignee,newTaskId);
        }

        req.flash('success', 'Task - ' + createdTask.name + ' has been successfully created');
        res.render('add_edit_task', {
            errorMessages: 0,
            success: req.flash('success'),
            pageName: 'tasks',
            uid: req.user.id,
            username: req.user.username, user: req.user,
            isUser: req.user.is_user,
            projectId: req.params.projectId,
            storyId: req.params.storyId,
            projectUsers: projectUsers,
            toEditTask: createdTask,
            timeForNewTask:available_time_for_new_task,
            project:project,
        });

    } catch (e) {
        console.log(e);
        req.flash('error', 'Error!');
        res.render('add_edit_task', {
            errorMessages: req.flash('error'),
            success: 0,
            pageName: 'tasks',
            uid: req.user.id,
            username: req.user.username, user: req.user,
            isUser: req.user.is_user,
            projectId: req.params.projectId,
            storyId: req.params.storyId,
            projectUsers: projectUsers,
            toEditTask: false,
            timeForNewTask:available_time_for_new_task,
            project:project,

        });

    }

});

//  ------------- edit a task ----------------
router.get('/:taskId/edit', TasksHelper.checkIfSMorMember, async function(req, res, next) {
    let currentTask  = await TasksHelper.getTask(req.params.taskId);
    let projectUsers = await ProjectHelper.getProjectMembers(currentTask.project_id);
    let project = await ProjectHelper.getProject(currentTask.project_id);
    let taskStory    = await StoriesHelper.getStory(currentTask.story_id);
    let storyTasksTimeSum = 0;
    let storyTasks   = await TasksHelper.listTasks(taskStory.id);
    for(var i = 0; i < storyTasks.length; i++){
        storyTasksTimeSum += storyTasks[i].time;
    }
    let available_time_for_new_task = (taskStory.estimatedTime - storyTasksTimeSum) > 0 ? (taskStory.estimatedTime - storyTasksTimeSum) : 0 ;

    res.render('add_edit_task', {
        errorMessages: 0,
        success: 0,
        pageName: 'tasks',
        uid: req.user.id,
        username: req.user.username, user: req.user,
        isUser: req.user.is_user,
        projectId: currentTask.project_id,
        storyId: currentTask.story_id,
        projectUsers: projectUsers,
        toEditTask: currentTask,
        timeForNewTask:available_time_for_new_task,
        project:project,


    });
});

router.post('/:taskId/edit/', TasksHelper.checkIfSMorMember, async function(req, res, next) {
    let data = req.body;
    let task_id = req.params.taskId;
    let task = await TasksHelper.getTask(req.params.taskId);
    let taskStory    = await StoriesHelper.getStory(task.story_id);
    let storyTasksTimeSum = 0;
    let storyTasks   = await TasksHelper.listTasks(taskStory.id);
    let project = await ProjectHelper.getProject(task.project_id);

    for(var i = 0; i < storyTasks.length; i++){
        storyTasksTimeSum += storyTasks[i].time;
    }
    let available_time_for_new_task = (taskStory.estimatedTime - storyTasksTimeSum) > 0 ? taskStory.estimatedTime - storyTasksTimeSum : 0 ;


    let projectUsers = await ProjectHelper.getProjectMembers(task.project_id);

    let prev_assignee = task.assignee;
    let assignee = null;
    if (data.assignee) {
        assignee = data.assignee;
        if(data.assignee != prev_assignee){
            await UsersHelper.set_users_pending_task_id(data.assignee,task_id);
        }
    }

    if (data.time_auto === 'on') {
        task.autoTimer = new Date();
    } else {
        if ( task.autoTimer) {
            if (data.time_spend) {
                data.time_spend = + data.time_spend;
            } else {
                data.time_spend = 0;
            }
            const duration = moment.duration(moment().diff( moment( task.autoTimer)));
            let hours = duration.asHours();
            if (hours < 1) {
                if (hours == 0) {
                    // noop
                } else {
                    hours = 0.5;
                }
            } else {
                hours = Math.round(hours);
            }
            data.time_spend += hours;
        }
        task.autoTimer = null;
    }

    // Time log
    if (data.time_spend) {
        let last = task.timeLogs ? task.timeLogs[task.timeLogs.length - 1] : null;
        let remaining = last ? last.estimate : (+task.time);

        if (data.time_estimate === undefined) {
            data.time_estimate = remaining - ( + data.time_spend);
            if (data.time_estimate  < 0) {
                data.time_estimate = 0;
            }
        }

        const existingEntry = task.timeLogs.find(x => moment(x.date).format("YYYY-MM-DD") === moment().format("YYYY-MM-DD"));
        if (existingEntry) {
            existingEntry.spend =  existingEntry.spend + ( + data.time_spend);
            existingEntry.estimate = +data.time_estimate;
        } else {
            task.timeLogs.push({
                date: new Date(),
                spend: +data.time_spend,
                estimate: +data.time_estimate
            });
        }
    }

    // Set new attributes
    task.setAttributes({
        name: data.name,
        description: data.description,
        time: data.time/6,
        assignee: assignee,
        timeLogs: JSON.stringify(task.timeLogs)
    });
    if (data.assignee) {
        assignee = data.assignee;
        if(data.assignee != prev_assignee){
            task.setAttributes({
                is_accepted: false,
            });
        }
    }

    // validate task
    if (!await TasksHelper.isValidTaskChange(task)){
        req.flash('error', `Task name: ${task.name} already in use`);
        res.render('add_edit_task', {
            errorMessages: req.flash('error'), success: 0, pageName: 'tasks', uid: req.user.id, username: req.user.username, user: req.user,
            isUser: req.user.is_user, projectId: task.project_id, storyId: task.story_id, projectUsers: projectUsers, toEditTask: false,
            timeForNewTask:available_time_for_new_task,project:project,
        });
    }

    await task.save();


    if(assignee === null && prev_assignee){
        await UsersHelper.reset_users_pending_task_id(prev_assignee);
    }

    let task_updated = await TasksHelper.getTask(task_id);

    req.flash('success', 'Task - ' + task_updated.name + ' has been successfully updated');
    res.render('add_edit_task', {
        errorMessages: 0,
        success: req.flash('success'),
        pageName: 'tasks',
        uid: req.user.id,
        username: req.user.username, user: req.user,
        isUser: req.user.is_user,
        projectId: task.project_id,
        storyId: task.story_id,
        projectUsers: projectUsers,
        toEditTask: task_updated,
        timeForNewTask:available_time_for_new_task,
        project:project,
    });

});

router.get('/:taskId/delete', TasksHelper.checkIfSMorMember, async function(req, res, next) {
    let task_id = req.params.taskId;


    // we need this (so we can get project_id) to navigate back to project backlog
    let task = await Tasks.findOne({
        where: {
            id: task_id,
        }
    });
    let prev_assignee = task.assignee;

    let is_deleted = await TasksHelper.deleteTaskById(task_id);
    if (is_deleted) {
        await UsersHelper.reset_users_pending_task_id(prev_assignee);
        return res.redirect('/projects/'+ task.project_id +'/view');
    }else{
        return res.status(500).send('Delete failed')
    }
});

//  ------------- accept/deny a task ----------------
router.get('/pending', middleware.ensureAuthenticated, async function(req, res, next) {
    var pending_tasks = await TasksHelper.listAssigneesUnacceptedTasks(req.user.dataValues.id);

    res.render('pending_tasks', {
        errorMessages: 0,
        success: 0,
        pageName: 'tasks',
        uid: req.user.id,
        username: req.user.username, user: req.user,
        isUser: req.user.is_user,
        pending_tasks: pending_tasks,
        user:req.user,

    });

});

router.get('/accepted', middleware.ensureAuthenticated, async function(req, res, next) {
    var accepted_tasks = await TasksHelper.listAssigneesAcceptedTasks(req.user.dataValues.id);

    accepted_tasks.forEach(x => {
        TasksHelper.timeLogsPropToJson(x.dataValues);

        x.canFinish = !((x.dataValues.timeLogs[x.dataValues.timeLogs.length-1] || {}).estimate);
    })

    res.render('accepted_tasks', {
        errorMessages: 0,
        success: 0,
        pageName: 'tasks',
        uid: req.user.id,
        username: req.user.username, user: req.user,
        isUser: req.user.is_user,
        accepted_tasks: accepted_tasks,
        user:req.user,
    });
});

router.get('/acceptDeny', middleware.ensureAuthenticated, async function(req, res, next) {
    let accept_id          = req.query.accept_id
    let deny_id            = req.query.deny_id
    let deny_accepted_id   = req.query.deny_accepted_id


    // console.log("sprint id: " + sprint_id);
    let remaining_tasks;

    if (typeof accept_id !== 'undefined'){
        await TasksHelper.setAccepted(accept_id);
        await UsersHelper.set_users_pending_task_id(req.user.id,0);
        await UsersHelper.reset_users_pending_task_id(req.user.id);
    }else if(typeof deny_id !== 'undefined'){
        await TasksHelper.setAssignee(deny_id,null);
        await UsersHelper.set_users_pending_task_id(req.user.id,0);
        await UsersHelper.reset_users_pending_task_id(req.user.id);
    }else if(typeof deny_accepted_id !== 'undefined'){
        await TasksHelper.setAssignee(deny_accepted_id,null);
        await TasksHelper.setUnaccepted(deny_accepted_id);

    }

    remaining_tasks = await TasksHelper.listAssigneesUnacceptedTasks(req.user.id);


    res.send(JSON.parse(JSON.stringify(remaining_tasks)));

});

router.get('/setDone', middleware.ensureAuthenticated, async function(req, res, next) {
    let taskId = req.query.task_id;

    await TasksHelper.setDone(taskId);

    let remaining_tasks = await TasksHelper.listAssigneesUnacceptedTasks(req.user.id);
    res.send(JSON.parse(JSON.stringify(remaining_tasks)));

});

//  ------------- list sprint stories ----------------
router.get('/projectAllowedSprintStories/:id',ProjectHelper.isSMorPM, async function(req, res, next) {
    let sprint_id = req.query.sprint_id
    console.log("sprint id: " + sprint_id);
    let projectStories;

    if (typeof sprint_id !== 'undefined'){
        projectStories = await StoriesHelper.listSelectableSprintStories(req.params.id,sprint_id);
    }else{
        projectStories = await StoriesHelper.listProjectSprintStories(req.params.id);
    }
    res.send(JSON.parse(JSON.stringify(projectStories)));
});





module.exports = router;
