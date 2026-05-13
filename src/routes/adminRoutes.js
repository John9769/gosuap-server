const express = require('express');
const router = express.Router();
const { getPendingApprovals, approveVendor, getPlatformStats } = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/adminMiddleware');

// All routes here require: 1. Login (protect) AND 2. Admin role (isAdmin)
router.get('/pending', protect, isAdmin, getPendingApprovals);
router.post('/approve', protect, isAdmin, approveVendor);
router.get('/stats', protect, isAdmin, getPlatformStats);

module.exports = router;