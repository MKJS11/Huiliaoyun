const express = require('express');
const router = express.Router();
const {
  getStatisticsData,
  getOverviewStats,
  getRevenueTrend,
  getIncomeComposition,
  getCardRevenue,
  getTherapistPerformance,
  getCustomerActivity,
  getCustomerConstitution,
  getInactiveCustomers,
  getTodayOverview
} = require('../controllers/statistics');

// 获取综合统计数据
router.get('/', getStatisticsData);

// 获取概览统计数据
router.get('/overview', getOverviewStats);

// 获取收入趋势
router.get('/revenue-trend', getRevenueTrend);

// 获取收入构成
router.get('/income-composition', getIncomeComposition);

// 获取会员卡收入
router.get('/card-revenue', getCardRevenue);

// 获取推拿师绩效
router.get('/therapist-performance', getTherapistPerformance);

// 获取客户活跃度
router.get('/customer-activity', getCustomerActivity);

// 获取客户体质分布
router.get('/customer-constitution', getCustomerConstitution);

// 获取未到店客户
router.get('/inactive-customers', getInactiveCustomers);

// 获取今日概览数据
router.get('/today-overview', getTodayOverview);

module.exports = router; 