'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const sequelize = require('../config/database');

const db = {};

const modelsDir = __dirname;
const modelFiles = fs
  .readdirSync(modelsDir)
  .filter((file) => file !== 'index.js' && file.endsWith('.js'));

for (const file of modelFiles) {
  const model = require(path.join(modelsDir, file))(sequelize, Sequelize.DataTypes);
  db[model.name] = model;
}

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
