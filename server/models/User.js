const mongoose = require('mongoose');

// =========================
// Saved Phone Number Schema
// =========================

const phoneNumberSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      trim: true,
      default: 'Mobile',
      maxlength: 30,
    },

    number: {
      type: String,
      required: true,
      trim: true,
      maxlength: 30,
    },

    isPrimary: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// =========================
// Saved Delivery Address Schema
// =========================

const savedAddressSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true,
      maxlength: 40,
    },

    recipientName: {
      type: String,
      trim: true,
      maxlength: 100,
      default: '',
    },

    phone: {
      type: String,
      trim: true,
      maxlength: 30,
      default: '',
    },

    alternatePhone: {
      type: String,
      trim: true,
      maxlength: 30,
      default: '',
    },

    address: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },

    city: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    area: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    landmark: {
      type: String,
      trim: true,
      maxlength: 200,
      default: '',
    },

    location: {
      type: {
        type: String,
        enum: ['Point'],
      },

      coordinates: {
        type: [Number],
        validate: {
          validator: function (coordinates) {
            if (!coordinates || coordinates.length === 0) {
              return true;
            }

            return (
              coordinates.length === 2 &&
              coordinates.every(
                (coordinate) =>
                  typeof coordinate === 'number' &&
                  Number.isFinite(coordinate)
              ) &&
              coordinates[0] >= -180 &&
              coordinates[0] <= 180 &&
              coordinates[1] >= -90 &&
              coordinates[1] <= 90
            );
          },
          message: 'Invalid address coordinates.',
        },
      },
    },

    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// =========================
// User Schema
// =========================

const userSchema = new mongoose.Schema(
  {
    // Basic Account Information

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },

    // Account Role

    role: {
      type: String,
      enum: [
        'CUSTOMER',
        'RIDER',
        'BUSINESS',
        'ADMIN',
      ],
      required: true,
    },

    // Account Status

    status: {
      type: String,
      enum: [
        'ACTIVE',
        'PENDING',
        'REJECTED',
        'SUSPENDED',
      ],
      default: 'PENDING',
    },

    // Existing Contact Fields
    // Kept for compatibility with current features.

    phone: {
      type: String,
      trim: true,
    },

    secondaryPhone: {
      type: String,
      trim: true,
    },

    address: {
      type: String,
      trim: true,
    },

    city: {
      type: String,
      trim: true,
    },

    area: {
      type: String,
      trim: true,
    },

    // Multiple Saved Phone Numbers

    phoneNumbers: {
      type: [phoneNumberSchema],
      default: [],
    },

    // Multiple Saved Delivery Addresses

    savedAddresses: {
      type: [savedAddressSchema],
      default: [],
    },

    // Existing Location

    location: {
      type: {
        type: String,
        enum: ['Point'],
      },

      coordinates: {
        type: [Number],
      },
    },

    // Profile

    profilePhoto: {
      type: String,
    },

    // Approval Information

    rejectionReason: {
      type: String,
      trim: true,
    },

    approvedAt: {
      type: Date,
    },

    rejectedAt: {
      type: Date,
    },

    // Account Timestamps

    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index({
  location: '2dsphere',
});

module.exports = mongoose.model('User', userSchema);