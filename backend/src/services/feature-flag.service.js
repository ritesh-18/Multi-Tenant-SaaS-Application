const { query } = require('../config/database');
const cacheService = require('./cache.service');
const logger = require('../utils/logger');

class FeatureFlagService {
  async getFlags(tenantId) {
    const cacheKey = cacheService.tenantKey(tenantId, 'flags');
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const { rows } = await query(
      `SELECT * FROM feature_flags WHERE tenant_id = $1 ORDER BY key`,
      [tenantId]
    );

    await cacheService.set(cacheKey, rows, 300);
    return rows;
  }

  async isEnabled(tenantId, key) {
    const flags = await this.getFlags(tenantId);
    return flags.find((f) => f.key === key)?.enabled || false;
  }

  async updateFlag(tenantId, key, enabled, config = null) {
    const { rows } = await query(`
      INSERT INTO feature_flags (tenant_id, key, enabled, config)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (tenant_id, key)
      DO UPDATE SET enabled = $3, config = COALESCE($4::jsonb, feature_flags.config)
      RETURNING *
    `, [tenantId, key, enabled, config ? JSON.stringify(config) : null]);

    await cacheService.del(cacheService.tenantKey(tenantId, 'flags'));
    logger.info('Feature flag updated', { tenantId, key, enabled });
    return rows[0];
  }

  async bulkUpdateFlags(tenantId, updates) {
    return Promise.all(updates.map(({ key, enabled, config }) => this.updateFlag(tenantId, key, enabled, config)));
  }
}

module.exports = new FeatureFlagService();
