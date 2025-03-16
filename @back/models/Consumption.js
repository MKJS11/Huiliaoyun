const mongoose = require('mongoose');

const ConsumptionSchema = new mongoose.Schema({
  membership: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Membership',
    required: [true, '会员卡ID不能为空']
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service'
  },
  serviceName: {
    type: String,
    required: [true, '服务名称不能为空'],
    trim: true
  },
  amount: {
    type: Number,
    required: [true, '消费金额不能为空'],
    min: [0, '消费金额必须大于等于0']
  },
  count: {
    type: Number,
    required: [true, '消费次数不能为空'],
    min: [1, '消费次数必须大于0']
  },
  date: {
    type: Date,
    default: Date.now
  },
  therapist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Therapist'
  },
  therapistName: {
    type: String,
    trim: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: [true, '客户ID不能为空']
  },
  childName: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  operator: {
    type: String,
    trim: true
  },
  receiptNumber: {
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

// 添加索引来提高查询性能
ConsumptionSchema.index({ membership: 1, date: -1 });
ConsumptionSchema.index({ customer: 1, date: -1 });
ConsumptionSchema.index({ date: -1 });
ConsumptionSchema.index({ receiptNumber: 1 }, { unique: true });

// 生成消费记录编号
ConsumptionSchema.statics.generateReceiptNumber = async function() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  const prefix = `CS${year}${month}${day}`;
  
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

module.exports = mongoose.model('Consumption', ConsumptionSchema); 