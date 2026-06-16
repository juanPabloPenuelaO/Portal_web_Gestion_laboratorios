'use strict';

const TABLAS_PROYECTO = [
  'roles',
  'usuarios',
  'tipos_laboratorio',
  'laboratorios',
  'reservas',
  'equipos',
  'sesiones',
  'asistencias',
  'prestamos',
  'incidencias',
  'practicas',
];

const sequelize = require('../src/config/database');

async function inspect() {
  await sequelize.authenticate();
  console.log('Conexión OK —', process.env.DB_HOST, '\n');

  for (const table of TABLAS_PROYECTO) {
    const [rows] = await sequelize.query(
      `
      SELECT
        column_name,
        data_type,
        udt_name,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = :table
      ORDER BY ordinal_position
      `,
      { replacements: { table } }
    );

    console.log(`=== ${table} (${rows.length} columnas) ===`);
    if (!rows.length) {
      console.log('  (tabla no encontrada en public)\n');
      continue;
    }
    for (const col of rows) {
      const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      const def = col.column_default ? ` DEFAULT ${col.column_default}` : '';
      console.log(`  ${col.column_name}: ${col.data_type} (${col.udt_name}) ${nullable}${def}`);
    }
    console.log('');
  }

  await sequelize.close();
}

inspect().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
