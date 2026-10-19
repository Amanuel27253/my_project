const express = require('express');
const router = express.Router();
const goodsController = require('../controllers/goodsController');
const { authenticate, requireRoles } = require('../middleware/auth');

router.use(authenticate);

router.get('/', goodsController.getGoods);
router.get('/:id', goodsController.getGoodById);

// Admin-only catalog modifications
router.post('/', requireRoles('admin'), goodsController.createGood);
router.put('/:id', requireRoles('admin'), goodsController.updateGood);

module.exports = router;
