require('dotenv').config();

const connectDB = require('../config/db');
const RiderProfile = require('../models/RiderProfile');

const cleanupRiderProfile = async () => {
  try {
    await connectDB();

    const userId =
      '6ac52593a9800c9fbfaf4d31';

    const result =
      await RiderProfile.deleteOne({
        user: userId,
      });

    console.log(
      `Deleted RiderProfile documents: ${result.deletedCount}`
    );

    process.exit(0);
  } catch (error) {
    console.error(
      'Cleanup error:',
      error
    );

    process.exit(1);
  }
};

cleanupRiderProfile();