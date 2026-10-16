const express = require('express');

const {
  getPendingRiderApplications,
  getPendingBusinessApplications,
  approveRiderApplication,
  rejectRiderApplication,
  approveBusinessApplication,
  rejectBusinessApplication,
  getDashboardStats,
  getBusinessOwners,
  getAllRestaurants,
  getRestaurantById,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
  updateRestaurantStatusByAdmin,
} = require('../controllers/adminController');

const {
  getAllRiders,
  updateRider,
  banRider,
  unbanRider,
} = require('../controllers/adminRiderController');

const {
  getRiderFeedback,
} = require('../controllers/adminRiderFeedbackController');

const {
  protect,
} = require('../middleware/authMiddleware');

const {
  authorize,
} = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(
  protect,
  authorize('ADMIN')
);

router.get(
  '/dashboard',
  getDashboardStats
);

router.get(
  '/applications/riders',
  getPendingRiderApplications
);

router.patch(
  '/applications/riders/:applicationId/approve',
  approveRiderApplication
);

router.patch(
  '/applications/riders/:applicationId/reject',
  rejectRiderApplication
);

router.get(
  '/applications/businesses',
  getPendingBusinessApplications
);

router.patch(
  '/applications/businesses/:applicationId/approve',
  approveBusinessApplication
);

router.patch(
  '/applications/businesses/:applicationId/reject',
  rejectBusinessApplication
);

router.get(
  '/business-owners',
  getBusinessOwners
);

router.get(
  '/riders',
  getAllRiders
);

router.patch(
  '/riders/:riderId',
  updateRider
);

router.patch(
  '/riders/:riderId/ban',
  banRider
);

router.patch(
  '/riders/:riderId/unban',
  unbanRider
);

router.get(
  '/riders/:riderId/feedback',
  getRiderFeedback
);

router.get(
  '/restaurants',
  getAllRestaurants
);

router.get(
  '/restaurants/:restaurantId',
  getRestaurantById
);

router.post(
  '/restaurants',
  createRestaurant
);

router.patch(
  '/restaurants/:restaurantId',
  updateRestaurant
);

router.delete(
  '/restaurants/:restaurantId',
  deleteRestaurant
);

router.patch(
  '/restaurants/:restaurantId/status',
  updateRestaurantStatusByAdmin
);

module.exports = router;