const mongoose = require('mongoose');

const beneficiarySchema = new mongoose.Schema(
  {
    headName: {
      type: String,
      required: [true, 'Household head name is required'],
      trim: true
    },
    gender: {
      type: String,
      required: true,
      enum: ['male', 'female']
    },
    idType: {
      type: String,
      required: true,
      enum: ['fayda', 'kebele'],
      default: 'kebele'
    },
    idNumber: {
      type: String,
      required: [true, 'National or Kebele ID number is required'],
      unique: true,
      trim: true,
      uppercase: true
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true
    },
    address: {
      type: String,
      trim: true,
      default: ''
    },
    kebeleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      required: true
    },
    woredaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      required: true
    },
    familySize: {
      type: Number,
      required: true,
      min: [1, 'Family size must be at least 1'],
      default: 1
    },
    status: {
      type: String,
      enum: ['registered', 'verified', 'suspended'],
      default: 'registered'
    },
    registeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    verifiedAt: {
      type: Date,
      default: null
    },
    suspendReason: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

beneficiarySchema.index({ kebeleId: 1, headName: 1, phone: 1 });
beneficiarySchema.index({ woredaId: 1, status: 1 });

module.exports = mongoose.model('Beneficiary', beneficiarySchema);
