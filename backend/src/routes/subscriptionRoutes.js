const express = require('express');
const router = express.Router();
const { 
  bookSlot, 
  cancelSlot, 
  getBookedSlots, 
  getDistricts, 
  getMandals 
} = require('../controllers/subscriptionController');
const { authenticateUser } = require('../middleware/auth');

router.post('/book', authenticateUser, bookSlot);
router.post('/cancel', authenticateUser, cancelSlot);
router.get('/booked', getBookedSlots);
router.get('/districts', getDistricts);
router.get('/mandals', getMandals);

module.exports = router;
