const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuCategory',
      required: true,
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

    image: {
      type: String,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    discountedPrice: {
      type: Number,
      min: 0,
    },

    variations: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },

        options: [
          {
            name: {
              type: String,
              required: true,
              trim: true,
            },

            price: {
              type: Number,
              required: true,
              min: 0,
            },
          },
        ],
      },
    ],

    addons: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },

        price: {
          type: Number,
          required: true,
          min: 0,
        },

        isAvailable: {
          type: Boolean,
          default: true,
        },
      },
    ],

    preparationTime: {
      type: Number,
      min: 1,
      default: 20,
    },

    sortOrder: {
      type: Number,
      default: 0,
    },

    isAvailable: {
      type: Boolean,
      default: true,
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    totalOrders: {
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
  },
  {
    timestamps: true,
  }
);

menuItemSchema.index({
  restaurant: 1,
  category: 1,
  sortOrder: 1,
});

menuItemSchema.index({
  restaurant: 1,
  isAvailable: 1,
});

menuItemSchema.index({
  restaurant: 1,
  isFeatured: 1,
});

module.exports = mongoose.model(
  'MenuItem',
  menuItemSchema
);