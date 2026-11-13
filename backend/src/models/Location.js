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
    adminType: {
      type: String,
      enum: ['CITY_ADMIN', 'RURAL_WOREDA', 'KEBELE', 'ZONE'],
      default: 'RURAL_WOREDA'
    },
    woredaCode: {
      type: String,
      trim: true
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      default: null
    },
    population: {
      type: Number,
      default: 0
    },
    householdCount: {
      type: Number,
      default: 0
    },
    gots: {
      type: [String],
      default: ['Got 01 (መሀል ሰፈር)', 'Got 02 (አባይ ማዶ)', 'Got 03 (ወይራ ሰፈር)', 'Got 04 (ብርሃን ሰፈር)']
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active'
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

locationSchema.virtual('nameEn').get(function() {
  return this.name;
});

locationSchema.index({ type: 1, parentId: 1 });

module.exports = mongoose.model('Location', locationSchema);
