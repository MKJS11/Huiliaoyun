const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
  childName: {
    type: String,
    required: [true, '请输入孩子姓名'],
    trim: true
  },
  childGender: {
    type: String,
    enum: ['male', 'female', 'unknown'],
    default: 'unknown'
  },
  childBirthdate: {
    type: Date
  },
  childAge: {
    type: Number,
    min: 0,
    max: 50
  },
  parentName: {
    type: String,
    required: [true, '请输入家长姓名'],
    trim: true
  },
  relationship: {
    type: String,
    enum: ['mother', 'father', 'grandparent', 'other', ''],
    default: ''
  },
  phone: {
    type: String,
    required: [true, '请输入联系电话'],
    trim: true
  },
  email: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  constitution: {
    type: String,
    trim: true
  },
  mainSymptoms: {
    type: String,
    trim: true
  },
  allergyHistory: {
    type: String,
    trim: true
  },
  familyHistory: {
    type: String,
    trim: true
  },
  medicalHistory: {
    type: String,
    trim: true
  },
  source: {
    type: String,
    trim: true
  },
  notes: {
    type: String
  },
  membershipStatus: {
    type: String,
    enum: ['none', 'active', 'expired', 'expiring'],
    default: 'none'
  },
  synced: {
    type: Boolean,
    default: true
  },
  syncedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Customer', CustomerSchema); 