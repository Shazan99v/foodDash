const express = require('express');

const {
  getAvailableRiderOrders,
  getMyRiderOrders,
  acceptRiderOrder,
  pickupRiderOrder,
  deliverRiderOrder,
} = require('../controllers/riderOrderController');

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
  '/available',
  getAvailableRiderOrders
);

router.get(
  '/my-orders',
  getMyRiderOrders
);

router.patch(
  '/:orderId/accept',
  acceptRiderOrder
);

router.patch(
  '/:orderId/pickup',
  pickupRiderOrder
);

router.patch(
  '/:orderId/deliver',
  deliverRiderOrder
);

module.exports = router;