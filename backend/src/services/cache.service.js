const { getRedisClient } = require('../config/redis');
const logger = require('../utils/logger');

class CacheService {
  async get(key) {
    const client = getRedisClient();
    if (!client) return null;
    try {
      const value = await client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (err) {
      logger.error('Cache get error', { key, error: err.message });
      return null;
    }
  }

  async set(key, value, ttlSeconds = 300) {
    const client = getRedisClient();
    if (!client) return false;
    try {
      await client.setEx(key, ttlSeconds, JSON.stringify(value));
      return true;
    } catch (err) {
      logger.error('Cache set error', { key, error: err.message });
      return false;
    }
  }

  async del(key) {
    const client = getRedisClient();
    if (!client) return false;
    try {
      await client.del(key);
      return true;
    } catch (err) {
      logger.error('Cache del error', { key, error: err.message });
      return false;
    }
  }

  tenantKey(tenantId, suffix) {
    return `tenant:${tenantId}:${suffix}`;
  }
}

module.exports = new CacheService();
