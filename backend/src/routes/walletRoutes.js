const express = require('express');
const router = express.Router();
const { getWalletStats, requestWithdrawal } = require('../controllers/walletController');
const { authenticateUser } = require('../middleware/auth');

router.get('/', authenticateUser, getWalletStats);
router.post('/withdraw', authenticateUser, requestWithdrawal);

module.exports = router;
