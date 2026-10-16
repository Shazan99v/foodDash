const express = require('express');

const {
  getMyRestaurant,
  updateRestaurantStatus,
  updateRestaurantHours,
  getMyCategories,
  updateMyCategoryStatus,
  getMyMenuItems,
  updateMyMenuItemStatus,
} = require('../controllers/businessController');

const {
  getMyRestaurantOrders,
  receiveRestaurantOrder,
  startPreparingRestaurantOrder,
  markRestaurantOrderReady,
  rejectRestaurantOrder,
} = require('../controllers/businessOrderController');

const {
  protect,
} = require('../middleware/authMiddleware');

const {
  authorize,
} = require('../middleware/roleMiddleware');

const router = express.Router();

// All routes require an authenticated business account.
router.use(
  protect,
  authorize('BUSINESS')
);

// Restaurant details and availability.
router.get(
  '/restaurant',
  getMyRestaurant
);

router.patch(
  '/restaurant/status',
  updateRestaurantStatus
);

router.patch(
  '/restaurant/hours',
  updateRestaurantHours
);

// Restaurant order management.
router.get(
  '/orders',
  getMyRestaurantOrders
);

router.patch(
  '/orders/:orderId/accept',
  receiveRestaurantOrder
);

router.patch(
  '/orders/:orderId/prepare',
  startPreparingRestaurantOrder
);

router.patch(
  '/orders/:orderId/ready',
  markRestaurantOrderReady
);

router.patch(
  '/orders/:orderId/reject',
  rejectRestaurantOrder
);

// Menu categories.
router.get(
  '/categories',
  getMyCategories
);

router.patch(
  '/categories/:categoryId/status',
  updateMyCategoryStatus
);

// Menu items.
router.get(
  '/menu-items',
  getMyMenuItems
);

router.patch(
  '/menu-items/:itemId/status',
  updateMyMenuItemStatus
);

module.exports = router;
