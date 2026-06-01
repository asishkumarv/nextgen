const express = require('express');
const router = express.Router();
const { getWalletStats, requestWithdrawal } = require('../controllers/walletController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getWalletStats);
router.post('/withdraw', protect, requestWithdrawal);

module.exports = router;
