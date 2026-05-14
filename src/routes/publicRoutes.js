const express = require('express');
const router = express.Router();
const { getNearbyShops, getStates, getVendorById } = require('../controllers/publicController');

// NOTICE: No "protect" middleware here. This is for the public!
router.get('/discovery', getNearbyShops);
router.get('/states', getStates);
router.get('/vendor/:id', getVendorById);

module.exports = router;