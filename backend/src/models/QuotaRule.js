const mongoose = require('mongoose');

const quotaRuleSchema = new mongoose.Schema(
  {
    goodsId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Goods',
      required: true,
      unique: true
    },
    quantityPerPerson: {
      type: Number,
      required: [true, 'Quantity per person is required'],
      min: [0.1, 'Quantity must be positive']
    },
    maxPerHousehold: {
      type: Number,
      required: [true, 'Maximum quantity per household is required'],
      min: [0.1, 'Max quantity must be positive']
    },
    periodType: {
      type: String,
      enum: ['monthly'],
      default: 'monthly'
    },
    active: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('QuotaRule', quotaRuleSchema);
