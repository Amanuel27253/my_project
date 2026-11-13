const mongoose = require('mongoose');

const gotScheduleSchema = new mongoose.Schema(
  {
    cycleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DistributionCycle',
      required: true
    },
    kebeleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      required: true
    },
    got: {
      type: String,
      required: true,
      trim: true
    },
    distributionDate: {
      type: Date,
      required: true
    },
    timeSlot: {
      type: String,
      default: '08:30 AM - 12:30 PM'
    },
    status: {
      type: String,
      enum: ['scheduled', 'active_today', 'completed'],
      default: 'scheduled'
    },
    targetHouseholds: {
      type: Number,
      default: 0
    },
    notes: {
      type: String,
      default: ''
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

gotScheduleSchema.index({ kebeleId: 1, cycleId: 1, got: 1 });
gotScheduleSchema.index({ distributionDate: 1, status: 1 });

module.exports = mongoose.model('GotSchedule', gotScheduleSchema);
