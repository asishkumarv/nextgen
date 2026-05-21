const express = require('express');
const router = express.Router();
const { getActiveServices } = require('../controllers/servicesController');

router.get('/', getActiveServices);

module.exports = router;
