require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ── Demo tenant ──────────────────────────────────────────────────
    const { rows: [demo] } = await client.query(`
      INSERT INTO tenants (name, slug, plan, max_users, max_api_calls)
      VALUES ('Demo Company', 'demo', 'PRO', 50, 50000)
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `);

    await client.query(`
      INSERT INTO subscriptions (tenant_id, plan, status)
      VALUES ($1, 'PRO', 'ACTIVE')
      ON CONFLICT (tenant_id) DO NOTHING
    `, [demo.id]);

    const demoFlags = [
      ['analytics', true, 'Analytics dashboard'],
      ['audit_logs', true, 'Audit logging'],
      ['email_notifications', true, 'Email notifications'],
      ['api_access', true, 'API access'],
      ['advanced_reports', true, 'Advanced reporting'],
      ['ai_assistant', true, 'AI assistant features'],
      ['custom_roles', false, 'Custom role creation'],
      ['sso', false, 'Single Sign-On'],
    ];
    for (const [key, enabled, description] of demoFlags) {
      await client.query(`
        INSERT INTO feature_flags (tenant_id, key, enabled, description)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (tenant_id, key) DO NOTHING
      `, [demo.id, key, enabled, description]);
    }

    // ── Acme tenant ─────────────────────────────────────────────────
    const { rows: [acme] } = await client.query(`
      INSERT INTO tenants (name, slug, plan, max_users, max_api_calls)
      VALUES ('Acme Corp', 'acme', 'ENTERPRISE', 999999, 999999)
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `);

    await client.query(`
      INSERT INTO subscriptions (tenant_id, plan, status)
      VALUES ($1, 'ENTERPRISE', 'ACTIVE')
      ON CONFLICT (tenant_id) DO NOTHING
    `, [acme.id]);

    const enterpriseFlags = demoFlags.map(([key, , desc]) => [
      key, true, desc,
    ]);
    for (const [key, enabled, description] of enterpriseFlags) {
      await client.query(`
        INSERT INTO feature_flags (tenant_id, key, enabled, description)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (tenant_id, key) DO NOTHING
      `, [acme.id, key, enabled, description]);
    }

    await client.query('COMMIT');
    console.log('Seed complete. Tenants: demo, acme');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(() => process.exit(1));
