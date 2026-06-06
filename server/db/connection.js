const { Pool } = require('pg');
require('dotenv').config();

let pool;
let useMock = false;

if (process.env.DATABASE_URL) {
  // Use real PostgreSQL database if configured
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  // Test connection
  pool.query('SELECT 1', (err) => {
    if (err) {
      console.warn('⚠️  Database connection failed, falling back to mock data');
      useMock = true;
    } else {
      console.log('✓ PostgreSQL database connected');
    }
  });
} else {
  // Use mock database for development
  console.log('⚠️  DATABASE_URL not set - using mock in-memory data');
  useMock = true;
}

const mockPool = require('./mockPool');

module.exports = {
  query: function(text, params, callback) {
    if (useMock) {
      return mockPool.query(text, params, callback);
    }
    return pool.query(text, params, callback);
  },
  end: function() {
    if (useMock) {
      return Promise.resolve();
    }
    return pool.end();
  }
};