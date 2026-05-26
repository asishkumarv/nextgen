const express = require('express');
const router = express.Router();
const {
  vendorRegister,
  vendorLogin,
  getVendorMe,
  completeTask,
  addVendorService,
  changePassword,
  getVendorLeaves,
  addVendorLeave,
  removeVendorLeave,
  getVendorSettlements,
  requestVendorSettlement
} = require('../controllers/vendorController');
const { authenticateVendor } = require('../middleware/auth');

router.post('/register', vendorRegister);
router.post('/login', vendorLogin);
router.get('/me', authenticateVendor, getVendorMe);
router.put('/tasks/:id/complete', authenticateVendor, completeTask);
router.post('/services', authenticateVendor, addVendorService);

// Change password
router.put('/change-password', authenticateVendor, changePassword);

// Leaves management
router.get('/leaves', authenticateVendor, getVendorLeaves);
router.post('/leaves', authenticateVendor, addVendorLeave);
router.delete('/leaves/:leaveDate', authenticateVendor, removeVendorLeave);

// Settlements
router.get('/settlements', authenticateVendor, getVendorSettlements);
router.post('/settlements', authenticateVendor, requestVendorSettlement);

module.exports = router;
