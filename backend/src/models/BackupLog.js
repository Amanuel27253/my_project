const mongoose = require('mongoose');

const backupLogSchema = new mongoose.Schema(
  {
    backupId: {
      type: String,
      required: true,
      unique: true
    },
    triggeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    triggeredByName: {
      type: String,
      default: 'System Administrator'
    },
    collectionsCovered: {
      type: [String],
      default: [
        'users',
        'locations',
        'goods',
        'beneficiaries',
        'cooperativestores',
        'distributioncycles',
        'distributiontransactions',
        'auditlogs'
      ]
    },
    recordCount: {
      type: Number,
      default: 0
    },
    sizeBytes: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['in_progress', 'completed', 'failed'],
      default: 'completed'
    },
    checksumSha256: {
      type: String,
      default: ''
    },
    notes: {
      type: String,
      default: 'Manual snapshot for North Shewa Zone'
    }
  },
  {
    timestamps: true
  }
);

backupLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('BackupLog', backupLogSchema);
