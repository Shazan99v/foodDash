const express = require('express');

const {
  getCustomerRestaurants,
  getCustomerRestaurant,
  getCustomerRestaurantMenu,
  getCustomerDeals,
} = require('../controllers/customerCatalogController');

const router = express.Router();

// Customer deals
router.get('/deals', getCustomerDeals);

// Customer restaurants
router.get('/restaurants', getCustomerRestaurants);

router.get(
  '/restaurants/:restaurantId',
  getCustomerRestaurant
);

router.get(
  '/restaurants/:restaurantId/menu',
  getCustomerRestaurantMenu
);

module.exports = router;
