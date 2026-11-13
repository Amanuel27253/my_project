const express = require('express');
const router = express.Router();
const beneficiaryController = require('../controllers/beneficiaryController');
const { authenticate, requireRoles } = require('../middleware/auth');

router.use(authenticate);

// Duplicate check helper
router.get('/check-id', beneficiaryController.checkIdAvailability);

// Booklet slip data
router.get('/:id/booklet-slip', beneficiaryController.getBookletSlipData);

// Read beneficiaries (scoped by role/office)
router.get('/', beneficiaryController.getBeneficiaries);
router.get('/:id', beneficiaryController.getBeneficiaryById);

// Register beneficiaries
router.post(
  '/',
  requireRoles('admin', 'SYSTEM_ADMIN', 'kebele_officer', 'KEBELE_OFFICER'),
  beneficiaryController.registerBeneficiary
);

// Update family members and status
router.put(
  '/:id/family',
  requireRoles('admin', 'SYSTEM_ADMIN', 'kebele_officer', 'KEBELE_OFFICER'),
  beneficiaryController.updateFamilyMembers
);

// Inter-Kebele transfers
router.post(
  '/:id/transfer-request',
  requireRoles('admin', 'SYSTEM_ADMIN', 'kebele_officer', 'KEBELE_OFFICER', 'woreda_officer', 'WOREDA_OFFICER'),
  beneficiaryController.requestHouseholdTransfer
);

router.post(
  '/:id/transfer-approve',
  requireRoles('admin', 'SYSTEM_ADMIN', 'woreda_officer', 'WOREDA_OFFICER'),
  beneficiaryController.approveHouseholdTransfer
);

// Verify beneficiary
router.post(
  '/:id/verify',
  requireRoles('admin', 'SYSTEM_ADMIN', 'kebele_officer', 'KEBELE_OFFICER', 'woreda_officer', 'WOREDA_OFFICER'),
  beneficiaryController.verifyBeneficiary
);

// Suspend beneficiary
router.post(
  '/:id/suspend',
  requireRoles('admin', 'SYSTEM_ADMIN', 'kebele_officer', 'KEBELE_OFFICER', 'woreda_officer', 'WOREDA_OFFICER'),
  beneficiaryController.suspendBeneficiary
);

module.exports = router;
