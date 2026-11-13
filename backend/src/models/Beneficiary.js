const mongoose = require('mongoose');

const familyMemberSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Dependent name is required'],
      trim: true
    },
    relationship: {
      type: String,
      required: true,
      enum: ['Spouse', 'Child', 'Parent', 'Sibling', 'Other'],
      default: 'Child'
    },
    faydaOrBirthId: {
      type: String,
      required: [true, 'Fayda ID or Birth Certificate ID is required for dependent'],
      trim: true,
      uppercase: true
    },
    age: {
      type: Number,
      default: 0,
      min: 0
    },
    gender: {
      type: String,
      enum: ['male', 'female'],
      default: 'male'
    }
  },
  { _id: true }
);

const transferHistorySchema = new mongoose.Schema(
  {
    fromKebeleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      required: true
    },
    toKebeleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      required: true
    },
    requestDate: {
      type: Date,
      default: Date.now
    },
    approvedDate: {
      type: Date,
      default: null
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    reason: {
      type: String,
      default: ''
    }
  },
  { _id: true }
);

const beneficiarySchema = new mongoose.Schema(
  {
    rationCardId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      uppercase: true
    },
    faydaId: {
      type: String,
      sparse: true,
      trim: true
    },
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
    maritalStatus: {
      type: String,
      enum: ['Single', 'Married', 'Divorced', 'Widowed'],
      default: 'Married'
    },
    idType: {
      type: String,
      required: true,
      enum: ['fayda', 'kebele'],
      default: 'fayda'
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
    got: {
      type: String,
      trim: true,
      default: 'Got 01 (መሀል ሰፈር)'
    },
    houseNumber: {
      type: String,
      trim: true,
      default: ''
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
    familyMembers: {
      type: [familyMemberSchema],
      default: []
    },
    familySize: {
      type: Number,
      required: true,
      min: [1, 'Family size must be at least 1'],
      default: 1
    },
    status: {
      type: String,
      enum: ['registered', 'verified', 'transferred', 'suspended'],
      default: 'registered'
    },
    transferHistory: {
      type: [transferHistorySchema],
      default: []
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

beneficiarySchema.index({ 'familyMembers.faydaOrBirthId': 1 });
beneficiarySchema.index({ kebeleId: 1, headName: 1, phone: 1 });
beneficiarySchema.index({ woredaId: 1, status: 1 });
beneficiarySchema.index({ got: 1, kebeleId: 1 });

module.exports = mongoose.model('Beneficiary', beneficiarySchema);
