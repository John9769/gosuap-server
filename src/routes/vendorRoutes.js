const express = require('express');
const router = express.Router();
const { createVendor, getAgentVendors } = require('../controllers/vendorController');
const { upload, uploadImage } = require('../controllers/uploadController');
const { protect } = require('../middleware/authMiddleware');

router.post('/upload', protect, upload.single('image'), uploadImage);
router.post('/onboard', protect, createVendor);
router.get('/my-shops', protect, getAgentVendors);

module.exports = router;