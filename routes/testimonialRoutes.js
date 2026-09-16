const express = require('express');
const router = express.Router();
const testimonialController = require('../controllers/testimonialController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');
const {
  updateStatusSchema,
  updateFeaturedSchema,
  updateLikedSchema,
} = require('../validators/testimonialSchemas');

// All moderation routes are protected
router.use(protect);

router.get('/', testimonialController.getModerationTestimonials);
router.patch('/:id/status', validate(updateStatusSchema), testimonialController.updateTestimonialStatus);
router.patch('/:id/featured', validate(updateFeaturedSchema), testimonialController.updateTestimonialFeatured);
router.patch('/:id/liked', validate(updateLikedSchema), testimonialController.updateTestimonialLiked);
router.delete('/:id', testimonialController.deleteTestimonial);

module.exports = router;
