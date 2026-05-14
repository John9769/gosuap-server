const express = require('express');
const router = express.Router();
const { submitPayment, verifyPayment, getAgentPayments, getPendingPayments } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/adminMiddleware');

// Agent routes
router.post('/submit', protect, submitPayment);
router.get('/my-payments', protect, getAgentPayments);

// Admin routes
router.get('/pending', protect, isAdmin, getPendingPayments);
router.post('/verify', protect, isAdmin, verifyPayment);

module.exports = router;