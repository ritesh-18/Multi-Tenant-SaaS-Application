const router = require('express').Router();
const c = require('../controllers/audit.controller');
const { authenticate, loadDbUser } = require('../middlewares/auth.middleware');
const { resolveTenant } = require('../middlewares/tenant.middleware');
const { requirePermission, requireTenantMembership } = require('../middlewares/rbac.middleware');
const { PERMISSIONS } = require('../utils/permissions');

const tenantAuth = [authenticate, resolveTenant, loadDbUser, requireTenantMembership];

router.get('/', ...tenantAuth, requirePermission(PERMISSIONS.AUDIT_LOG_READ), c.getLogs.bind(c));

module.exports = router;
