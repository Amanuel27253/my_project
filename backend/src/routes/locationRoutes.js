const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');
const { authenticate, requireRoles } = require('../middleware/auth');

router.use(authenticate);

router.get('/hierarchy', locationController.getLocationHierarchy);
router.get('/', locationController.getLocations);
router.get('/:id', locationController.getLocationById);

// Admin-only creation and update
router.post('/', requireRoles('admin'), locationController.createLocation);
router.put('/:id', requireRoles('admin'), locationController.updateLocation);

module.exports = router;
