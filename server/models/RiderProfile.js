const mongoose = require('mongoose');

const riderProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },

    vehicleType: {
      type: String,
      enum: [
        'BIKE',
        'CYCLE',
      ],
      required: true,
    },

    vehicleNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    vehiclePhoto: {
      type: String,
    },

    drivingLicenseNumber: {
      type: String,
      trim: true,
    },

    city: {
      type: String,
      required: true,
      trim: true,
    },

    area: {
      type: String,
      required: true,
      trim: true,
    },

    currentLocation: {
      type: {
        type: String,
        enum: ['Point'],
        required: false,
      },

      coordinates: {
        type: [Number],
        required: false,
        validate: {
          validator: function (coordinates) {
            if (
              coordinates === undefined ||
              coordinates === null
            ) {
              return true;
            }

            return (
              Array.isArray(coordinates) &&
              coordinates.length === 2 &&
              coordinates.every(
                (coordinate) =>
                  typeof coordinate === 'number' &&
                  Number.isFinite(coordinate)
              )
            );
          },

          message:
            'Current location coordinates must contain longitude and latitude.',
        },
      },
    },

    isAvailable: {
      type: Boolean,
      default: false,
    },

    isOnline: {
      type: Boolean,
      default: false,
    },

    totalDeliveries: {
      type: Number,
      min: 0,
      default: 0,
    },

    completedDeliveries: {
      type: Number,
      min: 0,
      default: 0,
    },

    cancelledDeliveries: {
      type: Number,
      min: 0,
      default: 0,
    },

    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },

    totalRatings: {
      type: Number,
      min: 0,
      default: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

riderProfileSchema.index({
  currentLocation: '2dsphere',
});

riderProfileSchema.index({
  city: 1,
  area: 1,
});

riderProfileSchema.index({
  isOnline: 1,
  isAvailable: 1,
});

module.exports = mongoose.model(
  'RiderProfile',
  riderProfileSchema
);