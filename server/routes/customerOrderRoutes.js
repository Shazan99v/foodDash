const express = require('express');

const {
  createCustomerOrder,
  getCustomerOrders,
  getCustomerOrder,
  cancelCustomerOrder,
} = require('../controllers/customerOrderController');

const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, createCustomerOrder);
router.get('/my', protect, getCustomerOrders);
router.get('/:id', protect, getCustomerOrder);
router.patch('/:id/cancel', protect, cancelCustomerOrder);

module.exports = router;