const { query } = require('../config/database');
const logger = require('../utils/logger');

function auditLog(action, resource) {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = async (body) => {
      if (res.statusCode < 400 && req.tenant && req.dbUser) {
        try {
          const resourceId = req.params.id || body?.data?.id || null;
          await query(`
            INSERT INTO audit_logs (tenant_id, user_id, action, resource, resource_id, metadata, ip_address, user_agent)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          `, [
            req.tenant.id, req.dbUser.id, action, resource, resourceId,
            JSON.stringify({ method: req.method, path: req.path, statusCode: res.statusCode }),
            req.ip, req.headers['user-agent'] || null,
          ]);
        } catch (err) {
          logger.error('Audit log failed', { error: err.message });
        }
      }
      return originalJson(body);
    };
    next();
  };
}

module.exports = { auditLog };
