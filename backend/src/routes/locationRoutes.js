const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');
const { authenticate, requireRoles } = require('../middleware/auth');

router.use(authenticate);

// Auto-suggest next unique code for Woreda, Kebele, or Distributor
router.get('/next-code', locationController.getNextLocationCode);

// Hierarchy and listings
router.get('/hierarchy', locationController.getLocationHierarchy);
router.get('/distributors', locationController.getDistributors);
router.get('/', locationController.getLocations);
router.get('/:id', locationController.getLocationById);

// Option A: Cascading Atomic Creation Endpoints
// 1. Zone adds Woreda and provisions Woreda Officer
router.post(
  '/woreda-with-officer',
  requireRoles('admin', 'SYSTEM_ADMIN', 'zone_officer', 'ZONE_EXPERT'),
  locationController.createWoredaWithOfficer
);

// 2. Woreda adds Kebele and provisions Kebele Officer
router.post(
  '/kebele-with-officer',
  requireRoles('admin', 'SYSTEM_ADMIN', 'woreda_officer', 'WOREDA_OFFICER'),
  locationController.createKebeleWithOfficer
);

// 3. Woreda registers Distributor and provisions Storekeeper
router.post(
  '/distributor-with-storekeeper',
  requireRoles('admin', 'SYSTEM_ADMIN', 'woreda_officer', 'WOREDA_OFFICER'),
  locationController.createDistributorWithStorekeeper
);

// Admin-only standard creation and update
router.post('/', requireRoles('admin', 'SYSTEM_ADMIN'), locationController.createLocation);
router.put('/:id', requireRoles('admin', 'SYSTEM_ADMIN'), locationController.updateLocation);

module.exports = router;
