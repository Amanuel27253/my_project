const express = require('express');
const router = express.Router();
const transferController = require('../controllers/transferController');
const { authenticate, requireRoles } = require('../middleware/auth');

router.use(authenticate);

router.get('/', transferController.getTransfers);
router.get('/:id', transferController.getTransferById);

// Store managers or Admin can dispatch transfers
router.post(
  '/dispatch',
  requireRoles('admin', 'store_manager'),
  transferController.dispatchTransfer
);

// Store managers or Admin confirm receipt
router.post(
  '/:id/receive',
  requireRoles('admin', 'store_manager'),
  transferController.confirmReceipt
);

module.exports = router;
