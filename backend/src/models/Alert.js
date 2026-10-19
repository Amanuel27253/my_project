const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ['low_stock', 'expiring', 'transfer_overdue', 'discrepancy', 'quota_blocked']
    },
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      default: null
    },
    goodsId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Goods',
      default: null
    },
    refId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    message: {
      type: String,
      required: true
    },
    alertDate: {
      type: Date,
      default: Date.now
    },
    isDismissed: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

alertSchema.index({ locationId: 1, type: 1, isDismissed: 1 });
alertSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Alert', alertSchema);
