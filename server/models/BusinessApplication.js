
const mongoose = require('mongoose');

const businessApplicationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },

    ownerName: {
      type: String,
      required: true,
      trim: true,
    },

    ownerMobileNumber: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    completeAddress: {
      type: String,
      required: true,
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

    restaurantLocation: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },

    loginEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    restaurantName: {
      type: String,
      trim: true,
    },

    cuisineCategory: {
      type: String,
      trim: true,
    },

    // Restaurant pictures
    logo: {
      type: String,
      trim: true,
      default: '',
    },

    banner: {
      type: String,
      trim: true,
      default: '',
    },

    images: {
      type: [String],
      default: [],
    },

    openingTime: {
      type: String,
      trim: true,
    },

    closingTime: {
      type: String,
      trim: true,
    },

    deliveryAreas: [
      {
        type: String,
        trim: true,
      },
    ],

    averagePreparationTime: {
      type: Number,
      min: 1,
    },

    deliveryFee: {
      type: Number,
      min: 0,
    },

    deliveryRules: {
      type: String,
      trim: true,
    },

    bankAccountDetails: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
    },

    rejectionReason: {
      type: String,
      trim: true,
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    reviewedAt: {
      type: Date,
    },

    approvedAt: {
      type: Date,
    },

    rejectedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

businessApplicationSchema.index({
  restaurantLocation: '2dsphere',
});

module.exports = mongoose.model(
  'BusinessApplication',
  businessApplicationSchema
);
