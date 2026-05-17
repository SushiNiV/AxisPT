const { Pool } = require('pg');
require('dotenv').config();

//old
const oldPool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST_OLD,
  database: process.env.DB_NAME_OLD,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

//new
const newPool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST_NEW,
  database: process.env.DB_NAME_NEW,
  password: process.env.DB_PASSWORD, 
  port: process.env.DB_PORT,
});

module.exports = {
  oldPool,
  newPool
};