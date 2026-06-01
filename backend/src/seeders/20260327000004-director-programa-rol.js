'use strict';

module.exports = {
  async up(queryInterface) {
    const ahora = new Date();
    await queryInterface.bulkInsert('roles', [
      {
        nombre: 'director_programa',
        created_at: ahora,
        updated_at: ahora,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('roles', { nombre: 'director_programa' }, {});
  },
};
