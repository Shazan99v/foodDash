const express = require('express');

const {
  getRestaurantCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getRestaurantMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} = require('../controllers/adminCatalogController');

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
  '/restaurants/:restaurantId/categories',
  getRestaurantCategories
);

router.post(
  '/restaurants/:restaurantId/categories',
  createCategory
);

router.patch(
  '/categories/:categoryId',
  updateCategory
);

router.delete(
  '/categories/:categoryId',
  deleteCategory
);

router.get(
  '/restaurants/:restaurantId/items',
  getRestaurantMenuItems
);

router.post(
  '/restaurants/:restaurantId/items',
  createMenuItem
);

router.patch(
  '/items/:itemId',
  updateMenuItem
);

router.delete(
  '/items/:itemId',
  deleteMenuItem
);

module.exports = router;