const mongoose = require('mongoose');

const transactionItemSchema = new mongoose.Schema(
  {
    goodsId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Goods',
      required: true
    },
    goodsName: {
      type: String,
      required: true
    },
    goodsNameAm: {
      type: String,
      default: ''
    },
    quantity: {
      type: Number,
      required: true,
      min: [0.01, 'Quantity must be greater than zero']
    },
    unit: {
      type: String,
      required: true
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0
    }
  },
  { _id: false }
);

const distributionTransactionSchema = new mongoose.Schema(
  {
    receiptNo: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    cycleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DistributionCycle',
      required: true
    },
    householdId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Beneficiary',
      required: true
    },
    rationCardId: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },
    headName: {
      type: String,
      required: true,
      trim: true
    },
    faydaId: {
      type: String,
      trim: true
    },
    kebeleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      required: true
    },
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CooperativeStore',
      required: true
    },
    storekeeperId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    got: {
      type: String,
      default: ''
    },
    familySize: {
      type: Number,
      required: true,
      min: 1
    },
    items: {
      type: [transactionItemSchema],
      required: true,
      validate: [val => val.length > 0, 'At least one commodity item is required']
    },
    totalCash: {
      type: Number,
      required: true,
      min: [0, 'Total cash cannot be negative']
    },
    paymentMethod: {
      type: String,
      default: 'Cash'
    },
    status: {
      type: String,
      enum: ['COLLECTED', 'CANCELLED'],
      default: 'COLLECTED'
    },
    collectedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Compound Unique Index: Prevents double-claiming in the same distribution cycle
distributionTransactionSchema.index({ householdId: 1, cycleId: 1 }, { unique: true });
distributionTransactionSchema.index({ rationCardId: 1, cycleId: 1 });
distributionTransactionSchema.index({ storeId: 1, collectedAt: -1 });
distributionTransactionSchema.index({ kebeleId: 1, collectedAt: -1 });

module.exports = mongoose.model('DistributionTransaction', distributionTransactionSchema);
