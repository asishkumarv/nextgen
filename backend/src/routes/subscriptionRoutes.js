const express = require('express');
const router = express.Router();
const { 
  bookSlot, 
  cancelSlot, 
  getBookedSlots, 
  getDistricts, 
  getMandals,
  getEvents
} = require('../controllers/subscriptionController');
const { authenticateUser } = require('../middleware/auth');

router.post('/book', authenticateUser, bookSlot);
router.post('/cancel', authenticateUser, cancelSlot);
router.get('/booked', getBookedSlots);
router.get('/districts', getDistricts);
router.get('/mandals', getMandals);
router.get('/events', getEvents);

module.exports = router;
