const User = require('../models/User');
const RiderProfile = require('../models/RiderProfile');
const RiderApplication = require('../models/RiderApplication');

const getAllRiders = async (req, res) => {
  try {
    const riders = await User.find({
      role: 'RIDER',
    })
      .select(
        '_id name email phone secondaryPhone address city area profilePhoto status createdAt lastLoginAt'
      )
      .sort({
        createdAt: -1,
      })
      .lean();

    const riderIds = riders.map(
      (rider) => rider._id
    );

    const profiles = await RiderProfile.find({
      user: {
        $in: riderIds,
      },
    })
      .select(
        'user vehicleType vehicleNumber vehiclePhoto drivingLicenseNumber city area currentLocation isAvailable isOnline totalDeliveries completedDeliveries cancelledDeliveries rating totalRatings isActive createdAt updatedAt'
      )
      .lean();

    const applications =
      await RiderApplication.find({
        user: {
          $in: riderIds,
        },
      })
        .select(
          'user name fatherName mobileNumber fatherMobileNumber email cnic vehicleType vehicleNumber vehiclePhoto drivingLicenseNumber city area completeAddress emergencyContact dailyWorkingHours status rejectionReason reviewedBy reviewedAt approvedAt rejectedAt createdAt updatedAt'
        )
        .populate(
          'reviewedBy',
          'name email'
        )
        .lean();

    const profileMap = new Map();

    profiles.forEach((profile) => {
      profileMap.set(
        String(profile.user),
        profile
      );
    });

    const applicationMap = new Map();

    applications.forEach((application) => {
      applicationMap.set(
        String(application.user),
        application
      );
    });

    const result = riders.map((rider) => {
      const key = String(rider._id);

      return {
        ...rider,
        profile:
          profileMap.get(key) || null,
        application:
          applicationMap.get(key) || null,
      };
    });

    return res.status(200).json({
      success: true,
      count: result.length,
      riders: result,
    });
  } catch (error) {
    console.error(
      'Get all riders error:',
      error
    );

    return res.status(500).json({
      success: false,
      message: 'Failed to load riders.',
    });
  }
};

const updateRider = async (req, res) => {
  try {
    const { riderId } = req.params;

    const {
      name,
      phone,
      secondaryPhone,
      address,
      city,
      area,
      vehicleType,
      vehicleNumber,
      drivingLicenseNumber,
    } = req.body;

    const rider = await User.findOne({
      _id: riderId,
      role: 'RIDER',
    });

    if (!rider) {
      return res.status(404).json({
        success: false,
        message: 'Rider not found.',
      });
    }

    if (name !== undefined) {
      rider.name = String(name).trim();
    }

    if (phone !== undefined) {
      rider.phone = String(phone).trim();
    }

    if (secondaryPhone !== undefined) {
      rider.secondaryPhone =
        String(secondaryPhone).trim();
    }

    if (address !== undefined) {
      rider.address = String(address).trim();
    }

    if (city !== undefined) {
      rider.city = String(city).trim();
    }

    if (area !== undefined) {
      rider.area = String(area).trim();
    }

    await rider.save();

    const profile = await RiderProfile.findOne({
      user: rider._id,
    });

    if (profile) {
      if (vehicleType !== undefined) {
        if (
          !['BIKE', 'CYCLE'].includes(
            vehicleType
          )
        ) {
          return res.status(400).json({
            success: false,
            message: 'Invalid vehicle type.',
          });
        }

        profile.vehicleType = vehicleType;
      }

      if (vehicleNumber !== undefined) {
        profile.vehicleNumber =
          String(vehicleNumber)
            .trim()
            .toUpperCase();
      }

      if (
        drivingLicenseNumber !== undefined
      ) {
        profile.drivingLicenseNumber =
          String(
            drivingLicenseNumber
          ).trim();
      }

      if (city !== undefined) {
        profile.city =
          String(city).trim();
      }

      if (area !== undefined) {
        profile.area =
          String(area).trim();
      }

      await profile.save();
    }

    const updatedRider =
      await User.findById(rider._id)
        .select(
          '_id name email phone secondaryPhone address city area profilePhoto status createdAt lastLoginAt'
        )
        .lean();

    const updatedProfile =
      await RiderProfile.findOne({
        user: rider._id,
      }).lean();

    return res.status(200).json({
      success: true,
      message: 'Rider updated successfully.',
      rider: {
        ...updatedRider,
        profile:
          updatedProfile || null,
      },
    });
  } catch (error) {
    console.error(
      'Update rider error:',
      error
    );

    return res.status(500).json({
      success: false,
      message: 'Failed to update rider.',
    });
  }
};

const banRider = async (req, res) => {
  try {
    const { riderId } = req.params;

    const rider = await User.findOne({
      _id: riderId,
      role: 'RIDER',
    });

    if (!rider) {
      return res.status(404).json({
        success: false,
        message: 'Rider not found.',
      });
    }

    rider.status = 'SUSPENDED';

    await rider.save();

    await RiderProfile.findOneAndUpdate(
      {
        user: rider._id,
      },
      {
        $set: {
          isActive: false,
          isOnline: false,
          isAvailable: false,
        },
      }
    );

    return res.status(200).json({
      success: true,
      message: 'Rider banned successfully.',
    });
  } catch (error) {
    console.error(
      'Ban rider error:',
      error
    );

    return res.status(500).json({
      success: false,
      message: 'Failed to ban rider.',
    });
  }
};

const unbanRider = async (req, res) => {
  try {
    const { riderId } = req.params;

    const rider = await User.findOne({
      _id: riderId,
      role: 'RIDER',
    });

    if (!rider) {
      return res.status(404).json({
        success: false,
        message: 'Rider not found.',
      });
    }

    rider.status = 'ACTIVE';

    await rider.save();

    await RiderProfile.findOneAndUpdate(
      {
        user: rider._id,
      },
      {
        $set: {
          isActive: true,
        },
      }
    );

    return res.status(200).json({
      success: true,
      message: 'Rider unbanned successfully.',
    });
  } catch (error) {
    console.error(
      'Unban rider error:',
      error
    );

    return res.status(500).json({
      success: false,
      message: 'Failed to unban rider.',
    });
  }
};

module.exports = {
  getAllRiders,
  updateRider,
  banRider,
  unbanRider,
};