const router = require('express').Router();
const c = require('../controllers/user.controller');
const { authenticate, loadDbUser } = require('../middlewares/auth.middleware');
const { resolveTenant } = require('../middlewares/tenant.middleware');
const { requirePermission, requireTenantMembership } = require('../middlewares/rbac.middleware');
const { auditLog } = require('../middlewares/audit.middleware');
const { PERMISSIONS } = require('../utils/permissions');

const tenantAuth = [authenticate, resolveTenant, loadDbUser, requireTenantMembership];

router.get('/me', authenticate, loadDbUser, c.getMe.bind(c));
router.get('/me/notifications', authenticate, resolveTenant, loadDbUser, c.getNotifications.bind(c));
router.put('/notifications/:id/read', authenticate, resolveTenant, loadDbUser, c.markNotificationRead.bind(c));

router.post('/accept-invite/:token', authenticate, c.acceptInvite.bind(c));
router.post('/invite', ...tenantAuth, requirePermission(PERMISSIONS.USER_INVITE), auditLog('INVITE', 'user'), c.invite.bind(c));

router.get('/',    ...tenantAuth, requirePermission(PERMISSIONS.USER_READ),   c.getAll.bind(c));
router.get('/:id', ...tenantAuth, requirePermission(PERMISSIONS.USER_READ),   c.getById.bind(c));
router.put('/:id', ...tenantAuth, requirePermission(PERMISSIONS.USER_UPDATE), auditLog('UPDATE', 'user'), c.update.bind(c));
router.delete('/:id', ...tenantAuth, requirePermission(PERMISSIONS.USER_DELETE), auditLog('DELETE', 'user'), c.delete.bind(c));

module.exports = router;
