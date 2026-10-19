const AuditLog = require('../models/AuditLog');
const { successResponse, errorResponse } = require('../utils/response');

const getAuditLogs = async (req, res) => {
  try {
    const { action, entityType, userId, startDate, endDate, limit = 100 } = req.query;
    const filter = {};

    if (action) filter.action = action;
    if (entityType) filter.entityType = entityType;
    if (userId) filter.userId = userId;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const logs = await AuditLog.find(filter)
      .populate('userId', 'fullName username role')
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    return successResponse(res, logs, 'Audit logs retrieved successfully');
  } catch (err) {
    return errorResponse(res, 'Failed to fetch audit logs', 500);
  }
};

module.exports = {
  getAuditLogs
};
