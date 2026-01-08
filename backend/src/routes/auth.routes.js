const router = require('express').Router();
const authController = require('../controllers/auth.controller');

router.get('/google', authController.login);
router.post('/login', authController.loginwithPassword);
router.get('/callback', authController.callback);
router.post('/refresh', authController.refresh);

module.exports = router;
