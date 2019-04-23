'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {


      return queryInterface.bulkInsert('Projects', [
      {
        name: 'Šahovski turnir',
        description: 'Projekt šah',
        created_by: 1,
        scrum_master: 1,
        product_owner: 2,
        createdat: new Date(),

      },
      {
          name: 'Spletna trgovina',
          description: 'Projekt trgovina',
          created_by: 1,
          scrum_master: 1,
          product_owner: 2,
          createdat: new Date(),
      },
      {
          name: 'Spletni pajek',
          description: 'Projekt za implementacijo spletnega pajka.',
          created_by: 1,
          scrum_master: 6,
          product_owner: 7,
          createdat: new Date(),
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
