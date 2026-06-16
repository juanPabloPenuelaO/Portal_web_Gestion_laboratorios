require('dotenv').config({ override: true, expand: false });

const trim = (value) => (typeof value === 'string' ? value.trim() : value);

const dialect = trim(process.env.DB_DIALECT) || 'postgres';

const options = {
  username: trim(process.env.DB_USER),
  password: trim(process.env.DB_PASS ?? ''),
  database: trim(process.env.DB_NAME) || 'postgres',
  host: trim(process.env.DB_HOST),
  port: parseInt(trim(process.env.DB_PORT), 10) || 5432,
  dialect,
  logging: false,
  define: {
    underscored: true,
    freezeTableName: true,
    timestamps: false,
  },
};

if (dialect === 'postgres' && trim(process.env.DB_SSL) !== 'false') {
  options.dialectOptions = {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  };
}

module.exports = options;
