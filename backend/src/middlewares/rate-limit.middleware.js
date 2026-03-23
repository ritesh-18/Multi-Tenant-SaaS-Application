const { getRedisClient } = require('../config/redis');
const ApiResponse = require('../utils/response');
const logger = require('../utils/logger');

const PLAN_LIMITS = {
  FREE: { windowMs: 60_000, max: 60 },
  PRO: { windowMs: 60_000, max: 300 },
  ENTERPRISE: { windowMs: 60_000, max: 1000 },
};

function tenantRateLimiter() {
  return async (req, res, next) => {
    const redis = getRedisClient();
    if (!redis) return next(); // fail open when Redis unavailable

    const plan = req.tenant?.plan || 'FREE';
    const { windowMs, max } = PLAN_LIMITS[plan] || PLAN_LIMITS.FREE;
    const tenantId = req.tenant?.id || 'global';
    const key = `rl:${tenantId}`;

    try {
      const current = await redis.incr(key);
      if (current === 1) await redis.pExpire(key, windowMs);

      const ttl = await redis.pTtl(key);
      res.set({
        'X-RateLimit-Limit': max,
        'X-RateLimit-Remaining': Math.max(0, max - current),
        'X-RateLimit-Reset': new Date(Date.now() + ttl).toISOString(),
      });

      if (current > max) {
        logger.warn('Rate limit exceeded', { tenantId, plan, current, max });
        return ApiResponse.tooManyRequests(res);
      }
      next();
    } catch (err) {
      logger.error('Rate limiter error', { error: err.message });
      next(); // fail open
    }
  };
}

module.exports = { tenantRateLimiter };
