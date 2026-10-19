const mongoose = require('mongoose');

const quotaBalanceSchema = new mongoose.Schema(
  {
    beneficiaryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Beneficiary',
      required: true
    },
    goodsId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Goods',
      required: true
    },
    periodKey: {
      type: String,
      required: true,
      trim: true // Format: YYYY-MM e.g., '2026-10'
    },
    allowed: {
      type: Number,
      required: true,
      min: 0
    },
    used: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true
  }
);

quotaBalanceSchema.index({ beneficiaryId: 1, goodsId: 1, periodKey: 1 }, { unique: true });

module.exports = mongoose.model('QuotaBalance', quotaBalanceSchema);
