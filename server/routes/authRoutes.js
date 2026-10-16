const express = require('express');

const {
  registerCustomer,
  loginUser,
} = require('../controllers/authController');

const {
  getCurrentUser,
  updateCurrentUser,
  getPhoneNumbers,
  addPhoneNumber,
  updatePhoneNumber,
  deletePhoneNumber,
  setPrimaryPhoneNumber,
  getSavedAddresses,
  addSavedAddress,
  updateSavedAddress,
  deleteSavedAddress,
  setDefaultAddress,
} = require('../controllers/userController');

const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Authentication
router.post('/customer/register', registerCustomer);
router.post('/login', loginUser);

// Current user's profile
router.get('/me', protect, getCurrentUser);
router.patch('/me', protect, updateCurrentUser);

// Current user's saved phone numbers
router.get('/phone-numbers', protect, getPhoneNumbers);
router.post('/phone-numbers', protect, addPhoneNumber);
router.patch('/phone-numbers/:phoneId', protect, updatePhoneNumber);
router.delete('/phone-numbers/:phoneId', protect, deletePhoneNumber);
router.patch(
  '/phone-numbers/:phoneId/primary',
  protect,
  setPrimaryPhoneNumber
);

// Current user's saved delivery addresses
router.get('/addresses', protect, getSavedAddresses);
router.post('/addresses', protect, addSavedAddress);
router.patch('/addresses/:addressId', protect, updateSavedAddress);
router.delete('/addresses/:addressId', protect, deleteSavedAddress);
router.patch(
  '/addresses/:addressId/default',
  protect,
  setDefaultAddress
);

module.exports = router;