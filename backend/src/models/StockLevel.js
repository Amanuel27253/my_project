const mongoose = require('mongoose');

const stockLevelSchema = new mongoose.Schema(
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
    minLevel: {
      type: Number,
      required: true,
      default: 100
    }
  },
  {
    timestamps: true
  }
);

stockLevelSchema.index({ locationId: 1, goodsId: 1 }, { unique: true });

module.exports = mongoose.model('StockLevel', stockLevelSchema);
