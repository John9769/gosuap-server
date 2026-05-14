const express = require('express');
const router = express.Router();
const {
    getPendingApprovals,
    approveVendor,
    setPremium,
    getPlatformStats,
    createAgent,
    getActiveVendors,
    getAgentStats
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/adminMiddleware');

router.get('/pending', protect, isAdmin, getPendingApprovals);
router.post('/approve', protect, isAdmin, approveVendor);
router.post('/set-premium', protect, isAdmin, setPremium);
router.get('/stats', protect, isAdmin, getPlatformStats);
router.post('/create-agent', protect, isAdmin, createAgent);
router.get('/vendors', protect, isAdmin, getActiveVendors);
router.get('/agents', protect, isAdmin, getAgentStats);

module.exports = router;