const User = require('../models/User');
const RiderApplication = require('../models/RiderApplication');
const RiderProfile = require('../models/RiderProfile');
const BusinessApplication = require('../models/BusinessApplication');
const Restaurant = require('../models/Restaurant');
const Order = require('../models/Order');

const getPendingRiderApplications = async (req, res) => {
  try {
    const applications = await RiderApplication.find({
      status: 'PENDING',
    })
      .populate('user', 'name email phone status createdAt')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: applications.length,
      applications,
    });
  } catch (error) {
    console.error('Get pending rider applications error:', error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong while getting rider applications.',
    });
  }
};

const getPendingBusinessApplications = async (req, res) => {
  try {
    const applications = await BusinessApplication.find({
      status: 'PENDING',
    })
      .populate('user', 'name email phone status createdAt')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: applications.length,
      applications,
    });
  } catch (error) {
    console.error('Get pending business applications error:', error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong while getting business applications.',
    });
  }
};

const approveRiderApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const application = await RiderApplication.findById(applicationId);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Rider application not found.',
      });
    }

    if (application.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'This rider application has already been reviewed.',
      });
    }

    const user = await User.findById(application.user);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'The user account linked to this application was not found.',
      });
    }

    if (user.role !== 'RIDER') {
      return res.status(400).json({
        success: false,
        message: 'The linked user is not a rider account.',
      });
    }

    const riderProfileData = {
      user: user._id,
      vehicleType: application.vehicleType,
      vehicleNumber: application.vehicleNumber,
      vehiclePhoto: application.vehiclePhoto,
      drivingLicenseNumber: application.drivingLicenseNumber,
      city: application.city,
      area: application.area,
      isAvailable: false,
      isOnline: false,
      isActive: true,
    };

    const riderProfile = await RiderProfile.findOneAndUpdate(
      { user: user._id },
      {
        $set: riderProfileData,
        $unset: { currentLocation: '' },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    user.status = 'ACTIVE';
    user.rejectionReason = undefined;
    user.approvedAt = new Date();
    user.rejectedAt = undefined;
    await user.save();

    application.status = 'APPROVED';
    application.reviewedBy = req.user.userId;
    application.reviewedAt = new Date();
    application.approvedAt = new Date();
    application.rejectionReason = undefined;
    application.rejectedAt = undefined;
    await application.save();

    return res.status(200).json({
      success: true,
      message: 'Rider application approved successfully.',
      application,
      riderProfile,
    });
  } catch (error) {
    console.error('Approve rider application error:', error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong while approving the rider application.',
    });
  }
};

const rejectRiderApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { rejectionReason } = req.body;

    if (!rejectionReason || !rejectionReason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A rejection reason is required.',
      });
    }

    const application = await RiderApplication.findById(applicationId);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Rider application not found.',
      });
    }

    if (application.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'This rider application has already been reviewed.',
      });
    }

    const user = await User.findById(application.user);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'The user account linked to this application was not found.',
      });
    }

    user.status = 'REJECTED';
    user.rejectionReason = rejectionReason.trim();
    user.rejectedAt = new Date();
    user.approvedAt = undefined;
    await user.save();

    application.status = 'REJECTED';
    application.reviewedBy = req.user.userId;
    application.reviewedAt = new Date();
    application.rejectedAt = new Date();
    application.approvedAt = undefined;
    application.rejectionReason = rejectionReason.trim();
    await application.save();

    return res.status(200).json({
      success: true,
      message: 'Rider application rejected successfully.',
      application,
    });
  } catch (error) {
    console.error('Reject rider application error:', error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong while rejecting the rider application.',
    });
  }
};
const approveBusinessApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const application = await BusinessApplication.findById(applicationId);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Business application not found.',
      });
    }

    if (application.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'This business application has already been reviewed.',
      });
    }

    const user = await User.findById(application.user);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'The user account linked to this application was not found.',
      });
    }

    if (user.role !== 'BUSINESS') {
      return res.status(400).json({
        success: false,
        message: 'The linked user is not a business account.',
      });
    }

    const logo = typeof application.logo === 'string'
      ? application.logo.trim()
      : '';

    const banner = typeof application.banner === 'string'
      ? application.banner.trim()
      : '';

    let restaurant = await Restaurant.findOne({ owner: user._id });

    if (!restaurant) {
      restaurant = await Restaurant.create({
        owner: user._id,
        businessApplication: application._id,
        name: application.restaurantName ||
          `${application.ownerName}'s Restaurant`,
        description: application.description || '',
        logo,
        banner,
        images: Array.isArray(application.images)
          ? application.images
          : [],
        cuisineCategories: Array.isArray(application.cuisineCategories)
          ? application.cuisineCategories
          : [],
        address: application.completeAddress,
        city: application.city,
        area: application.area,
        location: application.restaurantLocation,
        phone: application.ownerMobileNumber,
        openingTime: application.openingTime || '09:00',
        closingTime: application.closingTime || '22:00',
        deliveryAreas: Array.isArray(application.deliveryAreas)
          ? application.deliveryAreas
          : [],
        averagePreparationTime: application.averagePreparationTime || 30,
        deliveryFee: application.deliveryFee ?? 0,
        deliveryRules: application.deliveryRules || '',
        payoutDetails: application.bankAccountDetails || '',
        isOpen: false,
        isActive: true,
        isVerified: true,
      });
    } else {
      restaurant.businessApplication = application._id;
      restaurant.isVerified = true;
      restaurant.isActive = true;

      // Copy the logo only when the application has a saved logo.
      if (logo) {
        restaurant.logo = logo;
      }

      if (banner) {
        restaurant.banner = banner;
      }

      if (Array.isArray(application.images) && application.images.length) {
        restaurant.images = application.images;
      }

      await restaurant.save();
    }

    user.status = 'ACTIVE';
    user.rejectionReason = undefined;
    user.approvedAt = new Date();
    user.rejectedAt = undefined;
    await user.save();

    application.status = 'APPROVED';
    application.reviewedBy = req.user.userId;
    application.reviewedAt = new Date();
    application.approvedAt = new Date();
    application.rejectionReason = undefined;
    application.rejectedAt = undefined;
    await application.save();

    return res.status(200).json({
      success: true,
      message: 'Business application approved successfully.',
      application,
      restaurant,
    });
  } catch (error) {
    console.error('Approve business application error:', error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong while approving the business application.',
    });
  }
};

const rejectBusinessApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { rejectionReason } = req.body;

    if (!rejectionReason || !rejectionReason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A rejection reason is required.',
      });
    }

    const application = await BusinessApplication.findById(applicationId);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Business application not found.',
      });
    }

    if (application.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'This business application has already been reviewed.',
      });
    }

    const user = await User.findById(application.user);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'The user account linked to this application was not found.',
      });
    }

    user.status = 'REJECTED';
    user.rejectionReason = rejectionReason.trim();
    user.rejectedAt = new Date();
    user.approvedAt = undefined;
    await user.save();

    application.status = 'REJECTED';
    application.reviewedBy = req.user.userId;
    application.reviewedAt = new Date();
    application.rejectedAt = new Date();
    application.approvedAt = undefined;
    application.rejectionReason = rejectionReason.trim();
    await application.save();

    return res.status(200).json({
      success: true,
      message: 'Business application rejected successfully.',
      application,
    });
  } catch (error) {
    console.error('Reject business application error:', error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong while rejecting the business application.',
    });
  }
};
const getAllRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.find()
      .populate('owner', 'name email phone status profilePhoto')
      .populate('businessApplication', 'restaurantName ownerName status logo')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: restaurants.length,
      restaurants,
    });
  } catch (error) {
    console.error('Get all restaurants error:', error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong while getting restaurants.',
    });
  }
};

const getRestaurantById = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const restaurant = await Restaurant.findById(restaurantId)
      .populate('owner', 'name email phone status profilePhoto')
      .populate('businessApplication', 'restaurantName ownerName status logo');

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found.',
      });
    }

    return res.status(200).json({ success: true, restaurant });
  } catch (error) {
    console.error('Get restaurant by ID error:', error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong while getting the restaurant.',
    });
  }
};

const createRestaurant = async (req, res) => {
  try {
    const {
      owner, businessApplication, name, description, logo, banner, images,
      cuisineCategories, address, city, area, location, phone, secondaryPhone,
      openingTime, closingTime, deliveryAreas, averagePreparationTime,
      deliveryFee, deliveryRules, commissionRate, payoutDetails, isOpen,
      isActive, isFeatured, isVerified,
    } = req.body;

    if (
      !owner || !name || !address || !city || !area || !location ||
      !phone || !openingTime || !closingTime
    ) {
      return res.status(400).json({
        success: false,
        message: 'Owner, name, address, city, area, location, phone, opening time and closing time are required.',
      });
    }

    const ownerUser = await User.findById(owner);

    if (!ownerUser) {
      return res.status(404).json({
        success: false,
        message: 'The restaurant owner account was not found.',
      });
    }

    if (ownerUser.role !== 'BUSINESS') {
      return res.status(400).json({
        success: false,
        message: 'Restaurant owner must have the BUSINESS role.',
      });
    }

    if (await Restaurant.findOne({ owner })) {
      return res.status(400).json({
        success: false,
        message: 'This business owner already has a restaurant.',
      });
    }

    const restaurant = await Restaurant.create({
      owner, businessApplication, name, description, logo, banner, images,
      cuisineCategories, address, city, area, location, phone, secondaryPhone,
      openingTime, closingTime, deliveryAreas, averagePreparationTime,
      deliveryFee, deliveryRules, commissionRate, payoutDetails,
      isOpen: typeof isOpen === 'boolean' ? isOpen : false,
      isActive: typeof isActive === 'boolean' ? isActive : true,
      isFeatured: typeof isFeatured === 'boolean' ? isFeatured : false,
      isVerified: typeof isVerified === 'boolean' ? isVerified : true,
    });

    return res.status(201).json({
      success: true,
      message: 'Restaurant created successfully.',
      restaurant,
    });
  } catch (error) {
    console.error('Create restaurant error:', error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong while creating the restaurant.',
    });
  }
};

