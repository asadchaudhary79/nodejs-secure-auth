const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { hasRole, hasAnyRole, hasAllRoles } = require('../middlewares/authMiddleware');


// Remove the global admin middleware since we'll use specific role checks
// router.use(isAdmin);

// Get all blocked users - accessible by admin or moderator
router.get('/blocked-users', hasAnyRole('admin', 'moderator'), adminController.getBlockedUsers);

// Unblock a user - only admin can unblock
router.post('/unblock-user/:userId', hasRole('admin'), adminController.unblockUser);

// Manually block a user - only admin can block
router.post('/block-user/:userId', hasRole('admin'), adminController.blockUser);



module.exports = router; 