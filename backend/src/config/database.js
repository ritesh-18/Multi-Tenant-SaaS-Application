const { Pool } = require('pg');
const logger = require('../utils/logger');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  logger.error('Unexpected PostgreSQL pool error', { error: err.message });
});

async function query(text, params) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development') {
      logger.debug('SQL Query', { text, duration: `${duration}ms`, rows: result.rowCount });
    }
    return result;
  } catch (error) {
    logger.error('SQL Query Error', { text, error: error.message });
    throw error;
  }
}

async function getClient() {
  const client = await pool.connect();
  const release = client.release.bind(client);
  client.release = () => {
    client.release = release;
    return release();
  };
  return client;
}

async function transaction(callback) {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function connectDatabase() {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    logger.info('PostgreSQL connected successfully');
  } catch (error) {
    logger.error('PostgreSQL connection failed', { error: error.message });
    process.exit(1);
  }
}

async function disconnectDatabase() {
  await pool.end();
  logger.info('PostgreSQL pool closed');
}

module.exports = { query, getClient, transaction, connectDatabase, disconnectDatabase, pool };
