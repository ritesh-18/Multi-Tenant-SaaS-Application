const tenantRepository = require('../repositories/tenant.repository');
const { getRedisClient } = require('../config/redis');
const logger = require('../utils/logger');
const ApiResponse = require('../utils/response');

const CACHE_TTL = 300;

async function resolveTenant(req, res, next) {
  try {
    // Resolution order: header → subdomain → JWT claim → query param
    let tenantSlug =
      req.headers['x-tenant-slug'] ||
      (req.hostname?.split('.').length >= 3 ? req.hostname.split('.')[0] : null) ||
      req.user?.tenant_slug ||
      req.query.tenant;

    if (!tenantSlug) {
      return ApiResponse.badRequest(res, 'Tenant context required. Provide X-Tenant-Slug header.');
    }

    // Cache check
    const redis = getRedisClient();
    const cacheKey = `tenant:slug:${tenantSlug}`;

    if (redis) {
      const cached = await redis.get(cacheKey);
      if (cached) {
        req.tenant = JSON.parse(cached);
        return next();
      }
    }

    // DB lookup
    const tenant = await tenantRepository.findBySlugWithFlags(tenantSlug);

    if (!tenant) return ApiResponse.notFound(res, `Tenant '${tenantSlug}' not found`);
    if (tenant.status === 'SUSPENDED') return ApiResponse.forbidden(res, 'Tenant account is suspended');
    if (tenant.status === 'DELETED')   return ApiResponse.notFound(res, 'Tenant not found');

    if (redis) await redis.setEx(cacheKey, CACHE_TTL, JSON.stringify(tenant));

    req.tenant = tenant;
    logger.debug('Tenant resolved', { tenantSlug, tenantId: tenant.id });
    next();
  } catch (error) {
    logger.error('Tenant resolution error', { error: error.message });
    next(error);
  }
}

async function invalidateTenantCache(slug) {
  const redis = getRedisClient();
  if (redis) await redis.del(`tenant:slug:${slug}`);
}

module.exports = { resolveTenant, invalidateTenantCache };
