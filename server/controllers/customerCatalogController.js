const Restaurant = require('../models/Restaurant');
const MenuCategory = require('../models/MenuCategory');
const MenuItem = require('../models/MenuItem');

const TIME_ZONE = 'Asia/Karachi';

/**
 * Parse 12-hour or 24-hour time.
 *
 * Supported examples:
 * 09:00
 * 21:30
 * 9:00 AM
 * 9:00 PM
 * 12:00 AM
 * 12:00 PM
 */
const parseTimeToMinutes = (value) => {
  if (typeof value !== 'string' || !value.trim()) {
    return null;
  }

  const match = value
    .trim()
    .toUpperCase()
    .match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/);

  if (!match) {
    return null;
  }

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const period = match[3];

  if (minutes > 59) {
    return null;
  }

  if (period) {
    if (hours < 1 || hours > 12) {
      return null;
    }

    if (period === 'AM') {
      hours = hours === 12 ? 0 : hours;
    } else {
      hours = hours === 12 ? 12 : hours + 12;
    }
  } else if (hours > 23) {
    return null;
  }

  return hours * 60 + minutes;
};

/**
 * Get current time in Pakistan, regardless of server timezone.
 */
const getCurrentPakistanMinutes = () => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date());

  const hour = Number(
    parts.find((part) => part.type === 'hour')?.value
  );

  const minute = Number(
    parts.find((part) => part.type === 'minute')?.value
  );

  return hour * 60 + minute;
};

/**
 * Check whether the restaurant is currently within its schedule.
 * Closing time is exclusive: a restaurant is closed at the
 * exact closing minute.
 */
const isWithinOpeningHours = (restaurant, now) => {
  const opening = parseTimeToMinutes(restaurant.openingTime);
  const closing = parseTimeToMinutes(restaurant.closingTime);

  if (opening === null || closing === null || opening === closing) {
    return false;
  }

  // Normal schedule, for example 09:00 to 22:00.
  if (opening < closing) {
    return now >= opening && now < closing;
  }

  // Overnight schedule, for example 18:00 to 02:00.
  return now >= opening || now < closing;
};

/**
 * Keep the stored manual switch intact.
 * Customer-facing isOpen is true only when:
 * - The restaurant is active.
 * - The owner/admin has manually enabled it.
 * - Current Pakistan time is within scheduled hours.
 */
const addScheduleStatus = (restaurant, now) => {
  if (!restaurant) {
    return restaurant;
  }

  const scheduledOpen = isWithinOpeningHours(restaurant, now);

  return {
    ...restaurant,
    scheduledOpen,
    isOpen:
      restaurant.isActive !== false &&
      restaurant.isOpen === true &&
      scheduledOpen,
  };
};

const getCustomerRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.find({
      isActive: true,
    })
      .select(
        'name description logo banner images cuisineCategories address city area phone openingTime closingTime deliveryAreas averagePreparationTime deliveryFee deliveryRules rating totalRatings totalOrders isOpen isActive isFeatured isVerified'
      )
      .sort({
        isFeatured: -1,
        rating: -1,
        createdAt: -1,
      })
      .lean();

    const now = getCurrentPakistanMinutes();

    const results = restaurants.map((restaurant) =>
      addScheduleStatus(restaurant, now)
    );

    return res.status(200).json({
      success: true,
      count: results.length,
      restaurants: results,
    });
  } catch (error) {
    console.error('Get customer restaurants error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to load restaurants.',
    });
  }
};

