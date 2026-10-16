const express = require('express');

const {
  registerRider,
  registerBusiness,
} = require('../controllers/applicationController');

const router = express.Router();

router.post(
  '/rider',
  registerRider
);

router.post(
  '/business',
  registerBusiness
);

module.exports = router;