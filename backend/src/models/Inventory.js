const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema(
  {
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
      trim: true,
      uppercase: true
    },
    quantity: {
      type: Number,
      required: true,
      min: [0, 'Quantity cannot be negative'],
      default: 0
    },
    receivedDate: {
      type: Date,
      default: Date.now
    },
    expiryDate: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ['available', 'written_off'],
      default: 'available'
    }
  },
  {
    timestamps: true
  }
);

inventorySchema.index({ locationId: 1, goodsId: 1, batchNumber: 1 }, { unique: true });
inventorySchema.index({ locationId: 1, goodsId: 1, expiryDate: 1 });
inventorySchema.index({ expiryDate: 1 });

module.exports = mongoose.model('Inventory', inventorySchema);
