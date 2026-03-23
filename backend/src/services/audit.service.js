const auditRepository = require('../repositories/audit.repository');

class AuditService {
  getLogs(tenantId, filters) {
    return auditRepository.findAll({ tenantId, ...filters });
  }
  createLog(data) {
    return auditRepository.create(data);
  }
}

module.exports = new AuditService();
