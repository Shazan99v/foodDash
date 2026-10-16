const User = require('../models/User');
const RiderProfile = require('../models/RiderProfile');
const Order = require('../models/Order');

const ACTIVE_DELIVERY_STATUSES = [
  'PLACED',
  'RECEIVED',
  'PREPARING',
  'READY',
  'ON_ROUTE',
];

const getMyRiderDashboard = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id || req.user.id;

    const user = await User.findById(userId).select(
      'name email phone secondaryPhone address city area profilePhoto role status'
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Rider account not found.',
      });
    }

    if (user.role !== 'RIDER') {
      return res.status(403).json({
        success: false,
        message: 'This account is not a rider account.',
      });
    }

    const riderProfile = await RiderProfile.findOne({
      user: userId,
    });

    if (!riderProfile) {
      return res.status(404).json({
        success: false,
        message: 'Rider profile not found.',
      });
    }

    return res.json({
      success: true,
      rider: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        secondaryPhone: user.secondaryPhone,
        address: user.address,
        city: user.city,
        area: user.area,
        profilePhoto: user.profilePhoto,
        role: user.role,
        status: user.status,
      },
      profile: {
        vehicleType: riderProfile.vehicleType,
        vehicleNumber: riderProfile.vehicleNumber,
        vehiclePhoto: riderProfile.vehiclePhoto,
        drivingLicenseNumber: riderProfile.drivingLicenseNumber,
        city: riderProfile.city,
        area: riderProfile.area,
        isAvailable: riderProfile.isAvailable,
        isOnline: riderProfile.isOnline,
        totalDeliveries: riderProfile.totalDeliveries,
        completedDeliveries: riderProfile.completedDeliveries,
        cancelledDeliveries: riderProfile.cancelledDeliveries,
        rating: riderProfile.rating,
        totalRatings: riderProfile.totalRatings,
        isActive: riderProfile.isActive,
      },
    });
  } catch (error) {
    console.error('Get rider dashboard error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to load rider dashboard.',
    });
  }
};

const updateRiderOnlineStatus = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id || req.user.id;
    const { isOnline } = req.body;

    if (typeof isOnline !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isOnline must be a boolean.',
      });
    }

    const user = await User.findById(userId).select('status role');

    if (!user || user.role !== 'RIDER') {
      return res.status(404).json({
        success: false,
        message: 'Rider account not found.',
      });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        message: 'Your rider account is not active.',
      });
    }

    const riderProfile = await RiderProfile.findOne({
      user: userId,
    });

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

    // Going offline prevents new assignments but does not remove
    // any delivery already assigned to this rider.
    if (!isOnline) {
      riderProfile.isOnline = false;
      riderProfile.isAvailable = false;

      await riderProfile.save();

      return res.json({
        success: true,
        message: 'You are now offline.',
        isOnline: riderProfile.isOnline,
        isAvailable: riderProfile.isAvailable,
      });
    }

    // Do not mark the rider available if an assigned delivery
    // is still active, including while the restaurant prepares it.
    const activeAssignedOrder = await Order.exists({
      rider: userId,
      status: { $in: ACTIVE_DELIVERY_STATUSES },
    });

    riderProfile.isOnline = true;
    riderProfile.isAvailable = !activeAssignedOrder;

    await riderProfile.save();

    return res.json({
      success: true,
      message: activeAssignedOrder
        ? 'You are online, but unavailable for new orders because you have an active delivery.'
        : 'You are now online and available for deliveries.',
      isOnline: riderProfile.isOnline,
      isAvailable: riderProfile.isAvailable,
    });
  } catch (error) {
    console.error('Update rider online status error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to update online status.',
    });
  }
};

module.exports = {
  getMyRiderDashboard,
  updateRiderOnlineStatus,
};
