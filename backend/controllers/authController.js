const User = require('../models/User');
const { generateTokenPair, verifyRefreshToken } = require('../services/tokenService');
const { asyncHandler, AppError } = require('../utils/helpers');
const logger = require('../config/logger');

// POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    throw new AppError('Name, email, and password are required', 400);
  }

  if (password.length < 6) {
    throw new AppError('Password must be at least 6 characters', 400);
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('Email already registered', 409);
  }

  const user = await User.create({ name, email, password });
  const { accessToken, refreshToken } = generateTokenPair(user);

  // Store refresh token
  user.refreshTokens.push(refreshToken);
  await user.save();

  logger.info('User registered', { userId: user._id, email });

  res.status(201).json({
    message: 'Registration successful',
    user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar },
    accessToken,
    refreshToken,
  });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError('Email and password are required', 400);
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password', 401);
  }

  const { accessToken, refreshToken } = generateTokenPair(user);

  // Store refresh token (keep last 5)
  user.refreshTokens.push(refreshToken);
  if (user.refreshTokens.length > 5) {
    user.refreshTokens = user.refreshTokens.slice(-5);
  }
  await user.save();

  logger.info('User logged in', { userId: user._id });

  res.json({
    message: 'Login successful',
    user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar },
    accessToken,
    refreshToken,
  });
});

// POST /api/auth/refresh
const refreshAccessToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new AppError('Refresh token is required', 400);
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  const user = await User.findById(decoded.id);
  if (!user || !user.refreshTokens.includes(refreshToken)) {
    throw new AppError('Refresh token revoked', 401);
  }

  // Rotate: remove old, issue new pair
  user.refreshTokens = user.refreshTokens.filter((t) => t !== refreshToken);

  const tokens = generateTokenPair(user);
  user.refreshTokens.push(tokens.refreshToken);
  await user.save();

  res.json({
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  });
});

// POST /api/auth/logout
const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    try {
      const decoded = verifyRefreshToken(refreshToken);
      const user = await User.findById(decoded.id);
      if (user) {
        user.refreshTokens = user.refreshTokens.filter((t) => t !== refreshToken);
        await user.save();
      }
    } catch {
      // Token already invalid — no-op
    }
  }

  res.json({ message: 'Logged out successfully' });
});

// GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) throw new AppError('User not found', 404);

  res.json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      totalExecutions: user.totalExecutions,
      totalCodingTime: user.totalCodingTime,
      roomsJoined: user.roomsJoined,
      createdAt: user.createdAt,
    },
  });
});

module.exports = { register, login, refreshAccessToken, logout, getMe };
