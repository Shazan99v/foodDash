require('dotenv').config();

const bcrypt = require('bcryptjs');

const connectDB = require('../config/db');
const User = require('../models/User');

const seedAdmin = async () => {
  try {
    await connectDB();

    const {
      ADMIN_NAME,
      ADMIN_EMAIL,
      ADMIN_PASSWORD,
    } = process.env;

    if (
      !ADMIN_NAME ||
      !ADMIN_EMAIL ||
      !ADMIN_PASSWORD
    ) {
      throw new Error(
        'ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env'
      );
    }

    if (ADMIN_PASSWORD.length < 8) {
      throw new Error(
        'ADMIN_PASSWORD must be at least 8 characters.'
      );
    }

    const normalizedEmail = ADMIN_EMAIL
      .trim()
      .toLowerCase();

    const existingAdmin = await User.findOne({
      email: normalizedEmail,
    });

    const hashedPassword = await bcrypt.hash(
      ADMIN_PASSWORD,
      12
    );

    if (existingAdmin) {
      if (existingAdmin.role !== 'ADMIN') {
        throw new Error(
          'An account with this email already exists and is not an admin account.'
        );
      }

      existingAdmin.name = ADMIN_NAME.trim();
      existingAdmin.password = hashedPassword;
      existingAdmin.status = 'ACTIVE';

      await existingAdmin.save();

      console.log(
        `Admin account password reset successfully: ${existingAdmin.email}`
      );

      process.exit(0);
    }

    const admin = await User.create({
      name: ADMIN_NAME.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
    });

    console.log(
      `Admin account created successfully: ${admin.email}`
    );

    process.exit(0);
  } catch (error) {
    console.error(
      'Admin seed error:',
      error.message
    );

    process.exit(1);
  }
};

seedAdmin();