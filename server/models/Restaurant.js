const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    businessApplication: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BusinessApplication',
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    logo: {
      type: String,
    },

    banner: {
      type: String,
    },

    images: [
      {
        type: String,
      },
    ],

    cuisineCategories: [
      {
        type: String,
        trim: true,
      },
    ],

    address: {
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

    location: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    secondaryPhone: {
      type: String,
      trim: true,
    },

    openingTime: {
      type: String,
      required: true,
      trim: true,
    },

    closingTime: {
      type: String,
      required: true,
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
      default: 30,
    },

    deliveryFee: {
      type: Number,
      min: 0,
      default: 0,
    },

    deliveryRules: {
      type: String,
      trim: true,
    },

    commissionRate: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    payoutDetails: {
      type: String,
      trim: true,
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

    totalOrders: {
      type: Number,
      min: 0,
      default: 0,
    },

    isOpen: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

restaurantSchema.index({
  city: 1,
  area: 1,
});

restaurantSchema.index({
  isActive: 1,
  isOpen: 1,
});

module.exports = mongoose.model(
  'Restaurant',
  restaurantSchema
);