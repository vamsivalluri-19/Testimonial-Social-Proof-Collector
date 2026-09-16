const crypto = require('crypto');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const authService = require('../services/authService');
const AppError = require('../utils/appError');

/**
 * Signup owner account
 * POST /api/auth/signup
 */
const signup = async (req, res, next) => {
  try {
    const { name, email, username, password } = req.body;

    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return next(new AppError('An account with this email address already exists.', 400));
    }

    const existingUsername = await User.findOne({ username: username.toLowerCase() });
    if (existingUsername) {
      return next(new AppError('This username is already taken.', 400));
    }

    const passwordHash = await User.hashPassword(password);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const user = await User.create({
      name,
      email,
      username,
      passwordHash,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires,
    });

    const accessToken = authService.generateAccessToken(user._id);
    const { rawRefreshToken } = await authService.createAndStoreRefreshToken(user._id);

    authService.sendRefreshTokenCookie(res, rawRefreshToken);

    res.status(201).json({
      success: true,
      message: 'Account created successfully. Verification email simulated.',
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
      },
      simulatedEmailVerificationToken: verificationToken,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login owner account
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    if (!user) {
      return next(new AppError('Invalid email or password.', 401));
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return next(new AppError('Invalid email or password.', 401));
    }

    const accessToken = authService.generateAccessToken(user._id);
    const { rawRefreshToken } = await authService.createAndStoreRefreshToken(user._id);

    authService.sendRefreshTokenCookie(res, rawRefreshToken);

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh Access Token
 * POST /api/auth/refresh-token
 */
const refreshToken = async (req, res, next) => {
  try {
    const rawRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!rawRefreshToken) {
      return next(new AppError('Refresh token missing from cookie or request body.', 401));
    }

    const { accessToken, refreshToken: newRefreshToken, user } = await authService.rotateRefreshToken(rawRefreshToken);

    authService.sendRefreshTokenCookie(res, newRefreshToken);

    res.status(200).json({
      success: true,
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify Email simulation
 * POST /api/auth/verify-email
 */
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) {
      return next(new AppError('Invalid or expired email verification token.', 400));
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email address verified successfully.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Forgot Password simulation
 * POST /api/auth/forgot-password
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Return success even if email doesn't exist for security timing attacks prevention
      return res.status(200).json({
        success: true,
        message: 'If that email exists in our system, a password reset link has been generated.',
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.passwordResetToken = hashedResetToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset link simulated successfully.',
      simulatedResetToken: resetToken,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset Password
 * POST /api/auth/reset-password
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    const hashedResetToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedResetToken,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      return next(new AppError('Invalid or expired password reset token.', 400));
    }

    user.passwordHash = await User.hashPassword(newPassword);
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();

    // Revoke all existing refresh tokens for security
    await RefreshToken.updateMany({ userId: user._id }, { isRevoked: true });

    res.status(200).json({
      success: true,
      message: 'Password reset successful. Please log in with your new password.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout
 * POST /api/auth/logout
 */
const logout = async (req, res, next) => {
  try {
    const rawRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (rawRefreshToken) {
      await authService.revokeToken(rawRefreshToken);
    }

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Me (Current logged-in owner profile)
 * GET /api/auth/me
 */
const getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        username: req.user.username,
        isEmailVerified: req.user.isEmailVerified,
        createdAt: req.user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  signup,
  login,
  refreshToken,
  verifyEmail,
  forgotPassword,
  resetPassword,
  logout,
  getMe,
};
