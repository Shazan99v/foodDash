const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/User');
const RiderApplication = require('../models/RiderApplication');
const BusinessApplication = require('../models/BusinessApplication');

const createToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const registerRider = async (req, res) => {
  try {
    const {
      name,
      fatherName,
      mobileNumber,
      fatherMobileNumber,
      email,
      cnic,
      vehicleType,
      vehicleNumber,
      vehiclePhoto,
      drivingLicenseNumber,
      city,
      area,
      completeAddress,
      emergencyContact,
      dailyWorkingHours,
      password,
    } = req.body;

    if (
      !name ||
      !fatherName ||
      !mobileNumber ||
      !fatherMobileNumber ||
      !email ||
      !cnic ||
      !vehicleType ||
      !vehicleNumber ||
      !vehiclePhoto ||
      !drivingLicenseNumber ||
      !city ||
      !area ||
      !completeAddress ||
      !emergencyContact ||
      dailyWorkingHours === undefined ||
      dailyWorkingHours === null ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: 'All rider application fields are required.',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters.',
      });
    }

    if (!['BIKE', 'CYCLE'].includes(vehicleType)) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle type must be BIKE or CYCLE.',
      });
    }

    const workingHours = Number(dailyWorkingHours);

    if (
      !Number.isFinite(workingHours) ||
      workingHours < 1 ||
      workingHours > 24
    ) {
      return res.status(400).json({
        success: false,
        message: 'Daily working hours must be between 1 and 24.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    const existingRiderApplication =
      await RiderApplication.findOne({
        email: normalizedEmail,
      });

    if (existingRiderApplication) {
      return res.status(409).json({
        success: false,
        message: 'A rider application with this email already exists.',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: 'RIDER',
      status: 'PENDING',
      phone: mobileNumber.trim(),
      city: city.trim(),
      area: area.trim(),
      address: completeAddress.trim(),
    });

    try {
      await RiderApplication.create({
        user: user._id,
        name: name.trim(),
        fatherName: fatherName.trim(),
        mobileNumber: mobileNumber.trim(),
        fatherMobileNumber: fatherMobileNumber.trim(),
        email: normalizedEmail,
        cnic: cnic.trim(),
        vehicleType,
        vehicleNumber: vehicleNumber.trim(),
        vehiclePhoto,
        drivingLicenseNumber: drivingLicenseNumber.trim(),
        city: city.trim(),
        area: area.trim(),
        completeAddress: completeAddress.trim(),
        emergencyContact: emergencyContact.trim(),
        dailyWorkingHours: workingHours,
        status: 'PENDING',
      });
    } catch (applicationError) {
      await User.findByIdAndDelete(user._id);
      throw applicationError;
    }

    const token = createToken(user._id.toString(), user.role);

    return res.status(201).json({
      success: true,
      message: 'Rider application submitted successfully. Your account is pending admin approval.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    console.error('Rider registration error:', error);

    return res.status(500).json({
      success: false,
      message: 'Something went wrong while submitting the rider application.',
    });
  }
};

const registerBusiness = async (req, res) => {
  try {
    const {
      ownerName,
      ownerMobileNumber,
      email,
      completeAddress,
      city,
      area,
      restaurantLocation,
      loginEmail,
      password,
      logo,
    } = req.body;

    if (
      !ownerName ||
      !ownerMobileNumber ||
      !email ||
      !completeAddress ||
      !city ||
      !area ||
      !restaurantLocation ||
      !loginEmail ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: 'All required business application fields are required.',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters.',
      });
    }

    if (
      restaurantLocation.type !== 'Point' ||
      !Array.isArray(restaurantLocation.coordinates) ||
      restaurantLocation.coordinates.length !== 2
    ) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant location must contain a Point type and two coordinates.',
      });
    }

    const latitude = Number(restaurantLocation.coordinates[1]);
    const longitude = Number(restaurantLocation.coordinates[0]);

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant coordinates are invalid.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedLoginEmail = loginEmail.trim().toLowerCase();
    const normalizedLogo =
      typeof logo === 'string' ? logo.trim() : '';

    // Log whether the frontend actually supplied the uploaded URL.
    console.log('Business registration logo received:', {
      received: Boolean(normalizedLogo),
      logo: normalizedLogo || '(empty)',
    });

    // Do not silently create applications without their required logo.
    if (!normalizedLogo) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant logo URL is missing. Please upload the restaurant logo again.',
      });
    }

    const existingUser = await User.findOne({
      $or: [
        { email: normalizedEmail },
        { email: normalizedLoginEmail },
      ],
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    const existingApplication = await BusinessApplication.findOne({
      loginEmail: normalizedLoginEmail,
    });

    if (existingApplication) {
      return res.status(409).json({
        success: false,
        message: 'A business application with this login email already exists.',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: ownerName.trim(),
      email: normalizedLoginEmail,
      password: hashedPassword,
      role: 'BUSINESS',
      status: 'PENDING',
      phone: ownerMobileNumber.trim(),
      city: city.trim(),
      area: area.trim(),
      address: completeAddress.trim(),
    });

    try {
      const application = await BusinessApplication.create({
        user: user._id,
        ownerName: ownerName.trim(),
        ownerMobileNumber: ownerMobileNumber.trim(),
        email: normalizedEmail,
        completeAddress: completeAddress.trim(),
        city: city.trim(),
        area: area.trim(),
        restaurantLocation: {
          type: 'Point',
          coordinates: [longitude, latitude],
        },
        loginEmail: normalizedLoginEmail,
        logo: normalizedLogo,
        status: 'PENDING',
      });

      console.log('Business application created:', {
        applicationId: application._id.toString(),
        logoSaved: Boolean(application.logo),
      });
    } catch (applicationError) {
      await User.findByIdAndDelete(user._id);
      throw applicationError;
    }

    const token = createToken(user._id.toString(), user.role);

    return res.status(201).json({
      success: true,
      message: 'Business application submitted successfully. Your account is pending admin approval.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    console.error('Business registration error:', error);

    return res.status(500).json({
      success: false,
      message: 'Something went wrong while submitting the business application.',
    });
  }
};

module.exports = {
  registerRider,
  registerBusiness,
};
