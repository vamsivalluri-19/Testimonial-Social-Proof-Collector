const Space = require('../models/Space');
const Testimonial = require('../models/Testimonial');
const generateSlug = require('../utils/slugify');
const AppError = require('../utils/appError');

/**
 * Create a new space
 * POST /api/spaces
 */
const createSpace = async (req, res, next) => {
  try {
    const { name, logo, prompt, avatarSetting, ratingSetting, customQuestions, theme } = req.body;
    let { slug } = req.body;

    if (!slug) {
      slug = generateSlug(name);
    } else {
      slug = generateSlug(slug);
    }

    // Check if slug is unique
    let existingSpace = await Space.findOne({ slug });
    if (existingSpace) {
      // Append random suffix if slug collision occurs
      slug = `${slug}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const space = await Space.create({
      owner: req.user._id,
      name,
      slug,
      logo: logo || '',
      prompt: prompt || 'Would you mind sharing a quick review of your experience with us?',
      avatarSetting: avatarSetting || 'optional',
      ratingSetting: ratingSetting || 'required',
      customQuestions: customQuestions || [],
      theme: theme || {},
    });

    res.status(201).json({
      success: true,
      message: 'Space created successfully.',
      space,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all spaces for current owner
 * GET /api/spaces
 */
const getMySpaces = async (req, res, next) => {
  try {
    const spaces = await Space.find({ owner: req.user._id }).sort({ createdAt: -1 });

    // Enhance spaces with review counts
    const spacesWithStats = await Promise.all(
      spaces.map(async (space) => {
        const totalReviews = await Testimonial.countDocuments({ space: space._id });
        const pendingReviews = await Testimonial.countDocuments({ space: space._id, status: 'pending' });
        const approvedReviews = await Testimonial.countDocuments({ space: space._id, status: 'approved' });

        return {
          ...space.toObject(),
          stats: {
            totalReviews,
            pendingReviews,
            approvedReviews,
          },
        };
      })
    );

    res.status(200).json({
      success: true,
      count: spacesWithStats.length,
      spaces: spacesWithStats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get space by ID (Owner protected)
 * GET /api/spaces/:id
 */
const getSpaceById = async (req, res, next) => {
  try {
    const space = await Space.findOne({ _id: req.params.id, owner: req.user._id });

    if (!space) {
      return next(new AppError('Space not found or unauthorized access.', 404));
    }

    const totalReviews = await Testimonial.countDocuments({ space: space._id });
    const pendingReviews = await Testimonial.countDocuments({ space: space._id, status: 'pending' });

    res.status(200).json({
      success: true,
      space: {
        ...space.toObject(),
        stats: {
          totalReviews,
          pendingReviews,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update space by ID
 * PUT /api/spaces/:id
 */
const updateSpace = async (req, res, next) => {
  try {
    const space = await Space.findOne({ _id: req.params.id, owner: req.user._id });

    if (!space) {
      return next(new AppError('Space not found or unauthorized access.', 404));
    }

    const { name, slug, logo, prompt, avatarSetting, ratingSetting, customQuestions, theme } = req.body;

    if (name) space.name = name;
    if (logo !== undefined) space.logo = logo;
    if (prompt !== undefined) space.prompt = prompt;
    if (avatarSetting) space.avatarSetting = avatarSetting;
    if (ratingSetting) space.ratingSetting = ratingSetting;
    if (customQuestions) space.customQuestions = customQuestions;
    if (theme) space.theme = { ...space.theme, ...theme };

    if (slug && slug !== space.slug) {
      const cleanSlug = generateSlug(slug);
      const existingSlug = await Space.findOne({ slug: cleanSlug, _id: { $ne: space._id } });
      if (existingSlug) {
        return next(new AppError('This space slug is already in use.', 400));
      }
      space.slug = cleanSlug;
    }

    await space.save();

    res.status(200).json({
      success: true,
      message: 'Space updated successfully.',
      space,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete space by ID
 * DELETE /api/spaces/:id
 */
const deleteSpace = async (req, res, next) => {
  try {
    const space = await Space.findOne({ _id: req.params.id, owner: req.user._id });

    if (!space) {
      return next(new AppError('Space not found or unauthorized access.', 404));
    }

    // Delete associated testimonials
    await Testimonial.deleteMany({ space: space._id });
    await space.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Space and all associated testimonials deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get public space configuration by slug (Public API, no auth required)
 * GET /api/spaces/:slug/public  OR  GET /api/public/spaces/:slug
 */
const getPublicSpaceBySlug = async (req, res, next) => {
  try {
    const space = await Space.findOne({ slug: req.params.slug.toLowerCase() });

    if (!space) {
      return next(new AppError('Space not found.', 404));
    }

    res.status(200).json({
      success: true,
      space: {
        id: space._id,
        name: space.name,
        slug: space.slug,
        logo: space.logo,
        prompt: space.prompt,
        avatarSetting: space.avatarSetting,
        ratingSetting: space.ratingSetting,
        customQuestions: space.customQuestions,
        theme: space.theme,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSpace,
  getMySpaces,
  getSpaceById,
  updateSpace,
  deleteSpace,
  getPublicSpaceBySlug,
};
