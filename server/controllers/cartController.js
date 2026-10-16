const mongoose = require('mongoose');

const Cart = require('../models/Cart');
const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');

const getCustomerId = (req) =>
  req.user?._id ||
  req.user?.id ||
  req.user?.userId;

const populateCart = async (customerId) => {
  let cart = await Cart.findOne({
    customer: customerId,
  }).populate({
    path: 'items.menuItem',
    select:
      'restaurant category name description image price discountedPrice variations addons preparationTime isAvailable',
    populate: {
      path: 'category',
      select: 'name image',
    },
  });

  if (!cart) {
    cart = await Cart.create({
      customer: customerId,
      items: [],
    });

    cart = await Cart.findById(cart._id).populate({
      path: 'items.menuItem',
      select:
        'restaurant category name description image price discountedPrice variations addons preparationTime isAvailable',
      populate: {
        path: 'category',
        select: 'name image',
      },
    });
  }

  return cart;
};

const getCart = async (req, res) => {
  try {
    const customerId = getCustomerId(req);

    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    const cart = await populateCart(customerId);

    return res.status(200).json({
      success: true,
      cart,
    });
  } catch (error) {
    console.error('Get cart error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to load your cart.',
    });
  }
};

const addCartItem = async (req, res) => {
  try {
    const customerId = getCustomerId(req);
    const { menuItemId, quantity = 1 } = req.body;

    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (
      !mongoose.isValidObjectId(menuItemId) ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > 99
    ) {
      return res.status(400).json({
        success: false,
        message: 'A valid menu item and quantity are required.',
      });
    }

    const menuItem = await MenuItem.findById(menuItemId);

    if (!menuItem || !menuItem.isAvailable) {
      return res.status(404).json({
        success: false,
        message: 'This menu item is unavailable.',
      });
    }

    const restaurant = await Restaurant.findById(
      menuItem.restaurant
    );

    if (
      !restaurant ||
      !restaurant.isActive ||
      !restaurant.isOpen
    ) {
      return res.status(400).json({
        success: false,
        message: 'This restaurant is currently unavailable.',
      });
    }

    let cart = await Cart.findOne({
      customer: customerId,
    });

    if (!cart) {
      cart = await Cart.create({
        customer: customerId,
        restaurant: restaurant._id,
        items: [],
      });
    }

    if (
      cart.restaurant &&
      cart.restaurant.toString() !==
        restaurant._id.toString() &&
      cart.items.length > 0
    ) {
      return res.status(409).json({
        success: false,
        code: 'DIFFERENT_RESTAURANT',
        message:
          'Your cart contains items from another restaurant. Clear your cart before ordering from this restaurant.',
      });
    }

    cart.restaurant = restaurant._id;

    const existingItem = cart.items.find(
      (item) =>
        item.menuItem.toString() ===
        menuItem._id.toString()
    );

    if (existingItem) {
      if (existingItem.quantity + quantity > 99) {
        return res.status(400).json({
          success: false,
          message: 'Maximum quantity per item is 99.',
        });
      }

      existingItem.quantity += quantity;
    } else {
      cart.items.push({
        menuItem: menuItem._id,
        quantity,
      });
    }

    await cart.save();

    const updatedCart = await populateCart(customerId);

    return res.status(200).json({
      success: true,
      message: 'Item added to your cart.',
      cart: updatedCart,
    });
  } catch (error) {
    console.error('Add cart item error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to add this item to your cart.',
    });
  }
};

const updateCartItem = async (req, res) => {
  try {
    const customerId = getCustomerId(req);
    const { menuItemId } = req.params;
    const { quantity } = req.body;

    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (
      !mongoose.isValidObjectId(menuItemId) ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > 99
    ) {
      return res.status(400).json({
        success: false,
        message: 'A valid item and quantity are required.',
      });
    }

    const cart = await Cart.findOne({
      customer: customerId,
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found.',
      });
    }

    const cartItem = cart.items.find(
      (item) =>
        item.menuItem.toString() === menuItemId
    );

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in your cart.',
      });
    }

    cartItem.quantity = quantity;

    await cart.save();

    const updatedCart = await populateCart(customerId);

    return res.status(200).json({
      success: true,
      message: 'Cart quantity updated.',
      cart: updatedCart,
    });
  } catch (error) {
    console.error('Update cart item error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to update your cart.',
    });
  }
};

const removeCartItem = async (req, res) => {
  try {
    const customerId = getCustomerId(req);
    const { menuItemId } = req.params;

    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (!mongoose.isValidObjectId(menuItemId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid menu item ID.',
      });
    }

    const cart = await Cart.findOne({
      customer: customerId,
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found.',
      });
    }

    cart.items = cart.items.filter(
      (item) =>
        item.menuItem.toString() !== menuItemId
    );

    if (cart.items.length === 0) {
      cart.restaurant = null;
    }

    await cart.save();

    const updatedCart = await populateCart(customerId);

    return res.status(200).json({
      success: true,
      message: 'Item removed from your cart.',
      cart: updatedCart,
    });
  } catch (error) {
    console.error('Remove cart item error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to remove this item.',
    });
  }
};

const clearCart = async (req, res) => {
  try {
    const customerId = getCustomerId(req);

    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    const cart = await Cart.findOne({
      customer: customerId,
    });

    if (cart) {
      cart.items = [];
      cart.restaurant = null;
      await cart.save();
    }

    const updatedCart = await populateCart(customerId);

    return res.status(200).json({
      success: true,
      message: 'Your cart has been cleared.',
      cart: updatedCart,
    });
  } catch (error) {
    console.error('Clear cart error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to clear your cart.',
    });
  }
};

module.exports = {
  getCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
  clearCart,
};