const router = require('express').Router();
const c = require('../controllers/feature-flag.controller');
const { authenticate, loadDbUser } = require('../middlewares/auth.middleware');
const { resolveTenant } = require('../middlewares/tenant.middleware');
const { requirePermission, requireTenantMembership } = require('../middlewares/rbac.middleware');
const { auditLog } = require('../middlewares/audit.middleware');
const { PERMISSIONS } = require('../utils/permissions');

const tenantAuth = [authenticate, resolveTenant, loadDbUser, requireTenantMembership];

router.get('/',         ...tenantAuth, requirePermission(PERMISSIONS.FEATURE_FLAG_READ),   c.getAll.bind(c));
router.put('/:key',     ...tenantAuth, requirePermission(PERMISSIONS.FEATURE_FLAG_UPDATE), auditLog('UPDATE', 'feature_flag'), c.update.bind(c));
router.post('/bulk',    ...tenantAuth, requirePermission(PERMISSIONS.FEATURE_FLAG_UPDATE), auditLog('BULK_UPDATE', 'feature_flag'), c.bulkUpdate.bind(c));

module.exports = router;
