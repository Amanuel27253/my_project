const mongoose = require('mongoose');

const goodsSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Goods name is required'],
      trim: true
    },
    nameAm: {
      type: String,
      trim: true,
      default: ''
    },
    category: {
      type: String,
      required: true,
      trim: true,
      default: 'Essential'
    },
    unit: {
      type: String,
      required: true,
      enum: ['kg', 'liter', 'piece']
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Goods', goodsSchema);
