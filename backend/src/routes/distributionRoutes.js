const express = require('express');
const router = express.Router();
const distributionController = require('../controllers/distributionController');
const { authenticate, requireRoles } = require('../middleware/auth');

router.use(authenticate);

router.get('/', distributionController.getDistributions);
router.get('/:id', distributionController.getDistributionById);
router.get('/:id/receipt', distributionController.getDistributionReceipt);

// Only Kebele Officers and Admin can execute distributions
router.post(
  '/',
  requireRoles('admin', 'kebele_officer'),
  distributionController.recordDistribution
);

module.exports = router;
