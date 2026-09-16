const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const RefreshToken = require('../models/RefreshToken');
const User = require('../models/User');
const AppError = require('../utils/appError');

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

/**
 * Generate JWT access token (15 mins)
 */
const generateAccessToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.ACCESS_TOKEN_SECRET || 'proofly_access_token_secret_key_change_in_production_32bytes',
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
};

/**
 * Generate random cryptographically strong refresh token string
 */
const generateRefreshToken = () => {
  return crypto.randomBytes(40).toString('hex');
};

/**
 * Hash raw token string using SHA-256
 */
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Save hashed refresh token to database
 */
const createAndStoreRefreshToken = async (userId) => {
  const rawRefreshToken = generateRefreshToken();
  const tokenHash = hashToken(rawRefreshToken);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  await RefreshToken.create({
    userId,
    tokenHash,
    expiresAt,
  });

  return { rawRefreshToken, expiresAt };
};

/**
 * Rotate refresh token with reuse detection
 */
const rotateRefreshToken = async (rawRefreshToken) => {
  if (!rawRefreshToken) {
    throw new AppError('Refresh token is required.', 401);
  }

  const tokenHash = hashToken(rawRefreshToken);
  const existingToken = await RefreshToken.findOne({ tokenHash });

  // REUSE DETECTION: If token not found or already revoked
  if (!existingToken || existingToken.isRevoked) {
    if (existingToken && existingToken.isRevoked) {
      // Token reuse detected! Malicious actor attempting to reuse compromised token.
      // Revoke ALL refresh tokens belonging to this user for security.
      await RefreshToken.updateMany({ userId: existingToken.userId }, { isRevoked: true });
      console.warn(`[Security Alert] Refresh token reuse detected for User ${existingToken.userId}! All user sessions revoked.`);
    }
    throw new AppError('Invalid or revoked refresh token. Please log in again.', 401);
  }

  // Expiration check
  if (new Date() > existingToken.expiresAt) {
    existingToken.isRevoked = true;
    await existingToken.save();
    throw new AppError('Refresh token has expired. Please log in again.', 401);
  }

  const user = await User.findById(existingToken.userId);
  if (!user) {
    throw new AppError('User belonging to token no longer exists.', 401);
  }

  // Issue new tokens
  const newAccessToken = generateAccessToken(user._id);
  const { rawRefreshToken: newRawRefreshToken, expiresAt: newExpiresAt } = await createAndStoreRefreshToken(user._id);

  // Revoke old token and store replacement reference
  existingToken.isRevoked = true;
  existingToken.replacedByToken = hashToken(newRawRefreshToken);
  await existingToken.save();

  return {
    accessToken: newAccessToken,
    refreshToken: newRawRefreshToken,
    refreshTokenExpiresAt: newExpiresAt,
    user,
  };
};

/**
 * Revoke specific refresh token
 */
const revokeToken = async (rawRefreshToken) => {
  if (!rawRefreshToken) return;
  const tokenHash = hashToken(rawRefreshToken);
  await RefreshToken.findOneAndUpdate({ tokenHash }, { isRevoked: true });
};

/**
 * Set httpOnly Cookie helper
 */
const sendRefreshTokenCookie = (res, refreshToken) => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
  };
  res.cookie('refreshToken', refreshToken, cookieOptions);
};

module.exports = {
  generateAccessToken,
  createAndStoreRefreshToken,
  rotateRefreshToken,
  revokeToken,
  sendRefreshTokenCookie,
  hashToken,
};
