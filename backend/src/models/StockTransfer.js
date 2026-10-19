const mongoose = require('mongoose');

const transferItemSchema = new mongoose.Schema(
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
    expiryDate: {
      type: Date,
      required: true
    },
    quantitySent: {
      type: Number,
      required: true,
      min: [1, 'Quantity sent must be greater than zero']
    },
    quantityReceived: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  { _id: false }
);

const stockTransferSchema = new mongoose.Schema(
  {
    transferNo: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StockRequest',
      default: null
    },
    fromLocationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      required: true
    },
    toLocationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      required: true
    },
    items: {
      type: [transferItemSchema],
      required: true,
      validate: [val => val.length > 0, 'At least one item is required']
    },
    status: {
      type: String,
      enum: ['in_transit', 'received', 'received_with_discrepancy'],
      default: 'in_transit'
    },
    dispatchedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    dispatchedAt: {
      type: Date,
      default: Date.now
    },
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    receivedAt: {
      type: Date,
      default: null
    },
    discrepancyNote: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

stockTransferSchema.index({ fromLocationId: 1, status: 1 });
stockTransferSchema.index({ toLocationId: 1, status: 1 });
stockTransferSchema.index({ dispatchedAt: -1 });

module.exports = mongoose.model('StockTransfer', stockTransferSchema);
