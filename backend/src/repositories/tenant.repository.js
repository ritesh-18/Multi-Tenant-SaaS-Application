const { query, transaction } = require('../config/database');

class TenantRepository {
  async findAll({ page = 1, limit = 20, status, plan } = {}) {
    const offset = (page - 1) * limit;
    const conditions = ['t.status != $1'];
    const params = ['DELETED'];
    let idx = 2;

    if (status) { conditions.push(`t.status = $${idx++}`); params.push(status); }
    if (plan)   { conditions.push(`t.plan = $${idx++}`);   params.push(plan); }

    const where = conditions.join(' AND ');

    const [dataResult, countResult] = await Promise.all([
      query(`
        SELECT
          t.*,
          s.plan AS sub_plan, s.status AS sub_status,
          COUNT(u.id)::int AS user_count
        FROM tenants t
        LEFT JOIN subscriptions s ON s.tenant_id = t.id
        LEFT JOIN users u ON u.tenant_id = t.id
        WHERE ${where}
        GROUP BY t.id, s.plan, s.status
        ORDER BY t.created_at DESC
        LIMIT $${idx++} OFFSET $${idx++}
      `, [...params, limit, offset]),
      query(`SELECT COUNT(*)::int AS total FROM tenants t WHERE ${where}`, params),
    ]);

    return { tenants: dataResult.rows, total: countResult.rows[0].total };
  }

  async findById(id) {
    const { rows } = await query(`
      SELECT t.*, s.plan AS sub_plan, s.status AS sub_status,
             s.current_period_end, s.cancel_at_period_end,
             COUNT(u.id)::int AS user_count
      FROM tenants t
      LEFT JOIN subscriptions s ON s.tenant_id = t.id
      LEFT JOIN users u ON u.tenant_id = t.id
      WHERE t.id = $1
      GROUP BY t.id, s.plan, s.status, s.current_period_end, s.cancel_at_period_end
    `, [id]);
    return rows[0] || null;
  }

  async findBySlug(slug) {
    const { rows } = await query(`
      SELECT t.*, s.plan AS sub_plan, s.status AS sub_status
      FROM tenants t
      LEFT JOIN subscriptions s ON s.tenant_id = t.id
      WHERE t.slug = $1 AND t.status != 'DELETED'
    `, [slug]);
    return rows[0] || null;
  }

  async findBySlugWithFlags(slug) {
    const [tenantRes, flagsRes] = await Promise.all([
      query(`
        SELECT t.*, s.plan AS sub_plan, s.status AS sub_status
        FROM tenants t
        LEFT JOIN subscriptions s ON s.tenant_id = t.id
        WHERE t.slug = $1 AND t.status != 'DELETED'
      `, [slug]),
      query(`
        SELECT key, enabled, config FROM feature_flags
        WHERE tenant_id = (SELECT id FROM tenants WHERE slug = $1)
      `, [slug]),
    ]);
    if (!tenantRes.rows[0]) return null;
    return { ...tenantRes.rows[0], featureFlags: flagsRes.rows };
  }

  async create(data) {
    const { name, slug, domain, plan = 'FREE', maxUsers, maxApiCalls } = data;
    const { rows } = await query(`
      INSERT INTO tenants (name, slug, domain, plan, max_users, max_api_calls)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [name, slug, domain || null, plan, maxUsers, maxApiCalls]);
    return rows[0];
  }

  async update(id, data) {
    const fields = [];
    const params = [];
    let idx = 1;
    const allowed = ['name', 'domain', 'logo_url', 'status', 'max_users', 'max_api_calls'];
    const map = { name: 'name', domain: 'domain', logoUrl: 'logo_url', status: 'status', maxUsers: 'max_users', maxApiCalls: 'max_api_calls' };

    for (const [key, col] of Object.entries(map)) {
      if (data[key] !== undefined) {
        fields.push(`${col} = $${idx++}`);
        params.push(data[key]);
      }
    }

    if (fields.length === 0) return this.findById(id);
    params.push(id);
    const { rows } = await query(
      `UPDATE tenants SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      params
    );
    return rows[0];
  }

  async softDelete(id) {
    const { rows } = await query(
      `UPDATE tenants SET status = 'DELETED' WHERE id = $1 RETURNING *`,
      [id]
    );
    return rows[0];
  }

  async getStats(tenantId) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [users, apiCalls, auditEvents, recentLogs] = await Promise.all([
      query(`
        SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE status = 'ACTIVE')::int AS active,
          COUNT(*) FILTER (WHERE created_at >= $2)::int AS new_this_month
        FROM users WHERE tenant_id = $1
      `, [tenantId, thirtyDaysAgo]),
      query(`
        SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE created_at >= $2)::int AS this_week
        FROM api_usage_logs WHERE tenant_id = $1
      `, [tenantId, sevenDaysAgo]),
      query(`
        SELECT COUNT(*)::int AS total FROM audit_logs
        WHERE tenant_id = $1 AND created_at >= $2
      `, [tenantId, thirtyDaysAgo]),
      query(`
        SELECT al.*, u.email, u.first_name, u.last_name
        FROM audit_logs al
        LEFT JOIN users u ON u.id = al.user_id
        WHERE al.tenant_id = $1
        ORDER BY al.created_at DESC LIMIT 5
      `, [tenantId]),
    ]);

    return {
      users: users.rows[0],
      apiCalls: apiCalls.rows[0],
      activity: { auditEventsThisMonth: auditEvents.rows[0].total },
      recentAuditLogs: recentLogs.rows,
    };
  }
}

module.exports = new TenantRepository();
