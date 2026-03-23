const { createClient } = require('redis');
const logger = require('../utils/logger');

let redisClient = null;

async function connectRedis() {
  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) return new Error('Redis max retries exceeded');
          return Math.min(retries * 100, 3000);
        },
      },
    });

    redisClient.on('error', (err) => logger.error('Redis error', { error: err.message }));
    redisClient.on('connect', () => logger.info('Redis connected'));
    redisClient.on('reconnecting', () => logger.warn('Redis reconnecting...'));

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    logger.warn('Redis unavailable — caching disabled', { error: error.message });
    return null;
  }
}

function getRedisClient() {
  return redisClient;
}

module.exports = { connectRedis, getRedisClient };
