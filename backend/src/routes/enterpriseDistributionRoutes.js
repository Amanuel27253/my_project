const express = require('express');
const router = express.Router();
const enterpriseDistributionController = require('../controllers/enterpriseDistributionController');
const systemAdminController = require('../controllers/systemAdminController');
const { authenticate, requireRoles } = require('../middleware/auth');

// ==========================================
// ZERO-LOGIN PUBLIC TRANSPARENCY PORTAL
// ==========================================
router.get('/public/portal', enterpriseDistributionController.getPublicPortalData);
router.get('/public/ration-check', enterpriseDistributionController.checkPublicRationStatus);
router.get('/public/woredas', enterpriseDistributionController.getAllWoredas);

// ==========================================
// AUTHENTICATED ENDPOINTS
// ==========================================
router.use(authenticate);

// Zone Woredas Directory
router.get('/woredas', enterpriseDistributionController.getAllWoredas);

// ==========================================
// SYSTEM ADMINISTRATOR (TECHNICAL CONTROL)
// ==========================================
router.get(
  '/admin/security-overview',
  requireRoles('admin', 'SYSTEM_ADMIN'),
  systemAdminController.getSecurityOverview
);
router.post(
  '/admin/backup',
  requireRoles('admin', 'SYSTEM_ADMIN'),
  systemAdminController.triggerDatabaseBackup
);
router.get(
  '/admin/backups',
  requireRoles('admin', 'SYSTEM_ADMIN'),
  systemAdminController.getBackupHistory
);
router.post(
  '/admin/provision-woreda-officer',
  requireRoles('admin', 'SYSTEM_ADMIN'),
  systemAdminController.provisionWoredaOfficer
);

// 1. Zone Expert
router.get(
  '/zone/overview',
  requireRoles('admin', 'SYSTEM_ADMIN', 'zone_officer', 'ZONE_EXPERT'),
  enterpriseDistributionController.getZoneOverview
);

router.put(
  '/zone/price-ceiling/:goodsId',
  requireRoles('admin', 'SYSTEM_ADMIN', 'zone_officer', 'ZONE_EXPERT'),
  enterpriseDistributionController.updatePriceCeiling
);

router.post(
  '/zone/allocate-woredas',
  requireRoles('admin', 'SYSTEM_ADMIN', 'zone_officer', 'ZONE_EXPERT'),
  enterpriseDistributionController.allocateStockToWoredas
);

// 2. Woreda Officer
router.get(
  '/woreda/dashboard',
  requireRoles('admin', 'SYSTEM_ADMIN', 'zone_officer', 'ZONE_EXPERT', 'woreda_officer', 'WOREDA_OFFICER'),
  enterpriseDistributionController.getWoredaDashboard
);
router.get(
  '/woreda/dashboard/:woredaId',
  requireRoles('admin', 'SYSTEM_ADMIN', 'zone_officer', 'ZONE_EXPERT', 'woreda_officer', 'WOREDA_OFFICER'),
  enterpriseDistributionController.getWoredaDashboard
);

router.post(
  '/woreda/allocate-kebeles',
  requireRoles('admin', 'SYSTEM_ADMIN', 'woreda_officer', 'WOREDA_OFFICER'),
  enterpriseDistributionController.allocateStockToKebeles
);

router.get(
  '/woreda/allocation-letter/:cycleId/:kebeleId',
  requireRoles('admin', 'SYSTEM_ADMIN', 'woreda_officer', 'WOREDA_OFFICER', 'kebele_officer', 'KEBELE_OFFICER', 'store_manager', 'STOREKEEPER'),
  enterpriseDistributionController.getAllocationLetter
);

// 3. Storekeeper (Simplified Stock Balance Model & POS Handover)
router.post(
  '/store/confirm-receipt',
  requireRoles('admin', 'SYSTEM_ADMIN', 'store_manager', 'STOREKEEPER'),
  enterpriseDistributionController.confirmStockArrival
);

router.get(
  '/store/stocks/:kebeleId',
  enterpriseDistributionController.getStoreStock
);

router.get(
  '/store/pos-search',
  requireRoles('admin', 'SYSTEM_ADMIN', 'store_manager', 'STOREKEEPER'),
  enterpriseDistributionController.posSearchHousehold
);

router.post(
  '/store/pos-handover',
  requireRoles('admin', 'SYSTEM_ADMIN', 'store_manager', 'STOREKEEPER'),
  enterpriseDistributionController.executePosHandover
);

router.get(
  '/store/daily-report',
  requireRoles('admin', 'SYSTEM_ADMIN', 'store_manager', 'STOREKEEPER', 'woreda_officer', 'WOREDA_OFFICER'),
  enterpriseDistributionController.getDailyStockCashReport
);

router.post(
  '/store/send-sms',
  requireRoles('admin', 'SYSTEM_ADMIN', 'store_manager', 'STOREKEEPER', 'kebele_officer', 'KEBELE_OFFICER'),
  enterpriseDistributionController.sendSmsNotification
);

router.get(
  '/store/notice-poster/:kebeleId/:cycleId?',
  enterpriseDistributionController.getPrintableNoticePoster
);

// 4. Got Pickup Schedules (Kebele Officer)
router.get(
  '/schedules',
  enterpriseDistributionController.getGotSchedules
);

router.post(
  '/schedules',
  requireRoles('admin', 'SYSTEM_ADMIN', 'kebele_officer', 'KEBELE_OFFICER', 'store_manager', 'STOREKEEPER'),
  enterpriseDistributionController.createOrUpdateGotSchedule
);

module.exports = router;
