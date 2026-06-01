'use strict';

const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface) {
    const [roles] = await queryInterface.sequelize.query(
      "SELECT id, nombre FROM roles WHERE nombre = 'administrador'"
    );

    if (!roles.length) return;

    const contrasena = await bcrypt.hash('admin123', 10);
    const ahora = new Date();

    await queryInterface.bulkInsert('usuarios', [
      {
        nombre: 'Administrador GILIH',
        email: 'admin@gilih.edu',
        contrasena,
        rol_id: roles[0].id,
        estado: 'activo',
        fecha_creacion: ahora,
        created_at: ahora,
        updated_at: ahora,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('usuarios', { email: 'admin@gilih.edu' }, {});
  },
};
