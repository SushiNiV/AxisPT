const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST_NEW,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME_NEW,
  ssl:
    process.env.DB_SSL === 'true'
      ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' }
      : false,
  max: Number(process.env.DB_POOL_MAX) || 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err.message);
});

pool
  .query('SELECT 1')
  .then(() => console.log('PostgreSQL connected to:', process.env.DB_NAME_NEW))
  .catch((err) => console.error('Database connection error:', err.message));

module.exports = pool;