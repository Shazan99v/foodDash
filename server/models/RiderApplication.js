const mongoose = require('mongoose');

const riderApplicationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    fatherName: {
      type: String,
      required: true,
      trim: true,
    },

    mobileNumber: {
      type: String,
      required: true,
      trim: true,
    },

    fatherMobileNumber: {
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

    cnic: {
      type: String,
      required: true,
      trim: true,
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
      required: true,
    },

    drivingLicenseNumber: {
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

    completeAddress: {
      type: String,
      required: true,
      trim: true,
    },

    emergencyContact: {
      type: String,
      required: true,
      trim: true,
    },

    dailyWorkingHours: {
      type: Number,
      required: true,
      min: 1,
      max: 24,
    },

    status: {
      type: String,
      enum: [
        'PENDING',
        'APPROVED',
        'REJECTED',
      ],
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

module.exports = mongoose.model(
  'RiderApplication',
  riderApplicationSchema
);