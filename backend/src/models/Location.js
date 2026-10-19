const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Location name is required'],
      trim: true
    },
    nameAm: {
      type: String,
      trim: true,
      default: ''
    },
    code: {
      type: String,
      required: [true, 'Location code is required'],
      unique: true,
      uppercase: true,
      trim: true
    },
    type: {
      type: String,
      required: true,
      enum: ['zone', 'woreda', 'kebele']
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      default: null
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

locationSchema.index({ type: 1, parentId: 1 });

module.exports = mongoose.model('Location', locationSchema);
