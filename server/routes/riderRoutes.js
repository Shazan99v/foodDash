const express = require('express');

const {
  getMyRiderDashboard,
  updateRiderOnlineStatus,
} = require('../controllers/riderController');

const {
  protect,
} = require('../middleware/authMiddleware');

const {
  authorize,
} = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(
  protect,
  authorize('RIDER')
);

router.get(
  '/dashboard',
  getMyRiderDashboard
);

router.patch(
  '/online-status',
  updateRiderOnlineStatus
);

module.exports = router;