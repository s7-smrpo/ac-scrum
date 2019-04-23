'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    var endDate = new Date();
    var startDate = new Date();
    var endDate2 = new Date();
    var numberOfDaysToAdd = 6;
    endDate2.setDate(endDate.getDate() + numberOfDaysToAdd + 1);
    endDate.setDate(endDate.getDate() + numberOfDaysToAdd);
    startDate.setDate(startDate.getDate() - numberOfDaysToAdd);
    return queryInterface.bulkInsert('Sprints', [
      {
        startDate: startDate,
        endDate: endDate,
        velocity: 2,
        project_id: 1,
      },
      {
        startDate: endDate,
        endDate: endDate2,
        velocity: 6,
        project_id: 2,
      },
      {
        startDate: startDate,
        endDate: endDate2,
        velocity: 15,
        project_id: 3,
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
