const router = require('express').Router();
const c = require('../controllers/analytics.controller');
const { authenticate, loadDbUser } = require('../middlewares/auth.middleware');
const { resolveTenant } = require('../middlewares/tenant.middleware');
const { requirePermission, requireTenantMembership } = require('../middlewares/rbac.middleware');
const { PERMISSIONS } = require('../utils/permissions');

const tenantAuth = [authenticate, resolveTenant, loadDbUser, requireTenantMembership];

router.get('/dashboard',     ...tenantAuth, requirePermission(PERMISSIONS.ANALYTICS_READ), c.getDashboard.bind(c));
router.get('/api-usage',     ...tenantAuth, requirePermission(PERMISSIONS.ANALYTICS_READ), c.getApiUsage.bind(c));
router.get('/top-endpoints', ...tenantAuth, requirePermission(PERMISSIONS.ANALYTICS_READ), c.getTopEndpoints.bind(c));
router.get('/user-activity', ...tenantAuth, requirePermission(PERMISSIONS.ANALYTICS_READ), c.getUserActivity.bind(c));

module.exports = router;
