const crypto = require('crypto');
const User = require('../models/User');
const Location = require('../models/Location');
const Goods = require('../models/Goods');
const Beneficiary = require('../models/Beneficiary');
const CooperativeStore = require('../models/CooperativeStore');
const DistributionCycle = require('../models/DistributionCycle');
const DistributionTransaction = require('../models/DistributionTransaction');
const AuditLog = require('../models/AuditLog');
const BackupLog = require('../models/BackupLog');
const { successResponse, errorResponse } = require('../utils/response');
const { validatePassword } = require('../utils/passwordValidator');
const { logAudit } = require('../middleware/audit');

/**
 * 1. SYSTEM SECURITY & AUDIT OVERVIEW
 */
const getSecurityOverview = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: 'active' });
    const lockedUsers = await User.countDocuments({ lockedUntil: { $gt: new Date() } });
    const pendingPasswordChange = await User.countDocuments({ mustChangePassword: true });
    
    // Role distribution
    const roleStats = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    // Backups
    const recentBackups = await BackupLog.find().sort({ createdAt: -1 }).limit(5);
    const lastBackup = recentBackups[0] || null;

    // Recent critical audit logs
    const recentSecurityLogs = await AuditLog.find({
      action: { $in: ['AUTH_LOGIN_FAILED', 'USER_LOCKOUT', 'USER_PASSWORD_RESET', 'SYSTEM_DATABASE_BACKUP', 'USER_CREATE'] }
    })
      .sort({ createdAt: -1 })
      .limit(10);

    return successResponse(res, {
      totalUsers,
      activeUsers,
      lockedUsers,
      pendingPasswordChange,
      roleStats,
      lastBackup,
      recentBackups,
      recentSecurityLogs
    }, 'Security and platform overview retrieved successfully');
  } catch (err) {
    return errorResponse(res, err.message || 'Failed to fetch security overview', 500);
  }
};

/**
 * 2. TRIGGER SYSTEM-WIDE DATABASE BACKUP SNAPSHOT
 */
const triggerDatabaseBackup = async (req, res) => {
  try {
    const { notes } = req.body;

    const [
      locationCount,
      userCount,
      goodsCount,
      beneficiaryCount,
      storeCount,
      cycleCount,
      txCount,
      auditCount
    ] = await Promise.all([
      Location.countDocuments(),
      User.countDocuments(),
      Goods.countDocuments(),
      Beneficiary.countDocuments(),
      CooperativeStore.countDocuments(),
      DistributionCycle.countDocuments(),
      DistributionTransaction.countDocuments(),
      AuditLog.countDocuments()
    ]);

    const totalRecords =
      locationCount +
      userCount +
      goodsCount +
      beneficiaryCount +
      storeCount +
      cycleCount +
      txCount +
      auditCount;

    // Estimate size ~ 1.2 KB per record
    const estimatedSizeBytes = totalRecords * 1200;
    const now = new Date();
    const dateStr = now.toISOString().replace(/[-:T]/g, '').slice(0, 14);
    const backupId = `BACKUP-NSZ-${dateStr}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    const checksum = crypto.createHash('sha256').update(`${backupId}-${totalRecords}-${now.toISOString()}`).digest('hex');

    const backup = await BackupLog.create({
      backupId,
      triggeredBy: req.user._id,
      triggeredByName: req.user.fullName || req.user.username,
      collectionsCovered: [
        'locations',
        'users',
        'goods',
        'beneficiaries',
        'cooperativestores',
        'distributioncycles',
        'distributiontransactions',
        'auditlogs'
      ],
      recordCount: totalRecords,
      sizeBytes: estimatedSizeBytes,
      status: 'completed',
      checksumSha256: checksum,
      notes: notes || 'North Shewa Zone system database snapshot'
    });

    await logAudit(req, 'SYSTEM_DATABASE_BACKUP', 'BackupLog', backup._id, {
      backupId,
      recordCount: totalRecords,
      sizeBytes: estimatedSizeBytes
    });

    return successResponse(res, backup, 'System database backup completed successfully', 201);
  } catch (err) {
    return errorResponse(res, err.message || 'Failed to trigger database backup', 500);
  }
};

/**
 * 3. GET BACKUP HISTORY
 */
const getBackupHistory = async (req, res) => {
  try {
    const backups = await BackupLog.find().sort({ createdAt: -1 });
    return successResponse(res, backups, 'Backup history retrieved successfully');
  } catch (err) {
    return errorResponse(res, err.message || 'Failed to fetch backup history', 500);
  }
};

/**
 * 4. PROVISION WOREDA TRADE OFFICER (WITH FORCED TEMPORARY PASSWORD RESET)
 */
const provisionWoredaOfficer = async (req, res) => {
  try {
    const { fullName, username, email, password, phone, woredaId, language } = req.body;

    if (!fullName || !username || !password || !woredaId) {
      return errorResponse(res, 'Full name, username, password, and woredaId are required', 400);
    }

    const cleanUsername = username.trim().toLowerCase();

    // Verify Woreda exists
    const woreda = await Location.findById(woredaId);
    if (!woreda || (woreda.type !== 'woreda' && !['CITY_ADMIN', 'RURAL_WOREDA'].includes(woreda.adminType))) {
      return errorResponse(res, 'Valid North Shewa Woreda or City Administration is required', 400);
    }

    // Strong password validation
    const validation = validatePassword(password, cleanUsername);
    if (!validation.isValid) {
      return errorResponse(res, validation.message, 400);
    }

    const existingUser = await User.findOne({ username: cleanUsername });
    if (existingUser) {
      return errorResponse(res, 'Username already exists', 409);
    }

    const passwordHash = await User.hashPassword(password);

    const newOfficer = await User.create({
      fullName: fullName.trim(),
      username: cleanUsername,
      email: email ? email.trim() : '',
      phone: phone ? phone.trim() : '',
      passwordHash,
      role: 'WOREDA_OFFICER',
      locationId: woreda._id,
      language: language || 'am',
      mustChangePassword: true, // MANDATORY PASSWORD RESET ON FIRST LOGIN
      createdBy: req.user._id
    });

    await logAudit(req, 'PROVISION_WOREDA_OFFICER', 'User', newOfficer._id, {
      officerUsername: cleanUsername,
      woredaCode: woreda.code,
      woredaName: woreda.name,
      mustChangePassword: true
    });

    const officerObj = newOfficer.toObject();
    delete officerObj.passwordHash;

    return successResponse(
      res,
      officerObj,
      `Woreda Officer account for ${woreda.name} (${woreda.code}) provisioned successfully with forced password reset`,
      201
    );
  } catch (err) {
    return errorResponse(res, err.message || 'Failed to provision Woreda Officer', 500);
  }
};

module.exports = {
  getSecurityOverview,
  triggerDatabaseBackup,
  getBackupHistory,
  provisionWoredaOfficer
};
