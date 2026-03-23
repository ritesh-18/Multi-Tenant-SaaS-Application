const { query, transaction } = require('../config/database');
const { invalidateTenantCache } = require('../middlewares/tenant.middleware');
const logger = require('../utils/logger');

const PLAN_CONFIG = {
  FREE:       { maxUsers: 5,      maxApiCalls: 1_000,   price: 0   },
  PRO:        { maxUsers: 50,     maxApiCalls: 50_000,  price: 49  },
  ENTERPRISE: { maxUsers: 999999, maxApiCalls: 999_999, price: 199 },
};

const FLAG_UPDATES = {
  FREE:       { advanced_reports: false, ai_assistant: false, custom_roles: false, sso: false },
  PRO:        { advanced_reports: true,  ai_assistant: true,  custom_roles: false, sso: false },
  ENTERPRISE: { advanced_reports: true,  ai_assistant: true,  custom_roles: true,  sso: true  },
};

class SubscriptionService {
  async getSubscription(tenantId) {
    const { rows } = await query(`
      SELECT s.*, t.name AS tenant_name, t.slug AS tenant_slug, t.plan AS tenant_plan
      FROM subscriptions s
      JOIN tenants t ON t.id = s.tenant_id
      WHERE s.tenant_id = $1
    `, [tenantId]);
    if (!rows[0]) throw Object.assign(new Error('Subscription not found'), { statusCode: 404 });
    return { ...rows[0], config: PLAN_CONFIG[rows[0].plan] };
  }

  async upgradePlan(tenantId, newPlan) {
    const config = PLAN_CONFIG[newPlan];
    if (!config) throw Object.assign(new Error(`Invalid plan: ${newPlan}`), { statusCode: 400 });

    const { rows: [tenant] } = await query(`SELECT slug FROM tenants WHERE id = $1`, [tenantId]);

    await transaction(async (client) => {
      await client.query(`
        UPDATE subscriptions SET plan = $1, status = 'ACTIVE' WHERE tenant_id = $2
      `, [newPlan, tenantId]);

      await client.query(`
        UPDATE tenants SET plan = $1, max_users = $2, max_api_calls = $3 WHERE id = $4
      `, [newPlan, config.maxUsers, config.maxApiCalls, tenantId]);

      for (const [flagKey, enabled] of Object.entries(FLAG_UPDATES[newPlan])) {
        await client.query(`
          UPDATE feature_flags SET enabled = $1 WHERE tenant_id = $2 AND key = $3
        `, [enabled, tenantId, flagKey]);
      }
    });

    await invalidateTenantCache(tenant.slug);
    logger.info('Plan upgraded', { tenantId, newPlan });
    return this.getSubscription(tenantId);
  }

  getPlanConfig() {
    return PLAN_CONFIG;
  }
}

module.exports = new SubscriptionService();
