const mongoose = require('mongoose');

const MembershipTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, '会员卡类型名称不能为空'],
    trim: true
  },
  category: {
    type: String,
    required: [true, '卡类型不能为空'],
    enum: ['count', 'period', 'mixed', 'value'], // 次卡、期限卡、混合卡、储值卡
    default: 'count'
  },
  price: {
    type: Number,
    required: [true, '价格不能为空'],
    min: 0
  },
  valueAmount: {
    type: Number,
    min: 0,
    default: 0
  },
  serviceCount: {
    type: Number,
    min: 0,
    default: 0
  },
  validityDays: {
    type: Number,
    required: [true, '有效期天数不能为空'],
    min: 1
  },
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('MembershipType', MembershipTypeSchema); 