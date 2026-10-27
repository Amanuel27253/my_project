const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, requireRoles } = require('../middleware/auth');

router.use(authenticate);

// List and get user
router.get('/', userController.getUsers);
router.get('/:id', userController.getUserById);

// Admin-only mutations
router.post('/', requireRoles('admin'), userController.createUser);
router.put('/:id', requireRoles('admin'), userController.updateUser);
router.post('/:id/reset-password', requireRoles('admin'), userController.resetPassword);
router.patch('/:id/status', requireRoles('admin'), userController.updateUserStatus);

module.exports = router;
