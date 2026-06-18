const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');
const { getNotifications, markAsRead, markAllAsRead } = require('../controllers/notificationController');

router.get('/', authenticateUser, getNotifications);
router.put('/read-all', authenticateUser, markAllAsRead);
router.put('/:id/read', authenticateUser, markAsRead);

module.exports = router;
