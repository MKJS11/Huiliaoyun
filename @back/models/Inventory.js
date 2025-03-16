const mongoose = require('mongoose');

/**
 * 库存商品模型
 */
const InventorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, '请提供商品名称'],
    trim: true
  },
  category: {
    type: String,
    required: [true, '请提供商品类别'],
    enum: ['推拿用品', '艾灸用品', '刮痧用品', '药品', '其他'],
    default: '其他'
  },
  specification: {
    type: String,
    trim: true
  },
  unit: {
    type: String,
    required: [true, '请提供计量单位'],
    trim: true
  },
  costPrice: {
    type: Number,
    required: [true, '请提供成本价'],
    min: [0, '成本价不能为负数']
  },
  sellingPrice: {
    type: Number,
    required: [true, '请提供售价'],
    min: [0, '售价不能为负数']
  },
  stock: {
    type: Number,
    default: 0,
    min: [0, '库存不能为负数']
  },
  warningThreshold: {
    type: Number,
    default: 10,
    min: [0, '预警阈值不能为负数']
  },
  supplier: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
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

// 在保存前更新updatedAt字段
InventorySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// 创建虚拟字段：库存状态
InventorySchema.virtual('stockStatus').get(function() {
  if (this.stock <= 0) {
    return '无库存';
  } else if (this.stock <= this.warningThreshold) {
    return '库存不足';
  } else {
    return '库存充足';
  }
});

// 创建虚拟字段：库存总价值
InventorySchema.virtual('totalValue').get(function() {
  return this.stock * this.costPrice;
});

module.exports = mongoose.model('Inventory', InventorySchema); 