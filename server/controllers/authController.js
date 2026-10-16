const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/User');

const createToken = (userId, role) => {
  return jwt.sign(
    {
      userId,
      role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '7d',
    }
  );
};

const formatUser = (user) => {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    phone: user.phone,
    secondaryPhone: user.secondaryPhone,
    phoneNumbers: user.phoneNumbers || [],
    savedAddresses: user.savedAddresses || [],
    address: user.address,
    city: user.city,
    area: user.area,
    location: user.location,
    profilePhoto: user.profilePhoto,
    rejectionReason: user.rejectionReason,
  };
};

const registerCustomer = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email and password are required.',
      });
    }

    if (typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters.',
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

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: 'CUSTOMER',
      status: 'ACTIVE',
    });

    const token = createToken(
      user._id.toString(),
      user.role
    );

    return res.status(201).json({
      success: true,
      message: 'Customer account created successfully.',
      token,
      user: formatUser(user),
    });
  } catch (error) {
    console.error('Customer registration error:', error);

    return res.status(500).json({
      success: false,
      message: 'Something went wrong while creating the account.',
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== 'string' ||
      !email.trim() ||
      typeof password !== 'string' ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    if (user.status === 'SUSPENDED') {
      return res.status(403).json({
        success: false,
        message: 'This account has been suspended.',
      });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = createToken(
      user._id.toString(),
      user.role
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: formatUser(user),
    });
  } catch (error) {
    console.error('Login error:', error);

    return res.status(500).json({
      success: false,
      message: 'Something went wrong while logging in.',
    });
  }
};

module.exports = {
  registerCustomer,
  loginUser,
};