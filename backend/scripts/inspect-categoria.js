'use strict';

const sequelize = require('../src/config/database');

async function run() {
  const [constraint] = await sequelize.query(`
    SELECT pg_get_constraintdef(oid) AS def
    FROM pg_constraint
    WHERE conrelid = 'equipos'::regclass AND contype = 'c'
    ORDER BY conname
  `);

  const [categorias] = await sequelize.query(`
    SELECT DISTINCT categoria FROM equipos ORDER BY categoria
  `);

  console.log('Constraints:');
  constraint.forEach((c) => console.log(' -', c.def));
  console.log('Valores en BD:', categorias.map((c) => c.categoria).join(', ') || '(vacío)');
  await sequelize.close();
}

run().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
