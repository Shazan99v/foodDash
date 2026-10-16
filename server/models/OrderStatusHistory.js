const mongoose = require('mongoose');

const orderStatusHistorySchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },

    status: {
      type: String,
      enum: [
        'PLACED',
        'RECEIVED',
        'PREPARING',
        'READY',
        'ON_ROUTE',
        'DELIVERED',
        'CANCELLED',
      ],
      required: true,
    },

    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    note: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

orderStatusHistorySchema.index({
  order: 1,
  createdAt: 1,
});

module.exports = mongoose.model(
  'OrderStatusHistory',
  orderStatusHistorySchema
);