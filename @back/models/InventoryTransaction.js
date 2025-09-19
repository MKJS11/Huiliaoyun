const mongoose = require('mongoose');

/**
 * 库存交易记录模型
 * 用于记录商品的入库和出库操作
 */
const InventoryTransactionSchema = new mongoose.Schema({
  // 关联的库存商品
  inventory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inventory',
    required: [true, '请指定库存商品']
  },
  // 交易类型：入库、出库或销售
  type: {
    type: String,
    required: [true, '请指定交易类型'],
    enum: ['入库', '出库', '销售'],
    default: '入库'
  },
  // 交易数量
  quantity: {
    type: Number,
    required: [true, '请提供交易数量'],
    min: [0.01, '交易数量必须大于0']
  },
  // 交易单价
  unitPrice: {
    type: Number,
    required: [true, '请提供交易单价'],
    min: [0, '交易单价不能为负数']
  },
  // 总金额
  totalPrice: {
    type: Number,
    default: function() {
      return this.quantity * this.unitPrice;
    }
  },
  // 利润（仅适用于销售类型）
  profit: {
    type: Number,
    default: 0
  },
  // 供应商（适用于入库）
  supplier: {
    type: String,
    trim: true
  },
  // 客户（适用于销售）
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  },
  // 交易备注
  notes: {
    type: String,
    trim: true
  },
  // 操作员
  operator: {
    type: String,
    default: '管理员'
  },
  // 交易日期
  transactionDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 计算总价
InventoryTransactionSchema.pre('save', function(next) {
  if (this.quantity && this.unitPrice) {
    this.totalPrice = this.quantity * this.unitPrice;
  }
  next();
});

module.exports = mongoose.model('InventoryTransaction', InventoryTransactionSchema); 