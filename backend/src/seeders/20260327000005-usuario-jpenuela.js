'use strict';

const bcrypt = require('bcryptjs');

const EMAIL = 'jpenuela2229@cue.edu.co';
const NOMBRE = 'J. Penuela';
const CONTRASENA_PLANA = '1234';

module.exports = {
  async up(queryInterface) {
    const [roles] = await queryInterface.sequelize.query(
      "SELECT id FROM roles WHERE UPPER(nombre) = 'ADMINISTRADOR' LIMIT 1"
    );

    if (!roles.length) {
      throw new Error('No se encontró el rol ADMINISTRADOR en la tabla roles');
    }

    const contrasena = await bcrypt.hash(CONTRASENA_PLANA, 10);
    const ahora = new Date();

    const [existentes] = await queryInterface.sequelize.query(
      'SELECT id FROM usuarios WHERE email = :email LIMIT 1',
      { replacements: { email: EMAIL } }
    );

    if (existentes.length) {
      await queryInterface.sequelize.query(
        `UPDATE usuarios
         SET nombre = :nombre,
             contrasena = :contrasena,
             rol_id = :rol_id,
             estado = 'ACTIVO',
             updated_at = :ahora
         WHERE email = :email`,
        {
          replacements: {
            nombre: NOMBRE,
            contrasena,
            rol_id: roles[0].id,
            ahora,
            email: EMAIL,
          },
        }
      );
      return;
    }

    await queryInterface.bulkInsert('usuarios', [
      {
        nombre: NOMBRE,
        email: EMAIL,
        contrasena,
        rol_id: roles[0].id,
        estado: 'ACTIVO',
        fecha_creacion: ahora,
        created_at: ahora,
        updated_at: ahora,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('usuarios', { email: EMAIL }, {});
  },
};
