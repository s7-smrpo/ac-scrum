const express = require('express');
const router = express.Router();

const models = require('../models/');
const middleware = require('./middleware.js');

// models
// const User = models.User;
// const Projects = models.Project;
const Stories = models.Stories;

// helpers
const StoriesHelper = require('../helpers/StoriesHelper');
const ProjectHelper = require('../helpers/ProjectHelper');
const TasksHelper   = require('../helpers/TasksHelper');

//constants
const importance_values = ['must have', 'could have', 'should have', 'won\'t have this time'];


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

router.get('/project/:id', async function(req, res, next) {
    let projectStories = await StoriesHelper.listStories(req.params.id);
    res.render('project', {
        errorMessages: 0, 
        success: 0, 
        stories: projectStories, 
        uid: req.user.id, 
        username: req.user.username, user: req.user,
        isUser: req.user.is_user
    });
});

// ------------------ endpoint for creating new story ------------------
router.get('/project/:id/create', ProjectHelper.isSMorPM, async function(req, res, next) {
    let project_id = req.params.id;
    let isSM = await StoriesHelper.isSM(req.params.id, req.user.id);

    res.render('stories', { 
        errorMessages: 0, 
        success: 0,
        isSM: isSM,
        projectId: project_id, 
        importance_values: importance_values, 
        uid: req.user.id, 
        username: req.user.username, user: req.user,
        isUser: req.user.is_user
    });
});

router.post('/project/:id/create', ProjectHelper.isSMorPM, async function(req, res, next) {
    let data = req.body;
    let project_id = req.params.id;

    if (data.estimatedTime === "") {
        data.estimatedTime = null;
    }

    try {
        // Create new user story
        const createdUserStory = Stories.build({
            name: data.name,
            description: data.description,
            acceptanceCriteria: data.acceptanceCriteria,
            importance: data.importance,
            businessValue: data.businessValue,
            estimatedTime: data.estimatedTime,
            project_id: project_id
        });

        // Validate story
        if (!await StoriesHelper.isValidName(createdUserStory)){
            req.flash(req.flash('error', `Story Name: ${createdUserStory.name} already in use`));
            return res.render('stories', { errorMessages: req.flash('error'), success: 0,
                projectId: project_id, importance_values: importance_values, uid: req.user.id, username: req.user.username, user: req.user, isUser: req.user.is_user});
        }

        await createdUserStory.save();

        req.flash('success', 'User story - ' + createdUserStory.name + ' has been successfully created');
        res.render('stories', { errorMessages: 0, success: req.flash('success'),
            projectId: project_id, importance_values: importance_values, uid: req.user.id, username: req.user.username, user: req.user, isUser: req.user.is_user});

    } catch (e) {
        console.log(e);
        req.flash('error', 'Error!');
        res.render('stories', { errorMessages: req.flash('error'), success: 0,
            projectId: project_id, importance_values: importance_values, uid: req.user.id, username: req.user.username, user: req.user, isUser: req.user.is_user});

    }

});


// ------------------ endpoint for editing existing story ------------------
router.get('/:id/edit/', StoriesHelper.checkIfSMorPM, async function(req, res, next) {
    let userStory = await StoriesHelper.getStory(req.params.id);
    let isSM = await StoriesHelper.isSM(userStory.project_id, req.user.id);

    // if story is done, do not allow visiting it manualy by url
    if (userStory.dataValues.is_done || userStory.dataValues.sprint_id !== null) {
        console.log("This story is done!");
        res.redirect("/");
    }

    return res.render('stories', { 
        errorMessages: 0, 
        success: 0, 
        userStory: userStory,
        projectId: userStory.project_id, 
        importance_values: importance_values,
        isSM: isSM,
        uid: req.user.id, 
        username: req.user.username, user: req.user,
        isUser: req.user.is_user
    });

});

router.post('/:id/edit/', StoriesHelper.checkIfSMorPM, async function(req, res, next) {
    let data = req.body;
    let story_id = req.params.id;

    let story = await Stories.findOne({
        where: {
            id: story_id,
        }
    });

    let isSM = await StoriesHelper.isSM(story.project_id, req.user.id);


    if (data.estimatedTime === "" || data.estimatedTime === 0) {
        data.estimatedTime = null;
    }

    // Set new attributes
    story.setAttributes({
        name: data.name,
        description: data.description,
        acceptanceCriteria: data.acceptanceCriteria,
        importance: data.importance,
        businessValue: !!data.businessValue ? data.businessValue : null,
        estimatedTime: data.estimatedTime,
        project_id: story.project_id
    });

    // validate story
    if (!await StoriesHelper.isValidName(story)){
        let storyObject = await StoriesHelper.getStory(story.id);
        req.flash('error', `Project Name: ${story.name} already in use`);
        return res.render('stories', { errorMessages: req.flash('error'), success: 0, userStory: storyObject, isSM: isSM,
            projectId: story.project_id, importance_values: importance_values, uid: req.user.id, username: req.user.username, user: req.user, isUser: req.user.is_user});
    }

    await story.save();

    let story_updated = await StoriesHelper.getStory(story_id);

    req.flash('success', 'User story - ' + story.name + ' has been successfully updated');
    return res.render('stories', { errorMessages: 0, success: req.flash('success'), userStory: story_updated, isSM: isSM,
        projectId: story.project_id, importance_values: importance_values, uid: req.user.id, username: req.user.username, user: req.user, isUser: req.user.is_user});

});

router.get('/:id/delete', StoriesHelper.checkIfSMorPM, async function(req, res, next) {
    let story_id = req.params.id;

    // we need this (so we can get project_id) to navigate back to project backlog
    // TODO: how to send a notification on successfuly deleted story?
    let story = await Stories.findOne({
        where: {
            id: story_id,
        }
    });

    let are_tasks_deleted = TasksHelper.deleteTasksByStoryId(story_id);
    let is_deleted = await StoriesHelper.deleteStoryById(story_id);
    if (are_tasks_deleted && is_deleted) {
        return res.redirect('/projects/'+ story.project_id +'/view');
    } else {
        return res.status(500).send('Delete failed')
    }
});

router.post('/reject', async function(req, res, next) {
    let data = req.body;

    console.log(data.story_id);
    console.log(data.comment);

    let story = await Stories.findOne({
        where: {
            id: data.story_id,
        }
    });

    story.setAttributes({
        description: story.description + '\nRejection: ' + data.comment,
        is_done: false,
        in_progress: true,
        rejected: true,
        sprint_id: null,
    });

    await story.save();

    return res.status(200).send()

});

router.post('/markAsRealized', async function(req, res, next) {
  let data = req.body;

  console.log("Marking story as realized");
  console.log(data.story_id);

  let story = await Stories.findOne({
    where: {
      id: data.story_id,
    }
  });

  story.setAttributes({
    is_done: true,
    in_progress: false,
    is_accepted: true,
  });

  await story.save();

  return res.status(200).send()

});


module.exports = router;