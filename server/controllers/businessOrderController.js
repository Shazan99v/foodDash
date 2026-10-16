const mongoose = require('mongoose');

const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const RiderProfile = require('../models/RiderProfile');
const OrderStatusHistory = require('../models/OrderStatusHistory');

const RESTAURANT_STATUSES = [
  'PLACED',
  'RECEIVED',
  'PREPARING',
  'READY',
  'CANCELLED',
];

const addOrderHistory = async ({
  orderId,
  status,
  changedBy,
  note,
}) => {
  await OrderStatusHistory.create({
    order: orderId,
    status,
    changedBy,
    note,
  });
};

// Get orders belonging only to the authenticated restaurant owner.
const getMyRestaurantOrders = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id || req.user.id;

    const restaurant = await Restaurant.findOne({
      owner: userId,
    }).select('_id name isActive');

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Your restaurant could not be found.',
      });
    }

    const orders = await Order.find({
      restaurant: restaurant._id,
    })
      .populate('customer', 'name phone')
      .populate('rider', 'name phone')
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      restaurant,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error('Get restaurant orders error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to load restaurant orders.',
    });
  }
};

// Restaurant accepts an order. The assigned rider is preserved.
const receiveRestaurantOrder = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id || req.user.id;
    const { orderId } = req.params;

    if (!mongoose.isValidObjectId(orderId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID.',
      });
    }

    const restaurant = await Restaurant.findOne({
      owner: userId,
    }).select('_id isActive');

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Your restaurant could not be found.',
      });
    }

    if (!restaurant.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your restaurant is inactive.',
      });
    }

    const order = await Order.findOneAndUpdate(
      {
        _id: orderId,
        restaurant: restaurant._id,
        status: 'PLACED',
      },
      {
        $set: {
          status: 'RECEIVED',
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!order) {
      return res.status(409).json({
        success: false,
        message:
          'This order cannot be accepted. It may already have been updated or cancelled.',
      });
    }

    try {
      await addOrderHistory({
        orderId: order._id,
        status: 'RECEIVED',
        changedBy: userId,
        note: 'Restaurant accepted the order.',
      });
    } catch (historyError) {
      console.error(
        'Failed to save restaurant acceptance history:',
        historyError
      );

      await Order.updateOne(
        {
          _id: order._id,
          status: 'RECEIVED',
        },
        {
          $set: {
            status: 'PLACED',
          },
        }
      );

      return res.status(500).json({
        success: false,
        message:
          'The order could not be accepted because its history could not be saved.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Order accepted successfully.',
      order,
    });
  } catch (error) {
    console.error('Accept restaurant order error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to accept the order.',
    });
  }
};

// Move an accepted order into preparation.
const startPreparingRestaurantOrder = async (req, res) => {
  return updateRestaurantOrderStatus({
    req,
    res,
    fromStatus: 'RECEIVED',
    toStatus: 'PREPARING',
    note: 'Restaurant started preparing the order.',
  });
};

// Mark a prepared order as ready for rider pickup.
const markRestaurantOrderReady = async (req, res) => {
  return updateRestaurantOrderStatus({
    req,
    res,
    fromStatus: 'PREPARING',
    toStatus: 'READY',
    note: 'Order is ready for rider pickup.',
  });
};

