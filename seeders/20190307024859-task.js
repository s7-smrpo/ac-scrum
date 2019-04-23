'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('Tasks', [
      {
        name: "#1 Task frontend",
        description: "It must look awesome!",
        time: 0.5,
        story_id: 5,
        project_id: 3,
        is_done: false,
        is_accepted: false
      },
      {
        name: "#3 Task frontend",
        description: "It must look cool!",
        time: 0.5,
        story_id: 7,
        project_id: 3,
        assignee: 8,
        is_done: false,
        is_accepted: false
      },
      {
        name: "#4 Task backend",
        description: "Please use HL7 standard to connect to other provides.",
        time: 3,
        story_id: 8,
        project_id: 3,
        assignee: 8,
        is_done: true,
        is_accepted: true
      }
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
