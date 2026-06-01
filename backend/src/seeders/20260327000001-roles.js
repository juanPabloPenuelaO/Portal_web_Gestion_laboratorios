'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('roles', [
      { nombre: 'administrador', created_at: new Date(), updated_at: new Date() },
      { nombre: 'coordinador', created_at: new Date(), updated_at: new Date() },
      { nombre: 'docente', created_at: new Date(), updated_at: new Date() },
      { nombre: 'auxiliar', created_at: new Date(), updated_at: new Date() },
      { nombre: 'estudiante', created_at: new Date(), updated_at: new Date() },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('roles', null, {});
  },
};
