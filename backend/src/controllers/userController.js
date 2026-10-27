const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/response');
const { logAudit } = require('../middleware/audit');
const { validatePassword } = require('../utils/passwordValidator');

const getUsers = async (req, res) => {
  try {
    const { role, status, locationId } = req.query;
    const filter = {};

    if (role) filter.role = role;
    if (status) filter.status = status;
    if (locationId) filter.locationId = locationId;

    const users = await User.find(filter)
      .populate('locationId')
      .select('-passwordHash')
      .sort({ createdAt: -1 });

    return successResponse(res, users, 'Users retrieved successfully');
  } catch (err) {
    return errorResponse(res, 'Failed to fetch users', 500);
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('locationId')
      .select('-passwordHash');

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    return successResponse(res, user, 'User retrieved successfully');
  } catch (err) {
    return errorResponse(res, 'Failed to fetch user', 500);
  }
};

const createUser = async (req, res) => {
  try {
    const { fullName, username, email, password, phone, role, locationId, language } = req.body;

    if (!fullName || !username || !password || !role) {
      return errorResponse(res, 'Full name, username, password, and role are required', 400);
    }

    const cleanUsername = username.trim().toLowerCase();

    // Server-side strong password validation
    const validation = validatePassword(password, cleanUsername);
    if (!validation.isValid) {
      return errorResponse(res, validation.message, 400);
    }

    const existingUser = await User.findOne({ username: cleanUsername });
    if (existingUser) {
      return errorResponse(res, 'Username already exists', 409);
    }

    const passwordHash = await User.hashPassword(password);

    const newUser = await User.create({
      fullName,
      username: cleanUsername,
      email: email || '',
      passwordHash,
      phone: phone || '',
      role,
      locationId: locationId || null,
      language: language || 'en'
    });

    await logAudit(req, 'USER_CREATE', 'User', newUser._id, {
      username: newUser.username,
      role: newUser.role,
      locationId: newUser.locationId
    });

    const userObj = newUser.toObject();
    delete userObj.passwordHash;

    return successResponse(res, userObj, 'User created successfully', 201);
  } catch (err) {
    console.error('Error creating user:', err);
    return errorResponse(res, err.message || 'Failed to create user', 500);
  }
};

const updateUser = async (req, res) => {
  try {
    const { fullName, email, phone, role, locationId, language, password } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    if (fullName) user.fullName = fullName;
    if (email !== undefined) user.email = email;
    if (phone !== undefined) user.phone = phone;
    if (role) user.role = role;
    if (locationId !== undefined) user.locationId = locationId;
    if (language) user.language = language;

    if (password) {
      // Server-side strong password validation
      const validation = validatePassword(password, user.username);
      if (!validation.isValid) {
        return errorResponse(res, validation.message, 400);
      }
      user.passwordHash = await User.hashPassword(password);
    }

    await user.save();

    await logAudit(req, 'USER_UPDATE', 'User', user._id, {
      username: user.username,
      role: user.role
    });

    const userObj = user.toObject();
    delete userObj.passwordHash;

    return successResponse(res, userObj, 'User updated successfully');
  } catch (err) {
    return errorResponse(res, 'Failed to update user', 500);
  }
};

const resetPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword) {
      return errorResponse(res, 'New password is required', 400);
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    // Server-side strong password validation
    const validation = validatePassword(newPassword, user.username);
    if (!validation.isValid) {
      return errorResponse(res, validation.message, 400);
    }

    user.passwordHash = await User.hashPassword(newPassword);
    user.failedLogins = 0;
    user.lockedUntil = null;
    await user.save();

    await logAudit(req, 'USER_PASSWORD_RESET', 'User', user._id, {
      username: user.username,
      resetBy: req.user.username
    });

    return successResponse(res, null, `Password for user '${user.username}' was reset successfully`);
  } catch (err) {
    console.error('Error resetting password:', err);
    return errorResponse(res, 'Failed to reset password', 500);
  }
};

const updateUserStatus = async (req, res) => {
  try {
    const { status, unlock } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    if (status && ['active', 'inactive'].includes(status)) {
      user.status = status;
    }

    if (unlock) {
      user.failedLogins = 0;
      user.lockedUntil = null;
    }

    await user.save();

    await logAudit(req, 'USER_STATUS_CHANGE', 'User', user._id, {
      username: user.username,
      status: user.status,
      unlocked: !!unlock
    });

    const userObj = user.toObject();
    delete userObj.passwordHash;

    return successResponse(res, userObj, 'User status updated successfully');
  } catch (err) {
    return errorResponse(res, 'Failed to update user status', 500);
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  resetPassword,
  updateUserStatus
};
