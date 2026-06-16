const { Sequelize } = require('sequelize');
const dbOptions = require('./dbOptions');

const databaseUrl = process.env.DATABASE_URL?.trim();

const sequelize = databaseUrl
  ? new Sequelize(databaseUrl, {
      dialect: 'postgres',
      logging: dbOptions.logging,
      define: dbOptions.define,
      dialectOptions: dbOptions.dialectOptions,
    })
  : new Sequelize(
      dbOptions.database,
      dbOptions.username,
      dbOptions.password,
      dbOptions
    );

module.exports = sequelize;