const updateRestaurant = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const restaurant = await Restaurant.findById(restaurantId);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found.',
      });
    }

    const allowedFields = [
      'owner', 'businessApplication', 'name', 'description', 'logo', 'banner',
      'images', 'cuisineCategories', 'address', 'city', 'area', 'location',
      'phone', 'secondaryPhone', 'openingTime', 'closingTime', 'deliveryAreas',
      'averagePreparationTime', 'deliveryFee', 'deliveryRules', 'commissionRate',
      'payoutDetails', 'isOpen', 'isActive', 'isFeatured', 'isVerified',
    ];

    allowedFields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        restaurant[field] = req.body[field];
      }
    });

    if (restaurant.owner) {
      const ownerUser = await User.findById(restaurant.owner);

      if (!ownerUser) {
        return res.status(404).json({
          success: false,
          message: 'The restaurant owner account was not found.',
        });
      }

      if (ownerUser.role !== 'BUSINESS') {
        return res.status(400).json({
          success: false,
          message: 'Restaurant owner must have the BUSINESS role.',
        });
      }
    }

    await restaurant.save();

    return res.status(200).json({
      success: true,
      message: 'Restaurant updated successfully.',
      restaurant,
    });
  } catch (error) {
    console.error('Update restaurant error:', error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong while updating the restaurant.',
    });
  }
};

const deleteRestaurant = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const restaurant = await Restaurant.findById(restaurantId);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found.',
      });
    }

    await Restaurant.findByIdAndDelete(restaurantId);

    return res.status(200).json({
      success: true,
      message: 'Restaurant deleted successfully.',
    });
  } catch (error) {
    console.error('Delete restaurant error:', error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong while deleting the restaurant.',
    });
  }
};

const updateRestaurantStatusByAdmin = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { isOpen, isActive, isFeatured, isVerified } = req.body;
    const restaurant = await Restaurant.findById(restaurantId);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found.',
      });
    }

    if (typeof isOpen === 'boolean') restaurant.isOpen = isOpen;

    if (typeof isActive === 'boolean') {
      restaurant.isActive = isActive;
      if (!isActive) restaurant.isOpen = false;
    }

    if (typeof isFeatured === 'boolean') restaurant.isFeatured = isFeatured;
    if (typeof isVerified === 'boolean') restaurant.isVerified = isVerified;

    await restaurant.save();

    return res.status(200).json({
      success: true,
      message: 'Restaurant status updated successfully.',
      restaurant,
    });
  } catch (error) {
    console.error('Update restaurant status by admin error:', error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong while updating restaurant status.',
    });
  }
};

const getBusinessOwners = async (req, res) => {
  try {
    const owners = await User.find({
      role: 'BUSINESS',
      status: 'ACTIVE',
    })
      .select('_id name email phone profilePhoto status')
      .sort({ name: 1 });

    return res.status(200).json({
      success: true,
      count: owners.length,
      owners,
    });
  } catch (error) {
    console.error('Get business owners error:', error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong while getting business owners.',
    });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers, activeCustomers, pendingRiders, approvedRiders,
      pendingBusinesses, approvedBusinesses, totalRestaurants,
      activeRestaurants, totalOrders,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'CUSTOMER', status: 'ACTIVE' }),
      RiderApplication.countDocuments({ status: 'PENDING' }),
      RiderApplication.countDocuments({ status: 'APPROVED' }),
      BusinessApplication.countDocuments({ status: 'PENDING' }),
      BusinessApplication.countDocuments({ status: 'APPROVED' }),
      Restaurant.countDocuments(),
      Restaurant.countDocuments({ isActive: true }),
      Order.countDocuments(),
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        totalUsers, activeCustomers, pendingRiders, approvedRiders,
        pendingBusinesses, approvedBusinesses, totalRestaurants,
        activeRestaurants, totalOrders,
      },
    });
  } catch (error) {
    console.error('Get admin dashboard stats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong while getting dashboard statistics.',
    });
  }
};

module.exports = {
  getPendingRiderApplications,
  getPendingBusinessApplications,
  approveRiderApplication,
  rejectRiderApplication,
  approveBusinessApplication,
  rejectBusinessApplication,
  getBusinessOwners,
  getAllRestaurants,
  getRestaurantById,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
  updateRestaurantStatusByAdmin,
  getDashboardStats,
};
