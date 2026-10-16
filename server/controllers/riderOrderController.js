const mongoose = require('mongoose');

const Order = require('../models/Order');
const RiderProfile = require('../models/RiderProfile');
const OrderStatusHistory = require('../models/OrderStatusHistory');

const ACTIVE_ORDER_STATUSES = [
  'PLACED',
  'RECEIVED',
  'PREPARING',
  'READY',
  'ON_ROUTE',
];

const ASSIGNED_ORDER_STATUSES = [
  'PLACED',
  'RECEIVED',
  'PREPARING',
  'READY',
];

const addOrderHistory = async ({
  orderId,
  status,
  changedBy,
  note,
}) => {
  return OrderStatusHistory.create({
    order: orderId,
    status,
    changedBy,
    note,
  });
};

const isValidOrderId = (orderId) =>
  mongoose.isValidObjectId(orderId);

const getRiderId = (req) =>
  req.user?.userId || req.user?._id || req.user?.id;

const getRiderProfile = async (userId) =>
  RiderProfile.findOne({ user: userId });

const hasOtherActiveOrders = async (riderId, excludedOrderId) => {
  const query = {
    rider: riderId,
    status: { $in: ACTIVE_ORDER_STATUSES },
  };

  if (excludedOrderId) {
    query._id = { $ne: excludedOrderId };
  }

  return Order.exists(query);
};

const syncRiderAvailability = async (riderId, excludedOrderId) => {
  const riderProfile = await getRiderProfile(riderId);

  if (!riderProfile) {
    return;
  }

  const hasActiveOrders = await hasOtherActiveOrders(
    riderId,
    excludedOrderId
  );

  await RiderProfile.updateOne(
    { _id: riderProfile._id },
    {
      $set: {
        isAvailable:
          Boolean(riderProfile.isActive) &&
          Boolean(riderProfile.isOnline) &&
          !hasActiveOrders,
      },
    }
  );
};

const getAvailableRiderOrders = async (req, res) => {
  try {
    const riderId = getRiderId(req);

    if (!riderId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    const riderProfile = await getRiderProfile(riderId);

    if (!riderProfile) {
      return res.status(404).json({
        success: false,
        message: 'Rider profile not found.',
      });
    }

    if (!riderProfile.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your rider account has been suspended.',
      });
    }

    if (!riderProfile.isOnline || !riderProfile.isAvailable) {
      return res.json({
        success: true,
        orders: [],
      });
    }

    // An automatically assigned delivery takes priority.
    // Riders handling an active delivery cannot claim another one.
    const activeOrderExists = await hasOtherActiveOrders(riderId);

    if (activeOrderExists) {
      return res.json({
        success: true,
        orders: [],
      });
    }

    // Fallback orders are available only after the restaurant
    // marks them READY and only while they have no assigned rider.
    const orders = await Order.find({
      rider: null,
      status: 'READY',
      deliveryCity: riderProfile.city,
      deliveryArea: riderProfile.area,
    })
      .populate('restaurant', 'name address city area phone')
      .populate('business', 'name phone')
      .sort({ createdAt: 1 })
      .lean();

    return res.json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error('Get available rider orders error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to load available orders.',
    });
  }
};

const getMyRiderOrders = async (req, res) => {
  try {
    const riderId = getRiderId(req);

    if (!riderId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    // Include active and completed orders. Automatically assigned
    // orders appear here immediately, even while being prepared.
    const orders = await Order.find({
      rider: riderId,
    })
      .populate('restaurant', 'name address city area phone')
      .populate('customer', 'name phone')
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error('Get rider orders error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to load rider orders.',
    });
  }
};

