const { query } = require('../config/database');

class AuditRepository {
  async findAll({ tenantId, page = 1, limit = 50, userId, action, resource, from, to } = {}) {
    const offset = (page - 1) * limit;
    const conditions = ['al.tenant_id = $1'];
    const params = [tenantId];
    let idx = 2;

    if (userId)   { conditions.push(`al.user_id = $${idx++}`);                              params.push(userId); }
    if (action)   { conditions.push(`al.action ILIKE $${idx++}`);                           params.push(`%${action}%`); }
    if (resource) { conditions.push(`al.resource = $${idx++}`);                             params.push(resource); }
    if (from)     { conditions.push(`al.created_at >= $${idx++}`);                          params.push(new Date(from)); }
    if (to)       { conditions.push(`al.created_at <= $${idx++}`);                          params.push(new Date(to)); }

    const where = conditions.join(' AND ');

    const [dataResult, countResult] = await Promise.all([
      query(`
        SELECT al.*, u.email, u.first_name, u.last_name
        FROM audit_logs al
        LEFT JOIN users u ON u.id = al.user_id
        WHERE ${where}
        ORDER BY al.created_at DESC
        LIMIT $${idx++} OFFSET $${idx++}
      `, [...params, limit, offset]),
      query(`SELECT COUNT(*)::int AS total FROM audit_logs al WHERE ${where}`, params),
    ]);

    return { logs: dataResult.rows, total: countResult.rows[0].total };
  }

  async create({ tenantId, userId, action, resource, resourceId, metadata, ipAddress, userAgent }) {
    const { rows } = await query(`
      INSERT INTO audit_logs (tenant_id, user_id, action, resource, resource_id, metadata, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [tenantId, userId || null, action, resource, resourceId || null,
        metadata ? JSON.stringify(metadata) : null, ipAddress || null, userAgent || null]);
    return rows[0];
  }
}

module.exports = new AuditRepository();
