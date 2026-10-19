const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/response');
const { logAudit } = require('../middleware/audit');

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_TIME_MS = 15 * 60 * 1000; // 15 minutes

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return errorResponse(res, 'Username and password are required', 400);
    }

    const user = await User.findOne({ username: username.toLowerCase() }).populate('locationId');
    if (!user) {
      return errorResponse(res, 'Invalid username or password', 401);
    }

    // Check account lockout
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesRemaining = Math.ceil((user.lockedUntil - new Date()) / 60000);
      return errorResponse(
        res,
        `Account is locked due to too many failed attempts. Try again in ${minutesRemaining} minute(s).`,
        423
      );
    }

    // Check if account is active
    if (user.status !== 'active') {
      return errorResponse(res, 'Your account has been deactivated. Please contact an administrator.', 403);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      user.failedLogins = (user.failedLogins || 0) + 1;
      if (user.failedLogins >= MAX_FAILED_ATTEMPTS) {
        user.lockedUntil = new Date(Date.now() + LOCK_TIME_MS);
      }
      await user.save();

      return errorResponse(res, 'Invalid username or password', 401);
    }

    // Reset failed login attempts on successful login
    user.failedLogins = 0;
    user.lockedUntil = null;
    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role, username: user.username },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    await logAudit(
      { user, ip: req.ip },
      'AUTH_LOGIN',
      'User',
      user._id,
      { username: user.username, role: user.role }
    );

    return successResponse(res, {
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        phone: user.phone,
        role: user.role,
        language: user.language,
        location: user.locationId
      }
    }, 'Login successful');
  } catch (err) {
    console.error('Login error:', err);
    return errorResponse(res, 'An error occurred during login', 500);
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('locationId').select('-passwordHash');
    return successResponse(res, user, 'User profile retrieved');
  } catch (err) {
    return errorResponse(res, 'Failed to fetch user profile', 500);
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return errorResponse(res, 'Current password and new password are required', 400);
    }

    if (newPassword.length < 6) {
      return errorResponse(res, 'New password must be at least 6 characters long', 400);
    }

    const user = await User.findById(req.user._id);
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return errorResponse(res, 'Current password is incorrect', 400);
    }

    user.passwordHash = await User.hashPassword(newPassword);
    await user.save();

    await logAudit(
      req,
      'AUTH_CHANGE_PASSWORD',
      'User',
      user._id,
      { username: user.username }
    );

    return successResponse(res, null, 'Password updated successfully');
  } catch (err) {
    return errorResponse(res, 'Failed to update password', 500);
  }
};

module.exports = {
  login,
  getMe,
  changePassword
};
