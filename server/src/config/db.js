require('dotenv').config();
const { Pool } = require('pg');
const { types } = require('pg');

// Keep DATE columns (OID 1082) as raw YYYY-MM-DD strings to avoid timezone shifts.
types.setTypeParser(1082, (value) => value);

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || 'course_feedback',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  ssl: String(process.env.DB_SSL || '').toLowerCase() === 'true' ? { rejectUnauthorized: false } : false,
});

module.exports = pool;
