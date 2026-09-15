const express = require('express');
const router = express.Router();
const { register, login, getMe, updateProfile, changePassword, sendOtp, resetPassword } = require('../controllers/authController');
const { authenticateUser } = require('../middleware/auth');

router.post('/send-otp', sendOtp);
router.post('/reset-password', resetPassword);
router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticateUser, getMe);
router.put('/profile', authenticateUser, updateProfile);
router.put('/change-password', authenticateUser, changePassword);

module.exports = router;
