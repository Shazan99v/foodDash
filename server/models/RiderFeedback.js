const mongoose = require('mongoose');

const riderFeedbackSchema = new mongoose.Schema(
  {
    rider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    feedback: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    behaviorTags: [
      {
        type: String,
        enum: [
          'POLITE',
          'PROFESSIONAL',
          'ON_TIME',
          'HELPFUL',
          'RESPECTFUL',
          'RUDE',
          'LATE',
          'UNPROFESSIONAL',
          'CARELESS',
          'OTHER',
        ],
      },
    ],

    adminNote: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    reviewedByAdmin: {
      type: Boolean,
      default: false,
    },

    reviewedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

riderFeedbackSchema.index({
  rider: 1,
  createdAt: -1,
});

riderFeedbackSchema.index({
  rider: 1,
  rating: 1,
});

module.exports = mongoose.model(
  'RiderFeedback',
  riderFeedbackSchema
);