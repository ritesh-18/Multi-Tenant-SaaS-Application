const { query } = require('../config/database');

class UserRepository {
  async findAll({ tenantId, page = 1, limit = 20, role, status } = {}) {
    const offset = (page - 1) * limit;
    const conditions = ['tenant_id = $1'];
    const params = [tenantId];
    let idx = 2;

    if (role)   { conditions.push(`role = $${idx++}`);   params.push(role); }
    if (status) { conditions.push(`status = $${idx++}`); params.push(status); }

    const where = conditions.join(' AND ');

    const [dataResult, countResult] = await Promise.all([
      query(`
        SELECT id, tenant_id, email, first_name, last_name, avatar_url,
               role, status, last_login_at, created_at
        FROM users
        WHERE ${where}
        ORDER BY created_at DESC
        LIMIT $${idx++} OFFSET $${idx++}
      `, [...params, limit, offset]),
      query(`SELECT COUNT(*)::int AS total FROM users WHERE ${where}`, params),
    ]);

    return { users: dataResult.rows, total: countResult.rows[0].total };
  }

  async findById(id, tenantId) {
    const { rows } = await query(
      `SELECT * FROM users WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );
    return rows[0] || null;
  }

  async findByKeycloakId(keycloakId) {
    const { rows } = await query(
      `SELECT * FROM users WHERE keycloak_id = $1`,
      [keycloakId]
    );
    return rows[0] || null;
  }

  async findByEmail(email, tenantId) {
    const { rows } = await query(
      `SELECT * FROM users WHERE email = $1 AND tenant_id = $2`,
      [email, tenantId]
    );
    return rows[0] || null;
  }

  async countByTenant(tenantId) {
    const { rows } = await query(
      `SELECT COUNT(*)::int AS count FROM users WHERE tenant_id = $1`,
      [tenantId]
    );
    return rows[0].count;
  }

  async create(data) {
    const { tenantId, keycloakId, email, firstName, lastName, role = 'USER' } = data;
    const { rows } = await query(`
      INSERT INTO users (tenant_id, keycloak_id, email, first_name, last_name, role, last_login_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *
    `, [tenantId, keycloakId, email, firstName || null, lastName || null, role]);
    return rows[0];
  }

  async update(id, tenantId, data) {
    const map = { firstName: 'first_name', lastName: 'last_name', role: 'role', status: 'status', avatarUrl: 'avatar_url' };
    const fields = [];
    const params = [];
    let idx = 1;

    for (const [key, col] of Object.entries(map)) {
      if (data[key] !== undefined) {
        fields.push(`${col} = $${idx++}`);
        params.push(data[key]);
      }
    }

    if (fields.length === 0) return this.findById(id, tenantId);
    params.push(id, tenantId);
    const { rows } = await query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx++} AND tenant_id = $${idx++} RETURNING *`,
      params
    );
    return rows[0];
  }

  async deactivate(id, tenantId) {
    const { rows } = await query(
      `UPDATE users SET status = 'INACTIVE' WHERE id = $1 AND tenant_id = $2 RETURNING *`,
      [id, tenantId]
    );
    return rows[0];
  }

  async updateLastLogin(id) {
    await query(`UPDATE users SET last_login_at = NOW() WHERE id = $1`, [id]);
  }
}

module.exports = new UserRepository();
