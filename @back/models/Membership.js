const mongoose = require('mongoose');

const MembershipSchema = new mongoose.Schema({
  cardNumber: {
    type: String,
    required: [true, '会员卡号不能为空'],
    unique: true,
    trim: true
  },
  cardType: {
    type: String,
    required: [true, '卡类型不能为空'],
    enum: ['count', 'period', 'mixed', 'value'], // 次卡、期限卡、混合卡、储值卡
    default: 'count'
  },
  membershipType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MembershipType',
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: [true, '客户ID不能为空']
  },
  balance: {
    type: Number,
    default: 0
  },
  count: {
    type: Number,
    default: 0
  },
  issueDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date,
    required: [true, '有效期不能为空']
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled', 'frozen', 'lost'],
    default: 'active'
  },
  lastRechargeDate: {
    type: Date
  },
  lastConsumeDate: {
    type: Date
  },
  notes: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 会员卡号生成器
MembershipSchema.statics.generateCardNumber = async function() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  
  const prefix = `MK${year}${month}`;
  
  // 查找当月最新的会员卡号
  const latestCard = await this.findOne({
    cardNumber: { $regex: `^${prefix}` }
  }).sort({ cardNumber: -1 });
  
  let sequence = 1;
  if (latestCard) {
    const latestSequence = parseInt(latestCard.cardNumber.slice(-3));
    sequence = latestSequence + 1;
  }
  
  return `${prefix}${String(sequence).padStart(3, '0')}`;
};

// 检查会员卡是否过期
MembershipSchema.methods.isExpired = function() {
  return this.expiryDate < new Date();
};

// 计算会员卡剩余有效天数
MembershipSchema.methods.getRemainingDays = function() {
  if (this.isExpired()) return 0;
  
  const today = new Date();
  const diffTime = this.expiryDate - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

module.exports = mongoose.model('Membership', MembershipSchema); 