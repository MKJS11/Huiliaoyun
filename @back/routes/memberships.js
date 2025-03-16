const express = require('express');
const router = express.Router();
const {
  getMemberships,
  getMembershipStats,
  getCustomerMemberships,
  getMembershipById,
  createMembership,
  rechargeMembership,
  getMembershipRechargeHistory,
  getConsumptionHistory,
  getRechargeHistory,
  updateMembership,
  updateMembershipStatus,
  deleteMembership,
  recordConsumption
} = require('../controllers/memberships');

// 获取所有会员卡和创建会员卡
router
  .route('/')
  .get(getMemberships)
  .post(createMembership);

// 获取会员卡统计数据
router.get('/stats', getMembershipStats);

// 获取客户的所有会员卡
router.get('/customer/:customerId', getCustomerMemberships);

// 会员卡充值
router.post('/:id/recharge', rechargeMembership);

// 获取会员卡充值记录 (旧路由，保留向后兼容)
router.get('/:id/recharge-history', getMembershipRechargeHistory);

// 获取会员卡消费记录 (新路由)
router.get('/:id/consumption', getConsumptionHistory);

// 获取会员卡充值记录 (新路由)
router.get('/:id/recharge', getRechargeHistory);

// 添加消费记录
router.post('/:id/consumption', recordConsumption);

// 更新会员卡状态
router.patch('/:id/status', updateMembershipStatus);

// 获取、更新和删除单个会员卡
router
  .route('/:id')
  .get(getMembershipById)
  .put(updateMembership)
  .delete(deleteMembership);

module.exports = router; 