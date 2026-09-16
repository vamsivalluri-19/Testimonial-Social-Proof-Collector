const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

// All analytics routes are protected
router.use(protect);

router.get('/:spaceId/summary', analyticsController.getSummaryAnalytics);
router.get('/:spaceId/distribution', analyticsController.getDistributionAnalytics);
router.get('/:spaceId/timeseries', analyticsController.getTimeseriesAnalytics);

module.exports = router;
