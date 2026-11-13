const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, requireRoles } = require('../middleware/auth');

router.use(authenticate);

// List and get user
router.get('/', requireRoles('admin', 'SYSTEM_ADMIN', 'zone_officer', 'ZONE_EXPERT', 'woreda_officer', 'WOREDA_OFFICER'), userController.getUsers);
router.get('/:id', userController.getUserById);

// Admin & Delegated Woreda mutations
router.post('/', requireRoles('admin', 'SYSTEM_ADMIN', 'woreda_officer', 'WOREDA_OFFICER'), userController.createUser);
router.put('/:id', requireRoles('admin', 'SYSTEM_ADMIN', 'woreda_officer', 'WOREDA_OFFICER'), userController.updateUser);
router.post('/:id/reset-password', requireRoles('admin', 'SYSTEM_ADMIN', 'woreda_officer', 'WOREDA_OFFICER'), userController.resetPassword);
router.patch('/:id/status', requireRoles('admin', 'SYSTEM_ADMIN', 'woreda_officer', 'WOREDA_OFFICER'), userController.updateUserStatus);

module.exports = router;
