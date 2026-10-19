const mongoose = require('mongoose');

const requestItemSchema = new mongoose.Schema(
  {
    goodsId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Goods',
      required: true
    },
    quantityRequested: {
      type: Number,
      required: true,
      min: [1, 'Quantity requested must be greater than zero']
    },
    quantityApproved: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  { _id: false }
);

const stockRequestSchema = new mongoose.Schema(
  {
    requestNo: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
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
      type: [requestItemSchema],
      required: true,
      validate: [val => val.length > 0, 'At least one item is required']
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'dispatched', 'received', 'closed', 'cancelled'],
      default: 'pending'
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    decidedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    decisionNote: {
      type: String,
      default: ''
    },
    decidedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

stockRequestSchema.index({ fromLocationId: 1, status: 1 });
stockRequestSchema.index({ toLocationId: 1, status: 1 });
stockRequestSchema.index({ createdAt: -1 });

module.exports = mongoose.model('StockRequest', stockRequestSchema);
