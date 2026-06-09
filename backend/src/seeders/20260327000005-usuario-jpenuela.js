'use strict';

const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface) {
    const email = 'jpenuela2229@cue.edu.co';

    const [existentes] = await queryInterface.sequelize.query(
      'SELECT id FROM usuarios WHERE email = :email LIMIT 1',
      { replacements: { email } }
    );

    if (existentes.length) return;

    const [roles] = await queryInterface.sequelize.query(
      "SELECT id FROM roles WHERE nombre = 'administrador' LIMIT 1"
    );

    if (!roles.length) {
      throw new Error('Ejecute primero el seeder de roles (20260327000001-roles.js)');
    }

    const contrasena = await bcrypt.hash('1234', 10);
    const ahora = new Date();

    await queryInterface.bulkInsert('usuarios', [
      {
        nombre: 'J. Penuela',
        email,
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
    await queryInterface.bulkDelete('usuarios', { email: 'jpenuela2229@cue.edu.co' }, {});
  },
};
