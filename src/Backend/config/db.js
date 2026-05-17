const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST_NEW,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME_NEW,
});

(async () => {
  try {
    const client = await pool.connect();
    console.log('PostgreSQL connected to:', process.env.DB_NAME_NEW);
    client.release();
  } catch (err) {
    console.error('Database connection error:', err.message);
  }
})();

module.exports = pool;