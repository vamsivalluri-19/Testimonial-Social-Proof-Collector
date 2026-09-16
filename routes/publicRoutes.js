const express = require('express');
const router = express.Router();
const spaceController = require('../controllers/spaceController');
const testimonialController = require('../controllers/testimonialController');
const embedController = require('../controllers/embedController');
const upload = require('../middleware/uploadMiddleware');
const validate = require('../middleware/validateMiddleware');
const { submitLimiter } = require('../middleware/rateLimiter');
const { submitTestimonialSchema } = require('../validators/testimonialSchemas');
const { embedQuerySchema, wallQuerySchema } = require('../validators/embedSchemas');

// Get public space configuration
router.get('/spaces/:slug', spaceController.getPublicSpaceBySlug);

// Submit public testimonial (supports avatar file upload)
router.post(
  '/spaces/:slug/testimonials',
  submitLimiter,
  upload.single('avatar'),
  validate(submitTestimonialSchema),
  testimonialController.submitPublicTestimonial
);

// Get approved testimonials for public space
router.get('/spaces/:slug/testimonials', testimonialController.getPublicTestimonials);

// Wall of Love API
router.get('/spaces/:slug/wall', validate(wallQuerySchema, 'query'), embedController.getWallOfLove);

// Embed generator config API
router.get('/spaces/:slug/embed', validate(embedQuerySchema, 'query'), embedController.getEmbedConfig);

module.exports = router;
