'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {

    return queryInterface.bulkInsert('Stories', [
      {
        name: 'User story 1',
        description: 'This is user story description 1',
        acceptanceCriteria: '#it works',
        importance: 'could have',
        is_done: false,
        project_id: 1,
        sprint_id: 1,
        businessValue: 2,
        estimatedTime: 2,
      },
      {
        name: 'User story 2',
        description: 'This is user story description 2',
        acceptanceCriteria: '#it works',
        importance: 'must have',
        is_done: true,
        project_id: 1,
        sprint_id: 1,
        businessValue: 5,
        estimatedTime: 5,
      },
      {
        name: 'User story 3',
        description: 'This is user story description 3',
        acceptanceCriteria: '#it works',
        importance: 'should have',
        is_done: false,
        project_id: 1,
        sprint_id: 1,
        businessValue: 5,
        in_progress: true,
        estimatedTime: 3,
      },
      {
        name: 'User story 4',
        description: 'This is user story description 4',
        acceptanceCriteria: '#it works',
        importance: 'won\'t have this time',
        is_done: false,
        project_id: 1,
        businessValue: 5,
        estimatedTime: 0,
      },
      {
        name: '#Story 1',
        description: 'This is user story description 1',
        acceptanceCriteria: '#it should work',
        importance: 'could have',
        is_done: false,
        project_id: 3,
        sprint_id: 3,
        businessValue: 1,
        estimatedTime: 1,
      },
      {
        name: '#Story 2',
        description: 'This is user story description 2',
        acceptanceCriteria: '#it should work',
        importance: 'won\'t have this time',
        is_done: false,
        project_id: 3,
        businessValue: 5,
        estimatedTime: 0,
      },
      {
        name: '#Story 3',
        description: 'This is user story description 3',
        acceptanceCriteria: '#it should work',
        importance: 'should have',
        is_done: false,
        project_id: 3,
        sprint_id: 3,
        businessValue: 5,
        in_progress: true,
        estimatedTime: 3,
      },
      {
        name: '#Story 4',
        description: 'This is user story description 4',
        acceptanceCriteria: '#it should work',
        importance: 'must have',
        is_done: true,
        project_id: 3,
        sprint_id: 3,
        businessValue: 5,
        estimatedTime: 5,
      },

    ], {});
  },

  down: (queryInterface, Sequelize) => {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.bulkDelete('People', null, {});
    */
  }
};