const acceptRiderOrder = async (req, res) => {
  let reservedProfileId = null;

  try {
    const { orderId } = req.params;
    const riderId = getRiderId(req);

    if (!riderId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (!isValidOrderId(orderId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID.',
      });
    }

    const riderProfile = await getRiderProfile(riderId);

    if (!riderProfile) {
      return res.status(404).json({
        success: false,
        message: 'Rider profile not found.',
      });
    }

    if (!riderProfile.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your rider account has been suspended.',
      });
    }

    if (!riderProfile.isOnline) {
      return res.status(403).json({
        success: false,
        message: 'Go online before accepting orders.',
      });
    }

    // Automatic assignment happens at checkout. Acknowledge it
    // without trying to reserve a second delivery.
    const alreadyAssigned = await Order.findOne({
      _id: orderId,
      rider: riderId,
      status: { $in: ASSIGNED_ORDER_STATUSES },
    })
      .populate('restaurant', 'name address city area phone')
      .populate('customer', 'name phone')
      .lean();

    if (alreadyAssigned) {
      return res.json({
        success: true,
        alreadyAssigned: true,
        message:
          alreadyAssigned.status === 'READY'
            ? 'This delivery is assigned to you and ready for pickup.'
            : 'This order is assigned to you. Wait until the restaurant marks it ready before pickup.',
        order: alreadyAssigned,
      });
    }

    // Do not allow a rider with another active delivery to claim
    // an additional fallback order.
    const activeOrderExists = await hasOtherActiveOrders(riderId);

    if (activeOrderExists) {
      return res.status(409).json({
        success: false,
        message:
          'You already have an active delivery. Complete it before accepting another.',
      });
    }

    // Reserve the rider atomically before attempting to claim
    // the order. This prevents simultaneous fallback claims by
    // the same rider from succeeding together.
    const reservedProfile = await RiderProfile.findOneAndUpdate(
      {
        _id: riderProfile._id,
        user: riderId,
        isActive: true,
        isOnline: true,
        isAvailable: true,
      },
      {
        $set: {
          isAvailable: false,
        },
      },
      {
        new: true,
      }
    );

    if (!reservedProfile) {
      return res.status(409).json({
        success: false,
        message:
          'You are not currently available to accept another delivery.',
      });
    }

    reservedProfileId = reservedProfile._id;

    // Atomically claim an unassigned READY order. If another
    // rider claims it first, this update cannot overwrite them.
    const order = await Order.findOneAndUpdate(
      {
        _id: orderId,
        rider: null,
        status: 'READY',
        deliveryCity: riderProfile.city,
        deliveryArea: riderProfile.area,
      },
      {
        $set: {
          rider: riderId,
          riderAcceptedAt: new Date(),
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!order) {
      await syncRiderAvailability(riderId);

      reservedProfileId = null;

      return res.status(409).json({
        success: false,
        message:
          'This delivery is no longer available. It may already be assigned or may not be ready.',
      });
    }

    try {
      await addOrderHistory({
        orderId: order._id,
        status: 'READY',
        changedBy: riderId,
        note: 'Rider accepted an unassigned delivery.',
      });
    } catch (historyError) {
      console.error(
        'Failed to save rider acceptance history:',
        historyError
      );

      // Roll back only if this rider still owns the order.
      const rollback = await Order.updateOne(
        {
          _id: order._id,
          rider: riderId,
          status: 'READY',
        },
        {
          $set: {
            rider: null,
            riderAcceptedAt: null,
          },
        }
      );

      if (rollback.modifiedCount > 0) {
        await syncRiderAvailability(riderId);
        reservedProfileId = null;
      }

      return res.status(500).json({
        success: false,
        message:
          'The delivery could not be accepted because its history could not be saved.',
      });
    }

    reservedProfileId = null;

    const populatedOrder = await Order.findById(order._id)
      .populate('restaurant', 'name address city area phone')
      .populate('customer', 'name phone')
      .lean();

    return res.json({
      success: true,
      message: 'Delivery accepted successfully.',
      order: populatedOrder || order,
    });
  } catch (error) {
    console.error('Accept rider order error:', error);

    if (reservedProfileId) {
      try {
        await syncRiderAvailability(getRiderId(req));
      } catch (availabilityError) {
        console.error(
          'Failed to synchronize rider availability:',
          availabilityError
        );
      }
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to accept delivery.',
    });
  }
};

const pickupRiderOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const riderId = getRiderId(req);

    if (!riderId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (!isValidOrderId(orderId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID.',
      });
    }

    // Only the assigned rider can move a READY order onto the route.
    const order = await Order.findOneAndUpdate(
      {
        _id: orderId,
        rider: riderId,
        status: 'READY',
      },
      {
        $set: {
          status: 'ON_ROUTE',
          pickedUpAt: new Date(),
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!order) {
      const existingOrder = await Order.findOne({
        _id: orderId,
        rider: riderId,
      }).select('status');

      if (!existingOrder) {
        return res.status(404).json({
          success: false,
          message: 'This order is not assigned to you.',
        });
      }

      return res.status(409).json({
        success: false,
        message:
          ['PLACED', 'RECEIVED', 'PREPARING'].includes(
            existingOrder.status
          )
            ? 'The restaurant is still preparing this order. You can pick it up when it is marked ready.'
            : 'This order is no longer available for pickup.',
      });
    }

    try {
      await addOrderHistory({
        orderId: order._id,
        status: 'ON_ROUTE',
        changedBy: riderId,
        note: 'Rider picked up the order and started delivery.',
      });
    } catch (historyError) {
      console.error('Failed to save pickup history:', historyError);

      await Order.updateOne(
        {
          _id: order._id,
          rider: riderId,
          status: 'ON_ROUTE',
        },
        {
          $set: {
            status: 'READY',
            pickedUpAt: null,
          },
        }
      );

      return res.status(500).json({
        success: false,
        message:
          'Pickup status could not be saved to order history.',
      });
    }

    return res.json({
      success: true,
      message: 'Order picked up successfully.',
      order,
    });
  } catch (error) {
    console.error('Pickup rider order error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to update pickup status.',
    });
  }
};

const deliverRiderOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const riderId = getRiderId(req);

    if (!riderId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (!isValidOrderId(orderId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID.',
      });
    }

    const order = await Order.findOneAndUpdate(
      {
        _id: orderId,
        rider: riderId,
        status: 'ON_ROUTE',
      },
      {
        $set: {
          status: 'DELIVERED',
          deliveredAt: new Date(),
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
          'This delivery is not assigned to you, is not on route, or has already been completed.',
      });
    }

    try {
      await addOrderHistory({
        orderId: order._id,
        status: 'DELIVERED',
        changedBy: riderId,
        note: 'Rider confirmed that the order was delivered.',
      });
    } catch (historyError) {
      console.error('Failed to save delivery history:', historyError);

      await Order.updateOne(
        {
          _id: order._id,
          rider: riderId,
          status: 'DELIVERED',
        },
        {
          $set: {
            status: 'ON_ROUTE',
            deliveredAt: null,
          },
        }
      );

      return res.status(500).json({
        success: false,
        message:
          'Delivery could not be completed because its history could not be saved.',
      });
    }

    // Count the completed delivery and only release the rider
    // if they have no other active orders.
    await RiderProfile.updateOne(
      { user: riderId },
      {
        $inc: {
          totalDeliveries: 1,
          completedDeliveries: 1,
        },
      }
    );

    await syncRiderAvailability(riderId, order._id);

    return res.json({
      success: true,
      message: 'Order delivered successfully.',
      order,
    });
  } catch (error) {
    console.error('Deliver rider order error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to complete delivery.',
    });
  }
};

module.exports = {
  getAvailableRiderOrders,
  getMyRiderOrders,
  acceptRiderOrder,
  pickupRiderOrder,
  deliverRiderOrder,
};
