const router = require('express').Router();
const c = require('../controllers/tenant.controller');
const { authenticate, loadDbUser } = require('../middlewares/auth.middleware');
const { resolveTenant } = require('../middlewares/tenant.middleware');
const { requirePermission, requireRole } = require('../middlewares/rbac.middleware');
const { auditLog } = require('../middlewares/audit.middleware');
const { PERMISSIONS } = require('../utils/permissions');

// Current tenant (resolved from X-Tenant-Slug)
router.get('/current',       authenticate, resolveTenant, loadDbUser, c.getCurrent.bind(c));
router.get('/current/stats', authenticate, resolveTenant, loadDbUser, c.getStats.bind(c));

// Super-admin: all tenants
router.get('/',    authenticate, loadDbUser, requireRole('SUPER_ADMIN'), c.getAll.bind(c));
router.post('/',   authenticate, loadDbUser, requireRole('SUPER_ADMIN'), auditLog('CREATE', 'tenant'), c.create.bind(c));
router.get('/:id', authenticate, loadDbUser, requirePermission(PERMISSIONS.TENANT_READ), c.getById.bind(c));
router.put('/:id', authenticate, loadDbUser, requirePermission(PERMISSIONS.TENANT_UPDATE), auditLog('UPDATE', 'tenant'), c.update.bind(c));
router.delete('/:id', authenticate, loadDbUser, requireRole('SUPER_ADMIN'), auditLog('DELETE', 'tenant'), c.delete.bind(c));
router.get('/:id/stats', authenticate, loadDbUser, requirePermission(PERMISSIONS.TENANT_READ), c.getStats.bind(c));

module.exports = router;
