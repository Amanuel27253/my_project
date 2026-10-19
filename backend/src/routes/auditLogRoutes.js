const express = require('express');
const router = express.Router();
const auditLogController = require('../controllers/auditLogController');
const { authenticate, requireRoles } = require('../middleware/auth');

router.use(authenticate);

// Viewable only by Administrator (FR-AUD-02)
router.get('/', requireRoles('admin'), auditLogController.getAuditLogs);

module.exports = router;
