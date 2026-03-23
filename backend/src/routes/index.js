const router = require('express').Router();

router.get('/health', (req, res) => res.json({
  success: true,
  message: 'API is healthy',
  version: '1.0.0',
  timestamp: new Date().toISOString(),
}));

router.use('/auth',          require('./auth.routes'));
router.use('/tenants',       require('./tenant.routes'));
router.use('/users',         require('./user.routes'));
router.use('/subscriptions', require('./subscription.routes'));
router.use('/feature-flags', require('./feature-flag.routes'));
router.use('/analytics',     require('./analytics.routes'));
router.use('/audit-logs',    require('./audit.routes'));

module.exports = router;
