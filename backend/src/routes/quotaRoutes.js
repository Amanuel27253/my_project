const express = require('express');
const router = express.Router();
const quotaController = require('../controllers/quotaController');
const { authenticate, requireRoles } = require('../middleware/auth');

router.use(authenticate);

// List active quota rules
router.get('/', quotaController.getQuotaRules);

// Check quota balance for specific beneficiary
router.get('/beneficiary/:beneficiaryId', quotaController.getBeneficiaryQuota);

// Admin or Zone Officer can set quota rules
router.post(
  '/',
  requireRoles('admin', 'zone_officer'),
  quotaController.upsertQuotaRule
);

module.exports = router;
