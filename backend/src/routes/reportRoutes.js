const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/inventory', reportController.getInventoryReport);
router.get('/distribution', reportController.getDistributionReport);
router.get('/beneficiaries', reportController.getBeneficiariesReport);

module.exports = router;
