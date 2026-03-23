const auditService = require('../services/audit.service');
const ApiResponse = require('../utils/response');

class AuditController {
  async getLogs(req, res, next) {
    try {
      const { page = 1, limit = 50, userId, action, resource, from, to } = req.query;
      const { logs, total } = await auditService.getLogs(req.tenant.id, {
        page: +page, limit: +limit, userId, action, resource, from, to,
      });
      return ApiResponse.paginated(res, logs, total, page, limit);
    } catch (err) { next(err); }
  }
}

module.exports = new AuditController();
