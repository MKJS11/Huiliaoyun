const mongoose = require('mongoose');

const ServiceSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  membership: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Membership'
  },
  serviceType: {
    type: String,
    required: [true, '请选择服务类型'],
    trim: true
  },
  serviceDate: {
    type: Date,
    required: [true, '请选择服务日期'],
    default: Date.now
  },
  serviceFee: {
    type: Number,
    required: [true, '请输入服务费用'],
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'membership', 'wechat', 'alipay', 'other'],
    default: 'cash'
  },
  therapist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Therapist'
  },
  symptoms: {
    type: String,
    trim: true
  },
  diagnosis: {
    type: String,
    trim: true
  },
  treatment: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
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
  timestamps: true,
  strict: false
});

ServiceSchema.pre('remove', async function(next) {
  console.log(`删除服务记录: ${this._id}`);
  next();
});

module.exports = mongoose.model('Service', ServiceSchema); 