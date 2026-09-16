const express = require('express');
const router = express.Router();
const spaceController = require('../controllers/spaceController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');
const { createSpaceSchema, updateSpaceSchema } = require('../validators/spaceSchemas');

// Public route to get space details by slug (unauthenticated)
router.get('/:slug/public', spaceController.getPublicSpaceBySlug);

// All owner routes below are protected
router.use(protect);

router.route('/')
  .post(validate(createSpaceSchema), spaceController.createSpace)
  .get(spaceController.getMySpaces);

router.route('/:id')
  .get(spaceController.getSpaceById)
  .put(validate(updateSpaceSchema), spaceController.updateSpace)
  .delete(spaceController.deleteSpace);

module.exports = router;
