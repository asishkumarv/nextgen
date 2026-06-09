const express = require('express');
const router = express.Router();
const { submitEnquiry } = require('../controllers/contactController');

router.post('/', submitEnquiry);

module.exports = router;
