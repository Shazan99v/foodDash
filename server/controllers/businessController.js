const Restaurant = require('../models/Restaurant');
const MenuCategory = require('../models/MenuCategory');
const MenuItem = require('../models/MenuItem');

const getMyRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({
      owner: req.user.userId,
    });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Your restaurant could not be found.',
      });
    }

    return res.status(200).json({
      success: true,
      restaurant,
    });
  } catch (error) {
    console.error('Get business restaurant error:', error);

    return res.status(500).json({
      success: false,
      message: 'Something went wrong while getting your restaurant.',
    });
  }
};

const updateRestaurantStatus = async (req, res) => {
  try {
    const { isOpen } = req.body;

    if (typeof isOpen !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Restaurant open status must be true or false.',
      });
    }

    const restaurant = await Restaurant.findOne({
      owner: req.user.userId,
    });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Your restaurant could not be found.',
      });
    }

    if (!restaurant.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your restaurant is currently inactive.',
      });
    }

    restaurant.isOpen = isOpen;
    await restaurant.save();

    return res.status(200).json({
      success: true,
      message: isOpen
        ? 'Restaurant is now open.'
        : 'Restaurant is now closed.',
      restaurant,
    });
  } catch (error) {
    console.error('Update restaurant status error:', error);

    return res.status(500).json({
      success: false,
      message: 'Something went wrong while updating restaurant status.',
    });
  }
};

// Update restaurant opening and closing times.
const updateRestaurantHours = async (req, res) => {
  try {
    const { openingTime, closingTime } = req.body;

    const isValidTime = (value) =>
      typeof value === 'string' &&
      /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

    if (!isValidTime(openingTime) || !isValidTime(closingTime)) {
      return res.status(400).json({
        success: false,
        message: 'Opening and closing times must use HH:mm format.',
      });
    }

    if (openingTime === closingTime) {
      return res.status(400).json({
        success: false,
        message: 'Opening and closing times cannot be identical.',
      });
    }

    const restaurant = await Restaurant.findOne({
      owner: req.user.userId,
    });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Your restaurant could not be found.',
      });
    }

    if (!restaurant.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your restaurant is currently inactive.',
      });
    }

    restaurant.openingTime = openingTime;
    restaurant.closingTime = closingTime;

    await restaurant.save();

    return res.status(200).json({
      success: true,
      message: 'Restaurant hours updated successfully.',
      restaurant,
    });
  } catch (error) {
    console.error('Update restaurant hours error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to update restaurant hours.',
    });
  }
};

const getMyCategories = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({
      owner: req.user.userId,
    });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found.',
      });
    }

    const categories = await MenuCategory.find({
      restaurant: restaurant._id,
    }).sort({
      sortOrder: 1,
      createdAt: 1,
    });

    return res.status(200).json({
      success: true,
      count: categories.length,
      categories,
    });
  } catch (error) {
    console.error('Get business categories error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to load menu categories.',
    });
  }
};

const updateMyCategoryStatus = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive must be a boolean.',
      });
    }

    const restaurant = await Restaurant.findOne({
      owner: req.user.userId,
    });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found.',
      });
    }

    const category = await MenuCategory.findOne({
      _id: categoryId,
      restaurant: restaurant._id,
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found.',
      });
    }

    category.isActive = isActive;
    await category.save();

    return res.status(200).json({
      success: true,
      message: isActive
        ? 'Category enabled successfully.'
        : 'Category disabled successfully.',
      category,
    });
  } catch (error) {
    console.error('Update business category status error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to update category status.',
    });
  }
};

const getMyMenuItems = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({
      owner: req.user.userId,
    });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found.',
      });
    }

    const items = await MenuItem.find({
      restaurant: restaurant._id,
    })
      .populate('category', 'name isActive')
      .sort({
        sortOrder: 1,
        createdAt: 1,
      });

    return res.status(200).json({
      success: true,
      count: items.length,
      items,
    });
  } catch (error) {
    console.error('Get business menu items error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to load menu items.',
    });
  }
};

const updateMyMenuItemStatus = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { isAvailable } = req.body;

    if (typeof isAvailable !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isAvailable must be a boolean.',
      });
    }

    const restaurant = await Restaurant.findOne({
      owner: req.user.userId,
    });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found.',
      });
    }

    const item = await MenuItem.findOne({
      _id: itemId,
      restaurant: restaurant._id,
    }).populate('category', 'name isActive');

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found.',
      });
    }

    if (
      isAvailable &&
      (!item.category ||
        typeof item.category !== 'object' ||
        item.category.isActive !== true)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Enable the item category before making this item available.',
      });
    }

    item.isAvailable = isAvailable;
    await item.save();

    const updatedItem = await MenuItem.findById(item._id)
      .populate('category', 'name isActive');

    return res.status(200).json({
      success: true,
      message: isAvailable
        ? 'Menu item enabled successfully.'
        : 'Menu item marked as unavailable.',
      item: updatedItem,
    });
  } catch (error) {
    console.error('Update business menu item status error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to update menu item status.',
    });
  }
};

module.exports = {
  getMyRestaurant,
  updateRestaurantStatus,
  updateRestaurantHours,
  getMyCategories,
  updateMyCategoryStatus,
  getMyMenuItems,
  updateMyMenuItemStatus,
};
