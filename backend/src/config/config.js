const dbOptions = require('./dbOptions');

module.exports = {
  development: { ...dbOptions },
  test: { ...dbOptions },
  production: { ...dbOptions },
};
