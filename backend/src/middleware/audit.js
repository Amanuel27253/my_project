const AuditLog = require('../models/AuditLog');

const logAudit = async (req, action, entityType, entityId, details = {}) => {
  try {
    const userId = req.user ? req.user._id : null;
    const ipAddress = req.ip || req.connection.remoteAddress || '';

    await AuditLog.create({
      userId,
      action,
      entityType,
      entityId,
      details,
      ipAddress
    });
  } catch (err) {
    console.error('Failed to write audit log:', err.message);
  }
};

module.exports = {
  logAudit
};
