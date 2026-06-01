'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('tipos_laboratorio', [
      { nombre: 'software', estado: 'activo', created_at: new Date(), updated_at: new Date() },
      { nombre: 'hardware', estado: 'activo', created_at: new Date(), updated_at: new Date() },
      { nombre: 'electronica', estado: 'activo', created_at: new Date(), updated_at: new Date() },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('tipos_laboratorio', null, {});
  },
};
