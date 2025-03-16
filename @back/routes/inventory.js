const express = require('express');
const router = express.Router();
const {
  getInventoryItems,
  getInventoryItem,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  stockIn,
  stockOut,
  getTransactions,
  getInventoryStats
} = require('../controllers/inventory');

// 获取所有商品
router.get('/', getInventoryItems);

// 获取库存统计
router.get('/stats', getInventoryStats);

// 获取交易记录
router.get('/transactions', getTransactions);

// 获取单个商品
router.get('/:id', getInventoryItem);

// 创建商品
router.post('/', createInventoryItem);

// 更新商品
router.put('/:id', updateInventoryItem);

// 删除商品
router.delete('/:id', deleteInventoryItem);

// 入库操作
router.post('/:id/stock-in', stockIn);

// 出库操作
router.post('/:id/stock-out', stockOut);

module.exports = router; 