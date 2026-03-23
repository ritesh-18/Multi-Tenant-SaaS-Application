const { query } = require('../config/database');
const logger = require('../utils/logger');

function trackApiUsage() {
  return (req, res, next) => {
    const start = Date.now();
    const originalEnd = res.end.bind(res);

    res.end = async (...args) => {
      if (req.tenant) {
        const responseTimeMs = Date.now() - start;
        query(
          `INSERT INTO api_usage_logs (tenant_id, endpoint, method, status_code, response_time_ms)
           VALUES ($1, $2, $3, $4, $5)`,
          [req.tenant.id, req.path, req.method, res.statusCode, responseTimeMs]
        ).catch((err) => logger.error('API usage log failed', { error: err.message }));
      }
      return originalEnd(...args);
    };
    next();
  };
}

module.exports = { trackApiUsage };
