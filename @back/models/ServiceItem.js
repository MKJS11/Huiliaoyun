const mongoose = require('mongoose');

const ServiceItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, '服务项目名称不能为空'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, '价格不能为空'],
    min: 0
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

module.exports = mongoose.model('ServiceItem', ServiceItemSchema); 