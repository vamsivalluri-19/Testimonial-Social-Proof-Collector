const mongoose = require('mongoose');
const Space = require('../models/Space');
const Testimonial = require('../models/Testimonial');
const AppError = require('../utils/appError');

/**
 * Helper to check space ownership
 */
const checkSpaceOwnership = async (spaceId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(spaceId)) {
    throw new AppError('Invalid Space ID format.', 400);
  }
  const space = await Space.findById(spaceId);
  if (!space) {
    throw new AppError('Space not found.', 404);
  }
  if (space.owner.toString() !== userId.toString()) {
    throw new AppError('Unauthorized access to this space analytics.', 403);
  }
  return space;
};

/**
 * Get Space Summary Analytics
 * GET /api/analytics/:spaceId/summary
 */
const getSummaryAnalytics = async (req, res, next) => {
  try {
    const { spaceId } = req.params;
    await checkSpaceOwnership(spaceId, req.user._id);

    const spaceObjectId = new mongoose.Types.ObjectId(spaceId);

    const totalReviews = await Testimonial.countDocuments({ space: spaceObjectId });
    const pendingReviews = await Testimonial.countDocuments({ space: spaceObjectId, status: 'pending' });
    const approvedReviews = await Testimonial.countDocuments({ space: spaceObjectId, status: 'approved' });
    const archivedReviews = await Testimonial.countDocuments({ space: spaceObjectId, status: 'archived' });
    const featuredReviews = await Testimonial.countDocuments({ space: spaceObjectId, featured: true, status: 'approved' });
    const likedReviews = await Testimonial.countDocuments({ space: spaceObjectId, liked: true });

    // Calculate average rating for ONLY APPROVED testimonials
    const ratingAggregate = await Testimonial.aggregate([
      { $match: { space: spaceObjectId, status: 'approved' } },
      { $group: { _id: null, avgRating: { $avg: '$rating' } } },
    ]);

    const averageRating = ratingAggregate.length > 0 ? Number(ratingAggregate[0].avgRating.toFixed(2)) : 0;

    res.status(200).json({
      success: true,
      summary: {
        spaceId,
        averageRating,
        totalReviews,
        approvedReviews,
        pendingReviews,
        archivedReviews,
        featuredReviews,
        likedReviews,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Space Star Rating Distribution
 * GET /api/analytics/:spaceId/distribution
 */
const getDistributionAnalytics = async (req, res, next) => {
  try {
    const { spaceId } = req.params;
    await checkSpaceOwnership(spaceId, req.user._id);

    const spaceObjectId = new mongoose.Types.ObjectId(spaceId);

    // Distribution calculated on APPROVED testimonials as per requirement
    const distributionAggregate = await Testimonial.aggregate([
      { $match: { space: spaceObjectId, status: 'approved' } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
    ]);

    const distributionMap = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalApproved = 0;

    distributionAggregate.forEach((item) => {
      if (item._id >= 1 && item._id <= 5) {
        distributionMap[item._id] = item.count;
        totalApproved += item.count;
      }
    });

    const distributionFormatted = Object.keys(distributionMap).map((star) => {
      const count = distributionMap[star];
      const percentage = totalApproved > 0 ? Number(((count / totalApproved) * 100).toFixed(1)) : 0;
      return {
        stars: Number(star),
        count,
        percentage,
      };
    });

    res.status(200).json({
      success: true,
      totalApprovedReviews: totalApproved,
      distribution: distributionFormatted,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Space Review Timeseries / Growth Analytics
 * GET /api/analytics/:spaceId/timeseries
 */
const getTimeseriesAnalytics = async (req, res, next) => {
  try {
    const { spaceId } = req.params;
    await checkSpaceOwnership(spaceId, req.user._id);

    const spaceObjectId = new mongoose.Types.ObjectId(spaceId);

    const timeseriesAggregate = await Testimonial.aggregate([
      { $match: { space: spaceObjectId } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' },
          },
          date: { $first: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } } },
          totalCount: { $sum: 1 },
          approvedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] },
          },
          avgRating: { $avg: '$rating' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
    ]);

    let cumulativeTotal = 0;
    const timeseries = timeseriesAggregate.map((item) => {
      cumulativeTotal += item.totalCount;
      return {
        date: item.date,
        totalReviews: item.totalCount,
        approvedReviews: item.approvedCount,
        averageRating: Number(item.avgRating.toFixed(2)),
        cumulativeTotal,
      };
    });

    res.status(200).json({
      success: true,
      timeseries,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSummaryAnalytics,
  getDistributionAnalytics,
  getTimeseriesAnalytics,
};
