var express = require('express');
var router = express.Router();
var models = require('../models/');

const User = models.User;
const Story = models.Story;
const Tasks = models.Tasks;

var middleware = require('./middleware.js');

var ProjectHelper = require('../helpers/ProjectHelper');
var TasksHelper = require('../helpers/TasksHelper');
var StoriesHelper = require('../helpers/StoriesHelper');


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
        username: req.user.username,
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
                username: req.user.username,
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

        req.flash('success', 'Task - ' + createdTask.name + ' has been successfully created');
        res.render('add_edit_task', {
            errorMessages: 0,
            success: req.flash('success'),
            pageName: 'tasks',
            uid: req.user.id,
            username: req.user.username,
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
            username: req.user.username,
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
        username: req.user.username,
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

    let assignee = null;
    if (data.assignee) {
        assignee = data.assignee;
    }

    // Set new attributes
    task.setAttributes({
        name: data.name,
        description: data.description,
        time: data.time/6,
        assignee: assignee
    });

    // validate task
    if (!await TasksHelper.isValidTaskChange(task)){
        req.flash('error', `Task name: ${task.name} already in use`);
        res.render('add_edit_task', {
            errorMessages: req.flash('error'), success: 0, pageName: 'tasks', uid: req.user.id, username: req.user.username,
            isUser: req.user.is_user, projectId: task.project_id, storyId: task.story_id, projectUsers: projectUsers, toEditTask: false,
            timeForNewTask:available_time_for_new_task,project:project,
        });
    }

    await task.save();

    let task_updated = await TasksHelper.getTask(task_id);

    req.flash('success', 'Task - ' + task_updated.name + ' has been successfully updated');
    res.render('add_edit_task', {
        errorMessages: 0,
        success: req.flash('success'),
        pageName: 'tasks',
        uid: req.user.id,
        username: req.user.username,
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

    let is_deleted = await TasksHelper.deleteTaskById(task_id);
    if (is_deleted) {
        return res.redirect('/projects/'+ task.project_id +'/view');
    }else{
        return res.status(500).send('Delete failed')
    }
});


module.exports = router;
