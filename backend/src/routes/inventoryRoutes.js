const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { authenticate, requireRoles } = require('../middleware/auth');

router.use(authenticate);

// Public inventory reading (scoped to office)
router.get('/', inventoryController.getInventory);
router.get('/expiring', inventoryController.getExpiringBatches);
router.get('/movements', inventoryController.getStockMovements);
router.get('/levels', inventoryController.getStockLevels);

// Store managers and admin can receive stock, adjust stock, or write off
router.post('/receive', requireRoles('admin', 'store_manager'), inventoryController.receiveSupplierStock);
router.post('/adjust', requireRoles('admin', 'store_manager'), inventoryController.adjustStock);
router.post('/write-off', requireRoles('admin', 'store_manager'), inventoryController.writeOffStock);
router.post('/levels', requireRoles('admin', 'zone_officer'), inventoryController.setStockLevel);

module.exports = router;
