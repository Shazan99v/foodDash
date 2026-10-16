const mongoose = require('mongoose');
require('dotenv').config();

const Restaurant = require('./models/Restaurant');

const removeLocationIndex = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log('MongoDB connected.');

    const indexes = await Restaurant.collection.indexes();

    console.log('\nCurrent Restaurant indexes:');
    console.log(indexes);

    for (const index of indexes) {
      const key = index.key || {};

      if (key.location === '2dsphere') {
        console.log(`\nDropping old geospatial index: ${index.name}`);

        await Restaurant.collection.dropIndex(index.name);

        console.log('Old location geospatial index removed successfully.');
      }
    }

    console.log('\nDone.');
  } catch (error) {
    console.error('\nFailed to remove index:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected.');
  }
};

removeLocationIndex();