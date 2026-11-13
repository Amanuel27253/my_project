const mongoose = require('mongoose');

const storeStockSchema = new mongoose.Schema(
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
    unit: {
      type: String,
      required: true
    },
    totalStock: {
      type: Number,
      default: 0,
      min: [0, 'Stock balance cannot be negative']
    },
    lastReceivedAt: {
      type: Date,
      default: null
    }
  },
  { _id: false }
);

const cooperativeStoreSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Store name is required'],
      trim: true
    },
    nameAm: {
      type: String,
      trim: true,
      default: ''
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    kebeleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      required: true,
      unique: true
    },
    woredaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      required: true
    },
    storekeeperId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    contactPhone: {
      type: String,
      default: ''
    },
    address: {
      type: String,
      default: ''
    },
    stocks: {
      type: [storeStockSchema],
      default: []
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

cooperativeStoreSchema.index({ woredaId: 1, kebeleId: 1 });

module.exports = mongoose.model('CooperativeStore', cooperativeStoreSchema);
