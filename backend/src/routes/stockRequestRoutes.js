const express = require('express');
const router = express.Router();
const stockRequestController = require('../controllers/stockRequestController');
const { authenticate, requireRoles } = require('../middleware/auth');

router.use(authenticate);

router.get('/', stockRequestController.getStockRequests);
router.get('/:id', stockRequestController.getStockRequestById);

// Submit request (Woreda officer, Kebele officer, admin)
router.post(
  '/',
  requireRoles('admin', 'woreda_officer', 'kebele_officer'),
  stockRequestController.createStockRequest
);

// Approve or reject (Zone officer approves Woreda, Woreda officer approves Kebele, admin)
router.post(
  '/:id/decide',
  requireRoles('admin', 'zone_officer', 'woreda_officer'),
  stockRequestController.decideStockRequest
);

// Cancel pending request
router.post(
  '/:id/cancel',
  requireRoles('admin', 'woreda_officer', 'kebele_officer'),
  stockRequestController.cancelStockRequest
);

module.exports = router;
