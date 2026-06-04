const { Pool } = require('pg')
require('dotenv').config()

let pool;

if (process.env.DATABASE_URL) {
  // Use real PostgreSQL database if configured
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  })
  
  // Test connection
  pool.query('SELECT 1', (err) => {
    if (err) {
      console.warn('⚠️  Database connection failed, falling back to mock data');
      pool = require('./mockPool');
    } else {
      console.log('✓ PostgreSQL database connected');
    }
  });
} else {
  // Use mock database for development
  console.log('⚠️  DATABASE_URL not set - using mock in-memory data');
  pool = require('./mockPool');
}

module.exports = pool