// Reject an order before preparation, even if a rider was pre-assigned.
const rejectRestaurantOrder = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id || req.user.id;
    const { orderId } = req.params;

    const reason =
      typeof req.body?.reason === 'string'
        ? req.body.reason.trim()
        : '';

    if (!mongoose.isValidObjectId(orderId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID.',
      });
    }

    const restaurant = await Restaurant.findOne({
      owner: userId,
    }).select('_id isActive');

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Your restaurant could not be found.',
      });
    }

    if (!restaurant.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your restaurant is inactive.',
      });
    }

    // Capture the assigned rider so their profile can be released
    // if rejection succeeds.
    const existingOrder = await Order.findOne({
      _id: orderId,
      restaurant: restaurant._id,
      status: 'PLACED',
    }).select('_id rider');

    if (!existingOrder) {
      return res.status(409).json({
        success: false,
        message:
          'This order cannot be rejected. It may already have been accepted or cancelled.',
      });
    }

    const assignedRiderId = existingOrder.rider || null;

    const order = await Order.findOneAndUpdate(
      {
        _id: orderId,
        restaurant: restaurant._id,
        status: 'PLACED',
      },
      {
        $set: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancellationReason: reason || 'Rejected by restaurant.',
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!order) {
      return res.status(409).json({
        success: false,
        message:
          'This order has already been updated and cannot be rejected.',
      });
    }

    try {
      await addOrderHistory({
        orderId: order._id,
        status: 'CANCELLED',
        changedBy: userId,
        note: reason || 'Order rejected by restaurant.',
      });
    } catch (historyError) {
      console.error(
        'Failed to save rejection history:',
        historyError
      );

      await Order.updateOne(
        {
          _id: order._id,
          status: 'CANCELLED',
        },
        {
          $set: {
            status: 'PLACED',
            cancelledAt: null,
            cancellationReason: null,
          },
        }
      );

      return res.status(500).json({
        success: false,
        message:
          'The order could not be rejected because its history could not be saved.',
      });
    }

    // Release the rider only after rejection and its history succeed.
    if (assignedRiderId) {
      const otherActiveOrder = await Order.exists({
        _id: { $ne: order._id },
        rider: assignedRiderId,
        status: {
          $in: ['PLACED', 'RECEIVED', 'PREPARING', 'READY', 'ON_ROUTE'],
        },
      });

      if (!otherActiveOrder) {
        await RiderProfile.updateOne(
          {
            user: assignedRiderId,
            isOnline: true,
            isActive: true,
          },
          {
            $set: {
              isAvailable: true,
            },
          }
        );
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Order rejected successfully.',
      order,
    });
  } catch (error) {
    console.error('Reject restaurant order error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to reject the order.',
    });
  }
};

async function updateRestaurantOrderStatus({
  req,
  res,
  fromStatus,
  toStatus,
  note,
}) {
  try {
    const userId = req.user.userId || req.user._id || req.user.id;
    const { orderId } = req.params;

    if (!mongoose.isValidObjectId(orderId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID.',
      });
    }

    if (!RESTAURANT_STATUSES.includes(toStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid restaurant order status.',
      });
    }

    const restaurant = await Restaurant.findOne({
      owner: userId,
    }).select('_id isActive');

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Your restaurant could not be found.',
      });
    }

    if (!restaurant.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your restaurant is inactive.',
      });
    }

    const order = await Order.findOneAndUpdate(
      {
        _id: orderId,
        restaurant: restaurant._id,
        status: fromStatus,
      },
      {
        $set: {
          status: toStatus,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!order) {
      return res.status(409).json({
        success: false,
        message:
          'The order status has changed or this action is not allowed.',
      });
    }

    try {
      await addOrderHistory({
        orderId: order._id,
        status: toStatus,
        changedBy: userId,
        note,
      });
    } catch (historyError) {
      console.error(
        'Failed to save order status history:',
        historyError
      );

      await Order.updateOne(
        {
          _id: order._id,
          status: toStatus,
        },
        {
          $set: {
            status: fromStatus,
          },
        }
      );

      return res.status(500).json({
        success: false,
        message: 'The order status could not be saved to history.',
      });
    }

    return res.status(200).json({
      success: true,
      message:
        toStatus === 'PREPARING'
          ? 'Order preparation started.'
          : 'Order is ready for pickup.',
      order,
    });
  } catch (error) {
    console.error('Update restaurant order status error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to update order status.',
    });
  }
}

module.exports = {
  getMyRestaurantOrders,
  receiveRestaurantOrder,
  startPreparingRestaurantOrder,
  markRestaurantOrderReady,
  rejectRestaurantOrder,
};
