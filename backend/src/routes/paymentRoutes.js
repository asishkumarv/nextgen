const express = require('express');
const router = express.Router();
const { createOrder, verifyPayment, getRazorpayKey } = require('../controllers/paymentController');
const { authenticateUser } = require('../middleware/auth');

router.get('/key', getRazorpayKey);
router.post('/create-order', authenticateUser, createOrder);
router.post('/verify-payment', authenticateUser, verifyPayment);

module.exports = router;
