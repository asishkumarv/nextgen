const express = require('express');
const router = express.Router();
const { getMyBookings, createBooking } = require('../controllers/bookingController');
const { authenticateUser } = require('../middleware/auth');

router.get('/', authenticateUser, getMyBookings);
router.post('/', authenticateUser, createBooking);

module.exports = router;
