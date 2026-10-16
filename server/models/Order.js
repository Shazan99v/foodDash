const mongoose = require('mongoose');
const crypto = require('crypto');

const generateOrderNumber = () => {
  return (
    `ORD-${Date.now()}-` +
    crypto.randomBytes(6).toString('hex').toUpperCase()
  );
};

const orderItemSchema = new mongoose.Schema(
  {
    menuItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      default: generateOrderNumber,
    },

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },

    business: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    rider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: function (items) {
          return Array.isArray(items) && items.length > 0;
        },
        message: 'Order must contain at least one item.',
      },
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    deliveryFee: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    paymentMethod: {
      type: String,
      enum: [
        'COD',
        'JAZZCASH',
        'EASYPAISA',
        'CARD',
      ],
      required: true,
    },

    paymentStatus: {
      type: String,
      enum: [
        'PENDING',
        'PAID',
        'FAILED',
        'REFUNDED',
      ],
      default: 'PENDING',
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
      default: 'PLACED',
    },

    customerName: {
      type: String,
      required: true,
      trim: true,
    },

    customerPhone: {
      type: String,
      required: true,
      trim: true,
    },

    alternatePhone: {
      type: String,
      trim: true,
      default: '',
    },

    deliveryAddress: {
      type: String,
      required: true,
      trim: true,
    },

    deliveryCity: {
      type: String,
      required: true,
      trim: true,
    },

    deliveryArea: {
      type: String,
      required: true,
      trim: true,
    },

    customerLocation: {
      type: {
        type: String,
        enum: ['Point'],
      },
      coordinates: {
        type: [Number],
      },
    },

    customerNote: {
      type: String,
      trim: true,
      default: '',
    },

    riderAcceptedAt: {
      type: Date,
      default: null,
    },

    pickedUpAt: {
      type: Date,
      default: null,
    },

    deliveredAt: {
      type: Date,
      default: null,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    cancellationReason: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.index({
  customer: 1,
  createdAt: -1,
});

orderSchema.index({
  business: 1,
  status: 1,
});

orderSchema.index({
  rider: 1,
  status: 1,
});

orderSchema.index({
  restaurant: 1,
  status: 1,
});

orderSchema.index({
  customerLocation: '2dsphere',
});

module.exports = mongoose.model(
  'Order',
  orderSchema
);
