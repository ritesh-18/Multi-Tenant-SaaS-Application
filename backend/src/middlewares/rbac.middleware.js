const { hasPermission, hasMinRole } = require('../utils/permissions');
const ApiResponse = require('../utils/response');
const logger = require('../utils/logger');

function requirePermission(permission) {
  return (req, res, next) => {
    const user = req.dbUser;
    if (!user) return ApiResponse.unauthorized(res);
    if (!hasPermission(user.role, permission)) {
      logger.warn('Permission denied', { userId: user.id, role: user.role, permission });
      return ApiResponse.forbidden(res, `Insufficient permissions. Required: ${permission}`);
    }
    next();
  };
}

function requireRole(role) {
  return (req, res, next) => {
    const user = req.dbUser;
    if (!user) return ApiResponse.unauthorized(res);
    if (!hasMinRole(user.role, role)) {
      logger.warn('Role requirement not met', { userId: user.id, userRole: user.role, requiredRole: role });
      return ApiResponse.forbidden(res, `Insufficient role. Required: ${role} or higher`);
    }
    next();
  };
}

function requireTenantMembership(req, res, next) {
  const user = req.dbUser;
  const tenant = req.tenant;
  if (!user || !tenant) return ApiResponse.unauthorized(res);
  if (user.tenant_id !== tenant.id && user.role !== 'SUPER_ADMIN') {
    logger.warn('Cross-tenant access attempt', { userId: user.id, userTenantId: user.tenant_id, requestedTenantId: tenant.id });
    return ApiResponse.forbidden(res, 'Access to this tenant is not allowed');
  }
  next();
}

module.exports = { requirePermission, requireRole, requireTenantMembership };
