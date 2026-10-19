const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { errorResponse } = require('../utils/response');
const { getAccessibleLocationIds } = require('../utils/locationScope');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'Authentication token missing or invalid format', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');

    const user = await User.findById(decoded.id).populate('locationId');
    if (!user) {
      return errorResponse(res, 'User no longer exists', 401);
    }

    if (user.status !== 'active') {
      return errorResponse(res, 'Account is deactivated. Please contact an administrator.', 403);
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return errorResponse(res, 'Token has expired. Please log in again.', 401);
    }
    return errorResponse(res, 'Invalid authentication token', 401);
  }
};

const requireRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Authentication required', 401);
    }

    if (!roles.includes(req.user.role)) {
      return errorResponse(
        res,
        `Access denied. Required role(s): ${roles.join(', ')}. Current role: ${req.user.role}`,
        403
      );
    }

    next();
  };
};

const requireLocationAccess = (locationParamName = 'locationId') => {
  return async (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Authentication required', 401);
    }

    if (req.user.role === 'admin') {
      return next();
    }

    const targetLocationId = req.params[locationParamName] || req.body[locationParamName] || req.query[locationParamName];
    if (!targetLocationId) {
      return next();
    }

    const accessible = await getAccessibleLocationIds(req.user);
    if (!accessible) {
      return next();
    }

    const isAuthorized = accessible.some(id => id.toString() === targetLocationId.toString());
    if (!isAuthorized) {
      return errorResponse(res, 'Access denied for this office/location', 403);
    }

    next();
  };
};

module.exports = {
  authenticate,
  requireRoles,
  requireLocationAccess
};
