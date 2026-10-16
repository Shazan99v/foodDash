const crypto = require('crypto');

const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const Restaurant = require('../models/Restaurant');
const RiderProfile = require('../models/RiderProfile');
const OrderStatusHistory = require('../models/OrderStatusHistory');

const PAYMENT_METHOD_MAP = {
  cash_on_delivery: 'COD',
  jazzcash: 'JAZZCASH',
  easypaisa: 'EASYPAISA',
  card: 'CARD',
};

const DELIVERY_FREE_THRESHOLD = 1500;

const getCustomerId = (req) =>
  req.user?.userId || req.user?._id || req.user?.id;

/**
 * Reserve an eligible rider immediately after order creation.
 *
 * RiderProfile.user references User, and Order.rider also references User.
 * isAvailable is set to false atomically so another order cannot reserve
 * the same rider at the same time.
 */
const assignAvailableRider = async (order, restaurant) => {
  const city = String(restaurant.city || '').trim();
  const restaurantArea = String(restaurant.area || '').trim();

  const baseQuery = {
    isActive: true,
    isOnline: true,
    isAvailable: true,
  };

  let candidates = [];

  // Prefer riders in the restaurant's city and area.
  if (city && restaurantArea) {
    candidates = await RiderProfile.find({
      ...baseQuery,
      city: { $regex: `^${city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
      area: {
        $regex: `^${restaurantArea.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
        $options: 'i',
      },
    })
      .sort({ createdAt: 1, _id: 1 })
      .select('_id user city area')
      .lean();
  }

  // If nobody is available in that area, try any available rider
  // in the same city.
  if (candidates.length === 0 && city) {
    candidates = await RiderProfile.find({
      ...baseQuery,
      city: { $regex: `^${city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
    })
      .sort({ createdAt: 1, _id: 1 })
      .select('_id user city area')
      .lean();
  }

  // Do not assign a rider from a different city.
  for (const candidate of candidates) {
    if (!candidate.user) continue;

    // Atomic reservation: only one concurrent order can change an
    // available profile from true to false.
    const reservedRider = await RiderProfile.findOneAndUpdate(
      {
        _id: candidate._id,
        isActive: true,
        isOnline: true,
        isAvailable: true,
      },
      {
        $set: { isAvailable: false },
      },
      {
        new: true,
      }
    ).select('_id user');

    if (!reservedRider?.user) continue;

    try {
      // Assign the rider without changing the restaurant's order status.
      const updatedOrder = await Order.findOneAndUpdate(
        {
          _id: order._id,
          rider: null,
          status: 'PLACED',
        },
        {
          $set: { rider: reservedRider.user },
        },
        {
          new: true,
          runValidators: true,
        }
      );

      if (updatedOrder) {
        try {
          await OrderStatusHistory.create({
            order: order._id,
            status: 'PLACED',
            changedBy: reservedRider.user,
            note: 'A rider was assigned automatically when the order was placed.',
          });
        } catch (historyError) {
          console.error(
            'Rider assignment history error:',
            historyError.message
          );
        }

        console.log(
          `Rider ${reservedRider.user} assigned to order ${order.orderNumber}`
        );

        return {
          assigned: true,
          riderId: String(reservedRider.user),
        };
      }

      // The order was changed before assignment completed.
      await RiderProfile.updateOne(
        { _id: reservedRider._id },
        { $set: { isAvailable: true } }
      );
    } catch (assignmentError) {
      // Release the reservation if assigning the rider fails.
      await RiderProfile.updateOne(
        { _id: reservedRider._id },
        { $set: { isAvailable: true } }
      ).catch((releaseError) => {
        console.error('Could not release rider:', releaseError.message);
      });

      console.error(
        'Automatic rider assignment error:',
        assignmentError.message
      );
    }
  }

  console.log(
    `No available rider found for order ${order.orderNumber}`
  );

  return { assigned: false, riderId: null };
};

const getHistoryForOrder = async (orderId) => {
  return OrderStatusHistory.find({ order: orderId })
    .populate('changedBy', 'name role')
    .sort({ createdAt: 1 })
    .lean();
};

const createCustomerOrder = async (req, res) => {
  try {
    const customerId = getCustomerId(req);

    if (!customerId) {
      return res.status(401).json({
        message: 'Authentication required.',
      });
    }

    const { items, delivery, paymentMethod, customerNote } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: 'Your order must contain at least one item.',
      });
    }

    if (!delivery || typeof delivery !== 'object') {
      return res.status(400).json({
        message: 'Delivery information is required.',
      });
    }

    const {
      name,
      phone,
      alternatePhone,
      address,
      label,
      latitude,
      longitude,
    } = delivery;

    if (!name?.trim()) {
      return res.status(400).json({
        message: 'Delivery name is required.',
      });
    }

    if (!phone?.trim()) {
      return res.status(400).json({
        message: 'Delivery phone is required.',
      });
    }

    if (!address?.trim()) {
      return res.status(400).json({
        message: 'Delivery address is required.',
      });
    }

    const normalizedPaymentMethod =
      PAYMENT_METHOD_MAP[paymentMethod];

    if (!normalizedPaymentMethod) {
      return res.status(400).json({
        message: 'Invalid payment method.',
      });
    }

    const requestedMenuItemIds = items.map(
      (item) => item.food || item.menuItem
    );

    if (requestedMenuItemIds.some((id) => !id)) {
      return res.status(400).json({
        message: 'Every order item must contain a menu item.',
      });
    }

    const uniqueMenuItemIds = [
      ...new Set(requestedMenuItemIds.map(String)),
    ];

    const menuItems = await MenuItem.find({
      _id: { $in: uniqueMenuItemIds },
    }).lean();

    if (menuItems.length !== uniqueMenuItemIds.length) {
      return res.status(404).json({
        message: 'One or more menu items were not found.',
      });
    }

    const menuItemMap = new Map(
      menuItems.map((item) => [String(item._id), item])
    );

    const restaurantId = String(menuItems[0].restaurant);

    if (
      menuItems.some(
        (item) => String(item.restaurant) !== restaurantId
      )
    ) {
      return res.status(400).json({
        message:
          'You can only order from one restaurant at a time.',
      });
    }

    const restaurant = await Restaurant.findById(
      restaurantId
    ).lean();

    if (!restaurant) {
      return res.status(404).json({
        message: 'Restaurant not found.',
      });
    }

    if (!restaurant.isActive) {
      return res.status(400).json({
        message: 'This restaurant is currently unavailable.',
      });
    }

    if (!restaurant.isOpen) {
      return res.status(400).json({
        message: 'This restaurant is currently closed.',
      });
    }

    const orderItems = [];
    let subtotal = 0;

    for (const requestedItem of items) {
      const menuItemId =
        requestedItem.food || requestedItem.menuItem;

      const menuItem = menuItemMap.get(String(menuItemId));

      if (!menuItem) {
        return res.status(404).json({
          message: `Menu item ${menuItemId} was not found.`,
        });
      }

      if (!menuItem.isAvailable) {
        return res.status(400).json({
          message: `${menuItem.name} is currently unavailable.`,
        });
      }

      const quantity = Number(requestedItem.quantity);

      if (
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        quantity > 50
      ) {
        return res.status(400).json({
          message: `Invalid quantity for ${menuItem.name}.`,
        });
      }

      const unitPrice =
        typeof menuItem.discountedPrice === 'number' &&
        menuItem.discountedPrice >= 0
          ? menuItem.discountedPrice
          : menuItem.price;

      if (
        !Number.isFinite(Number(unitPrice)) ||
        Number(unitPrice) < 0
      ) {
        return res.status(400).json({
          message: `Invalid price for ${menuItem.name}.`,
        });
      }

      const total = Number(unitPrice) * quantity;
      subtotal += total;

      orderItems.push({
        menuItem: menuItem._id,
        name: menuItem.name,
        image: menuItem.image || '',
        quantity,
        price: Number(unitPrice),
        total,
      });
    }

    const deliveryFee =
      subtotal >= DELIVERY_FREE_THRESHOLD
        ? 0
        : Number(restaurant.deliveryFee || 0);

    const totalAmount = subtotal + deliveryFee;

    const hasCoordinates =
      latitude !== undefined &&
      latitude !== null &&
      longitude !== undefined &&
      longitude !== null &&
      String(latitude).trim() !== '' &&
      String(longitude).trim() !== '' &&
      Number.isFinite(Number(latitude)) &&
      Number.isFinite(Number(longitude));

    const customerLocation = hasCoordinates
      ? {
          type: 'Point',
          coordinates: [
            Number(longitude),
            Number(latitude),
          ],
        }
      : undefined;

    const orderNumber =
      `ORD-${Date.now()}-${crypto.randomUUID()
        .replace(/-/g, '')
        .slice(0, 12)
        .toUpperCase()}`;

    const order = await Order.create({
      orderNumber,
      customer: customerId,
      restaurant: restaurant._id,
      business: restaurant.owner,
      items: orderItems,
      subtotal,
      deliveryFee,
      totalAmount,
      paymentMethod: normalizedPaymentMethod,
      paymentStatus: 'PENDING',
      status: 'PLACED',
      customerName: name.trim(),
      customerPhone: phone.trim(),
      alternatePhone: alternatePhone?.trim() || '',
      deliveryAddress: address.trim(),
      deliveryCity: restaurant.city,
      deliveryArea:
        label?.trim() || restaurant.area || 'Unknown',
      customerLocation,
      customerNote:
        typeof customerNote === 'string'
          ? customerNote.trim()
          : '',
      cancellationReason: null,
    });

    try {
      await OrderStatusHistory.create({
        order: order._id,
        status: 'PLACED',
        changedBy: customerId,
        note: 'Order placed by customer.',
      });
    } catch (historyError) {
      console.error(
        'Order status history error:',
        historyError.message
      );
    }

    // Assign a free rider immediately after saving the order.
    // Assignment does not wait for restaurant preparation.
    let riderAssignment = { assigned: false, riderId: null };

    try {
      riderAssignment = await assignAvailableRider(
        order,
        restaurant
      );
    } catch (assignmentError) {
      // Do not lose a valid customer order just because no rider
      // could be assigned at this moment.
      console.error(
        'Automatic rider assignment failed:',
        assignmentError.message
      );
    }

    await Promise.all([
      Restaurant.findByIdAndUpdate(restaurant._id, {
        $inc: { totalOrders: 1 },
      }),
      MenuItem.updateMany(
        {
          _id: {
            $in: orderItems.map((item) => item.menuItem),
          },
        },
        {
          $inc: { totalOrders: 1 },
        }
      ),
    ]);

    const populatedOrder = await Order.findById(order._id)
      .populate(
        'restaurant',
        'name logo banner phone city area deliveryFee'
      )
      .populate('business', 'name phone email')
      .populate('rider', 'name phone')
      .lean();

    return res.status(201).json({
      message: riderAssignment.assigned
        ? 'Order placed successfully. A rider has been assigned.'
        : 'Order placed successfully. Waiting for an available rider.',
      riderAssigned: riderAssignment.assigned,
      order: populatedOrder,
    });
  } catch (error) {
    console.error('Create customer order error:', error);

    if (error.code === 11000) {
      return res.status(409).json({
        message:
          'A duplicate value prevented the order from being saved. Please try again.',
      });
    }

    return res.status(500).json({
      message: 'Failed to create order.',
      error:
        process.env.NODE_ENV === 'development'
          ? error.message
          : undefined,
    });
  }
};

const getCustomerOrders = async (req, res) => {
  try {
    const customerId = getCustomerId(req);

    if (!customerId) {
      return res.status(401).json({
        message: 'Authentication required.',
      });
    }

    const orders = await Order.find({
      customer: customerId,
    })
      .populate('restaurant', 'name logo banner city area')
      .populate('rider', 'name phone')
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ orders });
  } catch (error) {
    console.error('Get customer orders error:', error);

    return res.status(500).json({
      message: 'Failed to load orders.',
    });
  }
};

const getCustomerOrder = async (req, res) => {
  try {
    const customerId = getCustomerId(req);

    if (!customerId) {
      return res.status(401).json({
        message: 'Authentication required.',
      });
    }

    const order = await Order.findOne({
      _id: req.params.id,
      customer: customerId,
    })
      .populate(
        'restaurant',
        'name logo banner phone address city area deliveryFee'
      )
      .populate('business', 'name phone email')
      .populate('rider', 'name phone')
      .lean();

    if (!order) {
      return res.status(404).json({
        message: 'Order not found.',
      });
    }

    const history = await getHistoryForOrder(order._id);

    return res.status(200).json({
      order,
      history,
    });
  } catch (error) {
    console.error('Get customer order error:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        message: 'Invalid order ID.',
      });
    }

    return res.status(500).json({
      message: 'Failed to load order.',
    });
  }
};

const cancelCustomerOrder = async (req, res) => {
  try {
    const customerId = getCustomerId(req);

    if (!customerId) {
      return res.status(401).json({
        message: 'Authentication required.',
      });
    }

    const reason =
      typeof req.body?.reason === 'string'
        ? req.body.reason.trim()
        : '';

    const order = await Order.findOneAndUpdate(
      {
        _id: req.params.id,
        customer: customerId,
        status: { $in: ['PLACED', 'RECEIVED'] },
      },
      {
        $set: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancellationReason:
            reason || 'Cancelled by customer.',
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!order) {
      const existingOrder = await Order.findOne({
        _id: req.params.id,
        customer: customerId,
      }).select('_id status');

      if (!existingOrder) {
        return res.status(404).json({
          message: 'Order not found.',
        });
      }

      return res.status(400).json({
        message:
          'This order can no longer be cancelled.',
      });
    }

    try {
      await OrderStatusHistory.create({
        order: order._id,
        status: 'CANCELLED',
        changedBy: customerId,
        note: order.cancellationReason,
      });
    } catch (historyError) {
      console.error(
        'Cancel order history error:',
        historyError.message
      );
    }

    // Release an assigned rider when an order is cancelled.
    if (order.rider) {
      await RiderProfile.updateOne(
        { user: order.rider },
        { $set: { isAvailable: true } }
      ).catch((releaseError) => {
        console.error(
          'Could not release rider after cancellation:',
          releaseError.message
        );
      });
    }

    return res.status(200).json({
      message: 'Order cancelled successfully.',
      order,
    });
  } catch (error) {
    console.error('Cancel customer order error:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        message: 'Invalid order ID.',
      });
    }

    return res.status(500).json({
      message: 'Failed to cancel order.',
    });
  }
};

module.exports = {
  createCustomerOrder,
  getCustomerOrders,
  getCustomerOrder,
  cancelCustomerOrder,
};
