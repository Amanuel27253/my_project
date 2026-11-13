const mongoose = require('mongoose');

const woredaAllocationSchema = new mongoose.Schema(
  {
    woredaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      required: true
    },
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
    allocatedQuantity: {
      type: Number,
      required: true,
      min: [0, 'Allocated quantity cannot be negative']
    },
    populationSharePercentage: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['allocated', 'dispatched', 'received'],
      default: 'allocated'
    }
  },
  { _id: true }
);

const kebeleAllocationSchema = new mongoose.Schema(
  {
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
    allocatedQuantity: {
      type: Number,
      required: true,
      min: [0, 'Allocated quantity cannot be negative']
    },
    receivedQuantity: {
      type: Number,
      default: 0
    },
    isReceived: {
      type: Boolean,
      default: false
    },
    receivedAt: {
      type: Date,
      default: null
    },
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    allocationLetterNo: {
      type: String,
      trim: true,
      default: ''
    },
    allocationLetterDate: {
      type: Date,
      default: Date.now
    },
    quotaRule: {
      quantityPerPerson: {
        type: Number,
        required: true,
        default: 2
      },
      maxPerHousehold: {
        type: Number,
        required: true,
        default: 10
      },
      unitPrice: {
        type: Number,
        required: true,
        default: 0
      }
    },
    distributionWindow: {
      startDate: {
        type: Date,
        default: Date.now
      },
      endDate: {
        type: Date,
        default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      }
    }
  },
  { _id: true }
);

const distributionCycleSchema = new mongoose.Schema(
  {
    cycleCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    titleAm: {
      type: String,
      trim: true,
      default: ''
    },
    month: {
      type: String,
      required: true,
      trim: true // e.g. '2026-11'
    },
    zoneAllocations: {
      type: [woredaAllocationSchema],
      default: []
    },
    kebeleAllocations: {
      type: [kebeleAllocationSchema],
      default: []
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'completed'],
      default: 'active'
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

distributionCycleSchema.index({ month: 1, status: 1 });
distributionCycleSchema.index({ 'kebeleAllocations.kebeleId': 1 });
distributionCycleSchema.index({ 'kebeleAllocations.storeId': 1 });

module.exports = mongoose.model('DistributionCycle', distributionCycleSchema);
