const mongoose = require('mongoose');

const distributionItemSchema = new mongoose.Schema(
  {
    goodsId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Goods',
      required: true
    },
    batchNumber: {
      type: String,
      required: true,
      trim: true
    },
    quantity: {
      type: Number,
      required: true,
      min: [0.01, 'Quantity distributed must be greater than zero']
    }
  },
  { _id: false }
);

const distributionSchema = new mongoose.Schema(
  {
    receiptNo: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    beneficiaryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Beneficiary',
      required: true
    },
    kebeleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      required: true
    },
    periodKey: {
      type: String,
      required: true,
      trim: true
    },
    items: {
      type: [distributionItemSchema],
      required: true,
      validate: [val => val.length > 0, 'At least one distribution item is required']
    },
    distributedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    distributedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

distributionSchema.index({ beneficiaryId: 1, distributedAt: -1 });
distributionSchema.index({ kebeleId: 1, periodKey: 1 });
distributionSchema.index({ distributedAt: -1 });

module.exports = mongoose.model('Distribution', distributionSchema);
