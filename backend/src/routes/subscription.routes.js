const router = require('express').Router();
const c = require('../controllers/subscription.controller');
const { authenticate, loadDbUser } = require('../middlewares/auth.middleware');
const { resolveTenant } = require('../middlewares/tenant.middleware');
const { requirePermission, requireTenantMembership } = require('../middlewares/rbac.middleware');
const { auditLog } = require('../middlewares/audit.middleware');
const { PERMISSIONS } = require('../utils/permissions');

const tenantAuth = [authenticate, resolveTenant, loadDbUser, requireTenantMembership];

router.get('/plans', c.getPlans.bind(c));
router.get('/',      ...tenantAuth, requirePermission(PERMISSIONS.SUBSCRIPTION_READ),   c.get.bind(c));
router.post('/upgrade', ...tenantAuth, requirePermission(PERMISSIONS.SUBSCRIPTION_UPDATE), auditLog('UPGRADE', 'subscription'), c.upgrade.bind(c));

module.exports = router;
