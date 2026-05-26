const express = require('express');
const router = express.Router();
const { getMyBookings, createBooking, cancelBooking } = require('../controllers/bookingController');
const { authenticateUser } = require('../middleware/auth');

router.get('/', authenticateUser, getMyBookings);
router.post('/', authenticateUser, createBooking);
router.put('/:id/cancel', authenticateUser, cancelBooking);

module.exports = router;
