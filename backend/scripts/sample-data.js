'use strict';

const sequelize = require('../src/config/database');

const TABLAS_ESTADO = [
  'usuarios',
  'tipos_laboratorio',
  'laboratorios',
  'reservas',
  'equipos',
  'sesiones',
  'prestamos',
  'incidencias',
  'roles',
];

async function run() {
  await sequelize.authenticate();
  console.log('Muestras de valores en BD:\n');

  for (const table of TABLAS_ESTADO) {
    try {
      const [rows] = await sequelize.query(
        `SELECT DISTINCT estado FROM ${table} ORDER BY estado LIMIT 20`
      );
      console.log(`${table}:`, rows.map((r) => r.estado).join(', ') || '(vacío)');
    } catch (err) {
      console.log(`${table}: (sin columna estado)`);
    }
  }

  const [roles] = await sequelize.query('SELECT id, nombre FROM roles ORDER BY id');
  console.log('\nroles:', roles.map((r) => `${r.id}=${r.nombre}`).join(', ') || '(vacío)');

  await sequelize.close();
}

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
