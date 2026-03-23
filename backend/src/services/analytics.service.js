const { query } = require('../config/database');
const cacheService = require('./cache.service');

class AnalyticsService {
  async getDashboardMetrics(tenantId) {
    const cacheKey = cacheService.tenantKey(tenantId, 'dashboard');
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const sevenDaysAgo  = new Date(Date.now() - 7  * 24 * 60 * 60 * 1000).toISOString();

    const [usersRes, apiRes, auditRes] = await Promise.all([
      query(`
        SELECT
          COUNT(*)::int                                            AS total,
          COUNT(*) FILTER (WHERE status = 'ACTIVE')::int          AS active,
          COUNT(*) FILTER (WHERE created_at >= $2)::int           AS new_this_month
        FROM users WHERE tenant_id = $1
      `, [tenantId, thirtyDaysAgo]),
      query(`
        SELECT
          COUNT(*)::int                                            AS total,
          COUNT(*) FILTER (WHERE created_at >= $2)::int           AS this_week
        FROM api_usage_logs WHERE tenant_id = $1
      `, [tenantId, sevenDaysAgo]),
      query(`
        SELECT COUNT(*)::int AS total FROM audit_logs
        WHERE tenant_id = $1 AND created_at >= $2
      `, [tenantId, thirtyDaysAgo]),
    ]);

    const metrics = {
      users:   usersRes.rows[0],
      apiCalls: apiRes.rows[0],
      activity: { auditEventsThisMonth: auditRes.rows[0].total },
    };

    await cacheService.set(cacheKey, metrics, 60);
    return metrics;
  }

  async getApiUsageOverTime(tenantId, days = 30) {
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const { rows } = await query(`
      SELECT
        DATE_TRUNC('day', created_at) AS date,
        COUNT(*)::int                 AS count
      FROM api_usage_logs
      WHERE tenant_id = $1 AND created_at >= $2
      GROUP BY DATE_TRUNC('day', created_at)
      ORDER BY date ASC
    `, [tenantId, from]);
    return rows.map((r) => ({ date: r.date.toISOString().split('T')[0], count: r.count }));
  }

  async getTopEndpoints(tenantId, limit = 10) {
    const { rows } = await query(`
      SELECT
        endpoint,
        method,
        COUNT(*)::int                 AS count,
        AVG(response_time_ms)::int    AS avg_response_ms
      FROM api_usage_logs
      WHERE tenant_id = $1
      GROUP BY endpoint, method
      ORDER BY count DESC
      LIMIT $2
    `, [tenantId, limit]);
    return rows;
  }

  async getUserActivity(tenantId, days = 30) {
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const { rows } = await query(`
      SELECT action, COUNT(*)::int AS count
      FROM audit_logs
      WHERE tenant_id = $1 AND created_at >= $2
      GROUP BY action
      ORDER BY count DESC
      LIMIT 10
    `, [tenantId, from]);
    return rows;
  }
}

module.exports = new AnalyticsService();
