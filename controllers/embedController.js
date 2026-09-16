const Space = require('../models/Space');
const Testimonial = require('../models/Testimonial');
const AppError = require('../utils/appError');

/**
 * Wall of Love API (Public)
 * GET /api/public/spaces/:slug/wall
 */
const getWallOfLove = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { theme = 'light', featured, page = 1, limit = 20 } = req.query;

    const space = await Space.findOne({ slug: slug.toLowerCase() });
    if (!space) {
      return next(new AppError('Space not found.', 404));
    }

    const filter = {
      space: space._id,
      status: 'approved',
    };

    if (featured === 'true' || featured === true) {
      filter.featured = true;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Testimonial.countDocuments(filter);
    const testimonials = await Testimonial.find(filter)
      .sort({ featured: -1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .select('-email'); // CRITICAL: Do NOT expose private customer email addresses!

    res.status(200).json({
      success: true,
      space: {
        id: space._id,
        name: space.name,
        slug: space.slug,
        logo: space.logo,
        theme: {
          ...space.theme,
          overrideMode: theme,
        },
      },
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)) || 1,
        limit: Number(limit),
      },
      testimonials,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Embed Generator API (Public)
 * GET /api/public/spaces/:slug/embed
 */
const getEmbedConfig = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const {
      type = 'grid',
      theme = 'light',
      width = '100%',
      height = '600px',
      avatarVisibility = 'true',
      ratingVisibility = 'true',
    } = req.query;

    const space = await Space.findOne({ slug: slug.toLowerCase() });
    if (!space) {
      return next(new AppError('Space not found.', 404));
    }

    const showAvatar = avatarVisibility === 'true' || avatarVisibility === true;
    const showRating = ratingVisibility === 'true' || ratingVisibility === true;

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const iframeSrc = `${clientUrl}/embed/${space.slug}?type=${type}&theme=${theme}&avatar=${showAvatar}&rating=${showRating}`;
    const iframeCode = `<iframe src="${iframeSrc}" width="${width}" height="${height}" frameborder="0" scrolling="no" style="border:none; overflow:hidden;"></iframe>`;
    const scriptCode = `<script src="${clientUrl}/embed.js" data-space="${space.slug}" data-type="${type}" data-theme="${theme}" async></script>`;

    res.status(200).json({
      success: true,
      space: {
        id: space._id,
        name: space.name,
        slug: space.slug,
      },
      embedConfig: {
        type,
        theme,
        width,
        height,
        avatarVisibility: showAvatar,
        ratingVisibility: showRating,
      },
      snippets: {
        iframeSrc,
        iframeCode,
        scriptCode,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWallOfLove,
  getEmbedConfig,
};
