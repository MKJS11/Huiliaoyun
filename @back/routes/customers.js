const express = require('express');
const router = express.Router();
const {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getRecentlyUpdated,
  updateSyncStatus
} = require('../controllers/customerController');

// 获取最近更新的客户，放在具体ID路由前面，避免路径冲突
router.get('/recent', getRecentlyUpdated);

// 更新客户同步状态
router.put('/:id/sync', updateSyncStatus);

// 基本CRUD路由
router.route('/')
  .get(getCustomers)
  .post(createCustomer);

router.route('/:id')
  .get(getCustomerById)
  .put(updateCustomer)
  .delete(deleteCustomer);

module.exports = router; 