const getCustomerRestaurant = async (req, res) => {
  try {
    const { restaurantId } = req.params;

    const restaurantData = await Restaurant.findOne({
      _id: restaurantId,
      isActive: true,
    })
      .select(
        'name description logo banner images cuisineCategories address city area phone secondaryPhone openingTime closingTime deliveryAreas averagePreparationTime deliveryFee deliveryRules rating totalRatings totalOrders isOpen isActive isFeatured isVerified'
      )
      .lean();

    if (!restaurantData) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found.',
      });
    }

    const restaurant = addScheduleStatus(
      restaurantData,
      getCurrentPakistanMinutes()
    );

    const categories = await MenuCategory.find({
      restaurant: restaurantId,
      isActive: true,
    })
      .select('name description image sortOrder isActive')
      .sort({
        sortOrder: 1,
        createdAt: 1,
      })
      .lean();

    const activeCategoryIds = categories.map(
      (category) => category._id
    );

    const items = activeCategoryIds.length
      ? await MenuItem.find({
          restaurant: restaurantId,
          isAvailable: true,
          category: {
            $in: activeCategoryIds,
          },
        })
          .populate('category', 'name image sortOrder isActive')
          .sort({
            sortOrder: 1,
            createdAt: 1,
          })
          .lean()
      : [];

    return res.status(200).json({
      success: true,
      restaurant,
      categories,
      items,
    });
  } catch (error) {
    console.error('Get customer restaurant error:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid restaurant ID.',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to load restaurant.',
    });
  }
};

const getCustomerRestaurantMenu = async (req, res) => {
  try {
    const { restaurantId } = req.params;

    const restaurantData = await Restaurant.findOne({
      _id: restaurantId,
      isActive: true,
    })
      .select(
        'name logo banner deliveryFee openingTime closingTime isOpen isActive'
      )
      .lean();

    if (!restaurantData) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found.',
      });
    }

    const restaurant = addScheduleStatus(
      restaurantData,
      getCurrentPakistanMinutes()
    );

    const categories = await MenuCategory.find({
      restaurant: restaurantId,
      isActive: true,
    })
      .select('name description image sortOrder isActive')
      .sort({
        sortOrder: 1,
        createdAt: 1,
      })
      .lean();

    const activeCategoryIds = categories.map(
      (category) => category._id
    );

    const items = activeCategoryIds.length
      ? await MenuItem.find({
          restaurant: restaurantId,
          isAvailable: true,
          category: {
            $in: activeCategoryIds,
          },
        })
          .populate('category', 'name image sortOrder isActive')
          .sort({
            sortOrder: 1,
            createdAt: 1,
          })
          .lean()
      : [];

    return res.status(200).json({
      success: true,
      restaurant,
      categories,
      items,
    });
  } catch (error) {
    console.error('Get customer restaurant menu error:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid restaurant ID.',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to load restaurant menu.',
    });
  }
};

const getCustomerDeals = async (req, res) => {
  try {
    const activeCategories = await MenuCategory.find({
      isActive: true,
    })
      .select('_id')
      .lean();

    const activeCategoryIds = activeCategories.map(
      (category) => category._id
    );

    if (activeCategoryIds.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        deals: [],
      });
    }

    const discountedItems = await MenuItem.find({
      isAvailable: true,
      category: {
        $in: activeCategoryIds,
      },
      $expr: {
        $and: [
          { $gt: ['$price', 0] },
          { $lt: ['$discountedPrice', '$price'] },
        ],
      },
    })
      .populate({
        path: 'restaurant',
        match: {
          isActive: true,
        },
        select:
          'name logo banner deliveryFee openingTime closingTime isOpen isActive rating area city',
      })
      .populate({
        path: 'category',
        match: {
          isActive: true,
        },
        select: 'name image sortOrder isActive',
      })
      .sort({
        createdAt: -1,
      })
      .lean();

    const now = getCurrentPakistanMinutes();

    const deals = discountedItems
      .filter(
        (item) =>
          item.restaurant &&
          item.category &&
          item.category.isActive === true
      )
      .map((item) => ({
        ...item,
        restaurant: addScheduleStatus(item.restaurant, now),
        discountPercentage: Math.round(
          ((item.price - item.discountedPrice) / item.price) * 100
        ),
      }));

    return res.status(200).json({
      success: true,
      count: deals.length,
      deals,
    });
  } catch (error) {
    console.error('Get customer deals error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to load deals.',
    });
  }
};

module.exports = {
  getCustomerRestaurants,
  getCustomerRestaurant,
  getCustomerRestaurantMenu,
  getCustomerDeals,
};
