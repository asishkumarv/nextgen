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
  reassignBookingVendor,
  adminGetDistricts,
  adminAddDistrict,
  adminUpdateDistrict,
  adminDeleteDistrict,
  adminGetMandals,
  adminAddMandal,
  adminUpdateMandal,
  adminDeleteMandal,
  adminAddEvent,
  adminUpdateEvent,
  adminDeleteEvent,
  getSubscriptionRequests,
  getSubscriptionHistory,
  approveSubscription,
  rejectSubscription,
  getWithdrawals,
  updateWithdrawalStatus,
  getUserReferrals,
  getPendingNotifications,
  getEnquiries,
  updateEnquiryStatus
} = require('../controllers/adminController');
const { authenticateAdmin } = require('../middleware/auth');

router.post('/login', adminLogin);
router.get('/me', authenticateAdmin, getAdminMe);
router.get('/dashboard-stats', authenticateAdmin, getDashboardStats);
router.get('/notifications', authenticateAdmin, getPendingNotifications);
router.get('/users', authenticateAdmin, getUsers);
router.get('/users/:id/referrals', authenticateAdmin, getUserReferrals);
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

// Districts routes
router.get('/districts', authenticateAdmin, adminGetDistricts);
router.post('/districts', authenticateAdmin, adminAddDistrict);
router.put('/districts/:id', authenticateAdmin, adminUpdateDistrict);
router.delete('/districts/:id', authenticateAdmin, adminDeleteDistrict);

// Mandals routes
router.get('/mandals', authenticateAdmin, adminGetMandals);
router.post('/mandals', authenticateAdmin, adminAddMandal);
router.put('/mandals/:id', authenticateAdmin, adminUpdateMandal);
router.delete('/mandals/:id', authenticateAdmin, adminDeleteMandal);

// Events routes
router.post('/events', authenticateAdmin, adminAddEvent);
router.put('/events/:id', authenticateAdmin, adminUpdateEvent);
router.delete('/events/:id', authenticateAdmin, adminDeleteEvent);

// Subscription Management
router.get('/subscribers', authenticateAdmin, getSubscribers);
router.get('/subscription-requests', authenticateAdmin, getSubscriptionRequests);
router.get('/subscription-history', authenticateAdmin, getSubscriptionHistory);
router.put('/subscription-requests/:id/approve', authenticateAdmin, approveSubscription);
router.put('/subscription-requests/:id/reject', authenticateAdmin, rejectSubscription);

// Withdrawals routes
router.get('/withdrawals', authenticateAdmin, getWithdrawals);
router.put('/withdrawals/:id/status', authenticateAdmin, updateWithdrawalStatus);

// Enquiries routes
router.get('/enquiries', authenticateAdmin, getEnquiries);
router.put('/enquiries/:id/status', authenticateAdmin, updateEnquiryStatus);

module.exports = router;
