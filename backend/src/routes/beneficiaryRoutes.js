const express = require('express');
const router = express.Router();
const beneficiaryController = require('../controllers/beneficiaryController');
const { authenticate, requireRoles } = require('../middleware/auth');

router.use(authenticate);

// Duplicate check helper
router.get('/check-id', beneficiaryController.checkIdAvailability);

// Read beneficiaries (scoped by role/office)
router.get('/', beneficiaryController.getBeneficiaries);
router.get('/:id', beneficiaryController.getBeneficiaryById);

// Kebele officers and Admin register beneficiaries
router.post(
  '/',
  requireRoles('admin', 'kebele_officer'),
  beneficiaryController.registerBeneficiary
);

// Verify beneficiary
router.post(
  '/:id/verify',
  requireRoles('admin', 'kebele_officer', 'woreda_officer'),
  beneficiaryController.verifyBeneficiary
);

// Suspend beneficiary
router.post(
  '/:id/suspend',
  requireRoles('admin', 'kebele_officer', 'woreda_officer'),
  beneficiaryController.suspendBeneficiary
);

module.exports = router;
