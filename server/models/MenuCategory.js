const mongoose = require('mongoose');

const menuCategorySchema = new mongoose.Schema(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
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

    sortOrder: {
      type: Number,
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

menuCategorySchema.index({
  restaurant: 1,
  sortOrder: 1,
});

menuCategorySchema.index({
  restaurant: 1,
  isActive: 1,
});

module.exports = mongoose.model(
  'MenuCategory',
  menuCategorySchema
);