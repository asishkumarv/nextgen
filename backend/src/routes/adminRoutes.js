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
  rejectVendor,
  deactivateVendor,
  reactivateVendor,
  getSettlements,
  approveSettlement,
  rejectSettlement,
  getEligibleVendorsForBooking,
  reassignBookingVendor
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

// Booking reassignment routes
router.get('/bookings/:id/eligible-vendors', authenticateAdmin, getEligibleVendorsForBooking);
router.put('/bookings/:id/reassign', authenticateAdmin, reassignBookingVendor);

// Vendor management routes
router.get('/vendors', authenticateAdmin, getVendors);
router.put('/vendors/:id/approve', authenticateAdmin, approveVendor);
router.put('/vendors/:id/reject', authenticateAdmin, rejectVendor);
router.put('/vendors/:id/deactivate', authenticateAdmin, deactivateVendor);
router.put('/vendors/:id/reactivate', authenticateAdmin, reactivateVendor);

// Settlements routes
router.get('/settlements', authenticateAdmin, getSettlements);
router.put('/settlements/:id/approve', authenticateAdmin, approveSettlement);
router.put('/settlements/:id/reject', authenticateAdmin, rejectSettlement);

// Services routes
router.get('/services', authenticateAdmin, adminGetServices);
router.post('/services', authenticateAdmin, adminAddService);
router.put('/services/:id', authenticateAdmin, adminUpdateService);
router.delete('/services/:id', authenticateAdmin, adminDeleteService);

module.exports = router;
