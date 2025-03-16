const express = require('express');
const router = express.Router();
const {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  getServicesByCustomer,
  getServiceStats
} = require('../controllers/services');

// 获取所有服务记录
router.get('/', getServices);

// 获取服务统计数据
router.get('/stats', getServiceStats);

// 获取单个客户的所有服务记录
router.get('/customer/:customerId', getServicesByCustomer);

// 获取单个服务记录
router.get('/:id', getServiceById);

// 创建服务记录
router.post('/', createService);

// 更新服务记录
router.put('/:id', updateService);

// 删除服务记录
router.delete('/:id', deleteService);

module.exports = router; 