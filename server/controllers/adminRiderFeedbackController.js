const RiderFeedback = require('../models/RiderFeedback');

const getRiderFeedback = async (req, res) => {
  try {
    const { riderId } = req.params;

    const feedback = await RiderFeedback.find({
      rider: riderId,
    })
      .populate(
        'customer',
        'name email phone profilePhoto'
      )
      .populate(
        'rider',
        'name email phone status'
      )
      .populate(
        'order',
        '_id createdAt status totalAmount'
      )
      .sort({
        createdAt: -1,
      })
      .lean();

    const totalReviews = feedback.length;

    const ratingSum = feedback.reduce(
      (sum, item) => sum + item.rating,
      0
    );

    const averageRating =
      totalReviews > 0
        ? Number(
            (ratingSum / totalReviews).toFixed(2)
          )
        : 0;

    const ratingBreakdown = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    feedback.forEach((item) => {
      if (ratingBreakdown[item.rating] !== undefined) {
        ratingBreakdown[item.rating] += 1;
      }
    });

    const positiveReviews = feedback.filter(
      (item) => item.rating >= 4
    ).length;

    const negativeReviews = feedback.filter(
      (item) => item.rating <= 2
    ).length;

    return res.status(200).json({
      success: true,
      summary: {
        totalReviews,
        averageRating,
        positiveReviews,
        negativeReviews,
        ratingBreakdown,
      },
      feedback,
    });
  } catch (error) {
    console.error(
      'Get rider feedback error:',
      error
    );

    return res.status(500).json({
      success: false,
      message: 'Failed to load rider feedback.',
    });
  }
};

module.exports = {
  getRiderFeedback,
};