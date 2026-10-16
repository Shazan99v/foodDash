const express = require('express');

const {
  getCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
  clearCart,
} = require('../controllers/cartController');

const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/', getCart);

router.post('/items', addCartItem);

router.patch('/items/:menuItemId', updateCartItem);

router.delete('/items/:menuItemId', removeCartItem);

router.delete('/', clearCart);

module.exports = router;