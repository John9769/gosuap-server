const express = require('express');
const router = express.Router();
const { createVendor, getAgentVendors } = require('../controllers/vendorController');
const { protect } = require('../middleware/authMiddleware');

// All vendor routes are protected—only logged-in agents can use them
router.post('/onboard', protect, createVendor);
router.get('/my-shops', protect, getAgentVendors);

module.exports = router;