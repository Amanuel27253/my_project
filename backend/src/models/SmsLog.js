const mongoose = require('mongoose');

const smsRecipientSchema = new mongoose.Schema(
  {
    householdId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Beneficiary'
    },
    headName: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    rationCardId: {
      type: String,
      default: ''
    },
    deliveryStatus: {
      type: String,
      enum: ['Delivered', 'Sent', 'Failed'],
      default: 'Delivered'
    }
  },
  { _id: false }
);

const smsLogSchema = new mongoose.Schema(
  {
    kebeleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      required: true
    },
    cycleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DistributionCycle',
      required: true
    },
    got: {
      type: String,
      default: 'All Gots'
    },
    messageAm: {
      type: String,
      required: true
    },
    totalSent: {
      type: Number,
      required: true,
      default: 0
    },
    recipients: {
      type: [smsRecipientSchema],
      default: []
    },
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    sentAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

smsLogSchema.index({ kebeleId: 1, sentAt: -1 });

module.exports = mongoose.model('SmsLog', smsLogSchema);
