const express = require('express');
const router = express.Router();
const {
  vendorRegister,
  vendorLogin,
  getVendorMe,
  completeTask,
  addVendorService
} = require('../controllers/vendorController');
const { authenticateVendor } = require('../middleware/auth');

router.post('/register', vendorRegister);
router.post('/login', vendorLogin);
router.get('/me', authenticateVendor, getVendorMe);
router.put('/tasks/:id/complete', authenticateVendor, completeTask);
router.post('/services', authenticateVendor, addVendorService);

module.exports = router;
