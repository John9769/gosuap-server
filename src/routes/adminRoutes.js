const express = require('express');
const router = express.Router();
const { getPendingApprovals, approveVendor, setPremium, getPlatformStats } = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/adminMiddleware');

router.get('/pending', protect, isAdmin, getPendingApprovals);
router.post('/approve', protect, isAdmin, approveVendor);
router.post('/set-premium', protect, isAdmin, setPremium);
router.get('/stats', protect, isAdmin, getPlatformStats);

module.exports = router;