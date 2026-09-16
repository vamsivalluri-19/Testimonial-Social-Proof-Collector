const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Space = require('../models/Space');
const AppError = require('../utils/appError');

/**
 * Protect routes - verifies JWT access token
 */
const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return next(new AppError('Authentication required. Please log in.', 401));
    }

    try {
      const decoded = jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET || 'proofly_access_token_secret_key_change_in_production_32bytes'
      );

      const user = await User.findById(decoded.userId);
      if (!user) {
        return next(new AppError('The user belonging to this token no longer exists.', 401));
      }

      req.user = user;
      next();
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(new AppError('Access token has expired. Please refresh your token.', 401));
      }
      return next(new AppError('Invalid authentication token.', 401));
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Authorize owner of a specific space
 * Checks if req.params.id or req.params.spaceId or req.body.space belongs to req.user._id
 */
const authorizeSpaceOwner = async (req, res, next) => {
  try {
    const spaceId = req.params.id || req.params.spaceId || req.body.spaceId || req.body.space;
    if (!spaceId) {
      return next(new AppError('Space ID parameter is required for authorization.', 400));
    }

    const space = await Space.findById(spaceId);
    if (!space) {
      return next(new AppError('Space not found.', 404));
    }

    if (space.owner.toString() !== req.user._id.toString()) {
      return next(new AppError('Unauthorized: You do not have permission to modify this space.', 403));
    }

    req.space = space;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  protect,
  authorizeSpaceOwner,
};
