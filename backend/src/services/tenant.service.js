const tenantRepository = require('../repositories/tenant.repository');
const { query, transaction } = require('../config/database');
const cacheService = require('./cache.service');
const { invalidateTenantCache } = require('../middlewares/tenant.middleware');
const logger = require('../utils/logger');

const PLAN_LIMITS = {
  FREE:       { maxUsers: 5,      maxApiCalls: 1_000 },
  PRO:        { maxUsers: 50,     maxApiCalls: 50_000 },
  ENTERPRISE: { maxUsers: 999999, maxApiCalls: 999_999 },
};

const DEFAULT_FLAGS = (plan) => [
  ['analytics',           true,             'Analytics dashboard'],
  ['audit_logs',          true,             'Audit logging'],
  ['email_notifications', true,             'Email notifications'],
  ['api_access',          true,             'API access'],
  ['advanced_reports',    plan !== 'FREE',  'Advanced reporting'],
  ['ai_assistant',        plan !== 'FREE',  'AI assistant features'],
  ['custom_roles',        plan === 'ENTERPRISE', 'Custom role creation'],
  ['sso',                 plan === 'ENTERPRISE', 'Single Sign-On'],
];

class TenantService {
  async getAllTenants(filters) {
    return tenantRepository.findAll(filters);
  }

  async getTenantById(id) {
    const tenant = await tenantRepository.findById(id);
    if (!tenant) throw Object.assign(new Error('Tenant not found'), { statusCode: 404 });
    return tenant;
  }

  async createTenant(data) {
    const { name, slug, domain, plan = 'FREE' } = data;
    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.FREE;

    const existing = await tenantRepository.findBySlug(slug);
    if (existing) throw Object.assign(new Error('Slug already taken'), { statusCode: 409 });

    const tenant = await transaction(async (client) => {
      const { rows: [t] } = await client.query(`
        INSERT INTO tenants (name, slug, domain, plan, max_users, max_api_calls)
        VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
      `, [name, slug, domain || null, plan, limits.maxUsers, limits.maxApiCalls]);

      await client.query(`
        INSERT INTO subscriptions (tenant_id, plan, status)
        VALUES ($1, $2, $3)
      `, [t.id, plan, plan === 'FREE' ? 'ACTIVE' : 'TRIALING']);

      for (const [key, enabled, description] of DEFAULT_FLAGS(plan)) {
        await client.query(`
          INSERT INTO feature_flags (tenant_id, key, enabled, description)
          VALUES ($1, $2, $3, $4)
        `, [t.id, key, enabled, description]);
      }

      return t;
    });

    logger.info('Tenant created', { tenantId: tenant.id, slug: tenant.slug, plan });
    return tenant;
  }

  async updateTenant(id, data) {
    const tenant = await tenantRepository.update(id, data);
    if (tenant) await invalidateTenantCache(tenant.slug);
    return tenant;
  }

  async deleteTenant(id) {
    const tenant = await tenantRepository.findById(id);
    if (!tenant) throw Object.assign(new Error('Tenant not found'), { statusCode: 404 });
    await tenantRepository.softDelete(id);
    await invalidateTenantCache(tenant.slug);
    logger.info('Tenant deleted', { tenantId: id });
  }

  async getTenantStats(tenantId) {
    const cacheKey = cacheService.tenantKey(tenantId, 'stats');
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;
    const stats = await tenantRepository.getStats(tenantId);
    await cacheService.set(cacheKey, stats, 60);
    return stats;
  }
}

module.exports = new TenantService();
