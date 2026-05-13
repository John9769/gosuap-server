const express = require('express');
const router = express.Router();
const { getNearbyShops, getStates } = require('../controllers/publicController');

// NOTICE: No "protect" middleware here. This is for the public!
router.get('/discovery', getNearbyShops);
router.get('/states', getStates);

module.exports = router;