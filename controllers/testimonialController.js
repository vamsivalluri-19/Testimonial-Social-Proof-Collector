const Space = require('../models/Space');
const Testimonial = require('../models/Testimonial');
const { uploadToCloudinary } = require('../config/cloudinary');
const AppError = require('../utils/appError');

/**
 * Public Testimonial Submission
 * POST /api/public/spaces/:slug/testimonials
 */
const submitPublicTestimonial = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const space = await Space.findOne({ slug: slug.toLowerCase() });

    if (!space) {
      return next(new AppError('Space not found.', 404));
    }

    const { clientName, email, companyRole, rating, reviewText, customAnswers } = req.body;

    let avatarUrl = req.body.avatarUrl || '';
    if (req.file) {
      avatarUrl = await uploadToCloudinary(req.file, 'proofly_avatars');
    }

    // Parse customAnswers if stringified JSON
    let parsedCustomAnswers = customAnswers;
    if (typeof customAnswers === 'string') {
      try {
        parsedCustomAnswers = JSON.parse(customAnswers);
      } catch (e) {
        parsedCustomAnswers = [];
      }
    }

    const testimonial = await Testimonial.create({
      space: space._id,
      clientName,
      email: email.toLowerCase(),
      companyRole: companyRole || '',
      rating: Number(rating),
      reviewText,
      avatarUrl,
      customAnswers: parsedCustomAnswers || [],
      status: 'pending', // Default new testimonials to pending
      featured: false,
      liked: false,
    });

    res.status(201).json({
      success: true,
      message: 'Thank you! Your testimonial has been submitted for moderation.',
      testimonial: {
        id: testimonial._id,
        clientName: testimonial.clientName,
        companyRole: testimonial.companyRole,
        rating: testimonial.rating,
        reviewText: testimonial.reviewText,
        avatarUrl: testimonial.avatarUrl,
        customAnswers: testimonial.customAnswers,
        status: testimonial.status,
        createdAt: testimonial.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Public Testimonials for a Space
 * GET /api/public/spaces/:slug/testimonials
 */
const getPublicTestimonials = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const space = await Space.findOne({ slug: slug.toLowerCase() });

    if (!space) {
      return next(new AppError('Space not found.', 404));
    }

    const testimonials = await Testimonial.find({
      space: space._id,
      status: 'approved',
    })
      .sort({ createdAt: -1 })
      .select('-email'); // NEVER expose customer email publicly!

    res.status(200).json({
      success: true,
      count: testimonials.length,
      testimonials,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Owner Moderation: List & Filter Testimonials across owned spaces
 * GET /api/testimonials
 */
const getModerationTestimonials = async (req, res, next) => {
  try {
    const { spaceId, status, rating, search, page = 1, limit = 10 } = req.query;

    // Get all spaces owned by the user
    const ownerSpaces = await Space.find({ owner: req.user._id }).select('_id');
    const ownerSpaceIds = ownerSpaces.map((s) => s._id);

    if (ownerSpaceIds.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        total: 0,
        page: Number(page),
        pages: 0,
        testimonials: [],
      });
    }

    // Build filter query
    const filter = {
      space: { $in: ownerSpaceIds },
    };

    if (spaceId) {
      // Ensure requested space belongs to owner
      if (!ownerSpaceIds.some((id) => id.toString() === spaceId.toString())) {
        return next(new AppError('Unauthorized access to specified space.', 403));
      }
      filter.space = spaceId;
    }

    if (status) {
      filter.status = status;
    }

    if (rating) {
      filter.rating = Number(rating);
    }

    if (search) {
      filter.$or = [
        { reviewText: { $regex: search, $options: 'i' } },
        { clientName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { companyRole: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Testimonial.countDocuments(filter);
    const testimonials = await Testimonial.find(filter)
      .populate('space', 'name slug logo')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      count: testimonials.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)) || 1,
      testimonials,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Moderation: Update Testimonial Status (approved, pending, archived)
 * PATCH /api/testimonials/:id/status
 */
const updateTestimonialStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const testimonial = await Testimonial.findById(id).populate('space');
    if (!testimonial) {
      return next(new AppError('Testimonial not found.', 404));
    }

    // Ownership check
    if (testimonial.space.owner.toString() !== req.user._id.toString()) {
      return next(new AppError('Unauthorized: You do not own this space.', 403));
    }

    testimonial.status = status;
    await testimonial.save();

    res.status(200).json({
      success: true,
      message: `Testimonial status updated to '${status}'.`,
      testimonial,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Moderation: Toggle/Update Featured Flag
 * PATCH /api/testimonials/:id/featured
 */
const updateTestimonialFeatured = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { featured } = req.body;

    const testimonial = await Testimonial.findById(id).populate('space');
    if (!testimonial) {
      return next(new AppError('Testimonial not found.', 404));
    }

    // Ownership check
    if (testimonial.space.owner.toString() !== req.user._id.toString()) {
      return next(new AppError('Unauthorized: You do not own this space.', 403));
    }

    testimonial.featured = typeof featured === 'boolean' ? featured : !testimonial.featured;
    await testimonial.save();

    res.status(200).json({
      success: true,
      message: `Testimonial featured state updated to ${testimonial.featured}.`,
      testimonial,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Moderation: Toggle/Update Liked Flag
 * PATCH /api/testimonials/:id/liked
 */
const updateTestimonialLiked = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { liked } = req.body;

    const testimonial = await Testimonial.findById(id).populate('space');
    if (!testimonial) {
      return next(new AppError('Testimonial not found.', 404));
    }

    // Ownership check
    if (testimonial.space.owner.toString() !== req.user._id.toString()) {
      return next(new AppError('Unauthorized: You do not own this space.', 403));
    }

    testimonial.liked = typeof liked === 'boolean' ? liked : !testimonial.liked;
    await testimonial.save();

    res.status(200).json({
      success: true,
      message: `Testimonial liked state updated to ${testimonial.liked}.`,
      testimonial,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Moderation: Delete Testimonial
 * DELETE /api/testimonials/:id
 */
const deleteTestimonial = async (req, res, next) => {
  try {
    const { id } = req.params;

    const testimonial = await Testimonial.findById(id).populate('space');
    if (!testimonial) {
      return next(new AppError('Testimonial not found.', 404));
    }

    // Ownership check
    if (testimonial.space.owner.toString() !== req.user._id.toString()) {
      return next(new AppError('Unauthorized: You do not own this space.', 403));
    }

    await testimonial.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Testimonial deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitPublicTestimonial,
  getPublicTestimonials,
  getModerationTestimonials,
  updateTestimonialStatus,
  updateTestimonialFeatured,
  updateTestimonialLiked,
  deleteTestimonial,
};
