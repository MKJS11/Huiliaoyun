const mongoose = require('mongoose');

const RechargeSchema = new mongoose.Schema({
  membership: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Membership',
    required: [true, '会员卡ID不能为空']
  },
  amount: {
    type: Number,
    required: [true, '充值金额不能为空'],
    min: [0, '充值金额必须大于0']
  },
  bonusAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  rechargeCount: {
    type: Number,
    default: 0,
    min: 0
  },
  extendMonths: {
    type: Number,
    default: 0,
    min: 0
  },
  paymentMethod: {
    type: String,
    required: [true, '支付方式不能为空'],
    enum: ['cash', 'wechat', 'alipay', 'card', 'other'],
    default: 'cash'
  },
  operator: {
    type: String,
    trim: true
  },
  receiptNumber: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  rechargeDate: {
    type: Date,
    default: Date.now
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
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

// 生成收据编号
RechargeSchema.statics.generateReceiptNumber = async function() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  const prefix = `RC${year}${month}${day}`;
  
  // 查找当天最新的收据编号
  const latestReceipt = await this.findOne({
    receiptNumber: { $regex: `^${prefix}` }
  }).sort({ receiptNumber: -1 });
  
  let sequence = 1;
  if (latestReceipt) {
    const latestSequence = parseInt(latestReceipt.receiptNumber.slice(-4));
    sequence = latestSequence + 1;
  }
  
  return `${prefix}${String(sequence).padStart(4, '0')}`;
};

module.exports = mongoose.model('Recharge', RechargeSchema); 