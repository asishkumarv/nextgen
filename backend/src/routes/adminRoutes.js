const express = require('express');
const router = express.Router();
const {
  adminLogin,
  getAdminMe,
  getDashboardStats,
  getUsers,
  getSubscribers,
  getBookings,
  completeBooking,
  cancelBooking,
  adminGetServices,
  adminAddService,
  adminUpdateService,
  adminDeleteService,
  getVendors,
  approveVendor,
  rejectVendor
} = require('../controllers/adminController');
const { authenticateAdmin } = require('../middleware/auth');

router.post('/login', adminLogin);
router.get('/me', authenticateAdmin, getAdminMe);
router.get('/dashboard-stats', authenticateAdmin, getDashboardStats);
router.get('/users', authenticateAdmin, getUsers);
router.get('/subscribers', authenticateAdmin, getSubscribers);
router.get('/bookings', authenticateAdmin, getBookings);
router.put('/bookings/:id/complete', authenticateAdmin, completeBooking);
router.delete('/bookings/:id', authenticateAdmin, cancelBooking);

// Vendor management routes
router.get('/vendors', authenticateAdmin, getVendors);
router.put('/vendors/:id/approve', authenticateAdmin, approveVendor);
router.put('/vendors/:id/reject', authenticateAdmin, rejectVendor);

// Services routes
router.get('/services', authenticateAdmin, adminGetServices);
router.post('/services', authenticateAdmin, adminAddService);
router.put('/services/:id', authenticateAdmin, adminUpdateService);
router.delete('/services/:id', authenticateAdmin, adminDeleteService);

module.exports = router;
