const mongoose = require('mongoose');

const stockMovementSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ['receipt', 'transfer_out', 'transfer_in', 'distribution', 'adjustment', 'write_off']
    },
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      required: true
    },
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
      default: null
    },
    quantityChange: {
      type: Number,
      required: true // Positive for additions, negative for deductions
    },
    balanceAfter: {
      type: Number,
      required: true
    },
    refType: {
      type: String,
      enum: ['supplier_receipt', 'stock_transfer', 'distribution', 'manual_adjustment', 'write_off'],
      default: 'manual_adjustment'
    },
    refId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    reason: {
      type: String,
      trim: true,
      default: ''
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

stockMovementSchema.index({ locationId: 1, goodsId: 1, createdAt: -1 });
stockMovementSchema.index({ refType: 1, refId: 1 });

module.exports = mongoose.model('StockMovement', stockMovementSchema);
