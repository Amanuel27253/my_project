const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');
const { authenticate, requireRoles } = require('../middleware/auth');

router.use(authenticate);

router.get('/', alertController.getAlerts);
router.patch('/:id/dismiss', alertController.dismissAlert);

// Manual scan trigger
router.post('/scan', requireRoles('admin', 'zone_officer'), alertController.triggerAlertScan);

module.exports = router;
