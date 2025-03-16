const mongoose = require('mongoose');

const TherapistSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, '请输入医师姓名'],
    trim: true
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    default: 'male'
  },
  phone: {
    type: String,
    required: [true, '请输入联系电话'],
    trim: true,
    match: [/^1[3-9]\d{9}$/, '请输入有效的手机号码']
  },
  specialties: {
    type: [String],
    default: []
  },
  title: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  experience: {
    type: Number,
    default: 0,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  photoUrl: {
    type: String,
    trim: true
  },
  workedHours: {
    type: Number,
    default: 0
  },
  avgRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  ratingCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 删除前钩子，用于将来可能的关联数据处理
TherapistSchema.pre('remove', async function(next) {
  console.log(`正在删除医师: ${this._id}`);
  // 如果需要处理关联数据，可以在这里添加代码
  next();
});

module.exports = mongoose.model('Therapist', TherapistSchema); 