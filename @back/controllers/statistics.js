const Customer = require('../models/Customer');
const Service = require('../models/Service');
const Membership = require('../models/Membership');
const Recharge = require('../models/Recharge');
const mongoose = require('mongoose');

/**
 * @desc 获取综合统计数据
 * @route GET /api/statistics
 * @access 公开
 */
exports.getStatisticsData = async (req, res) => {
  try {
    // 获取查询参数中的日期范围
    const startDate = req.query.startDate ? new Date(req.query.startDate) : getMonthStartDate();
    const endDate = req.query.endDate ? new Date(req.query.endDate) : getMonthEndDate();
    
    console.log('统计数据请求 - 日期范围:', startDate, '至', endDate);
    
    // 验证日期格式
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: '日期格式无效'
      });
    }
    
    // 并行获取各项统计数据
    const [
      overview,
      revenueTrend,
      incomeComposition,
      cardRevenue,
      therapistPerformance,
      customerActivity,
      customerConstitution,
      inactiveCustomers
    ] = await Promise.all([
      getOverviewData(startDate, endDate),
      getRevenueTrendData(startDate, endDate),
      getIncomeCompositionData(startDate, endDate),
      getCardRevenueData(startDate, endDate),
      getTherapistPerformanceData(startDate, endDate),
      getCustomerActivityData(startDate, endDate),
      getCustomerConstitutionData(startDate, endDate),
      getInactiveCustomersData(30) // 默认获取30天未到店的客户
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        overview,
        revenueTrend,
        incomeComposition,
        cardRevenue,
        therapistPerformance,
        customerActivity,
        customerConstitution,
        inactiveCustomers
      }
    });
  } catch (error) {
    console.error('获取统计数据出错:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，无法获取统计数据'
    });
  }
};

/**
 * @desc 获取概览统计数据
 * @route GET /api/statistics/overview
 * @access 公开
 */
exports.getOverviewStats = async (req, res) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate) : getMonthStartDate();
    const endDate = req.query.endDate ? new Date(req.query.endDate) : getMonthEndDate();
    
    const overview = await getOverviewData(startDate, endDate);
    
    res.status(200).json({
      success: true,
      data: overview
    });
  } catch (error) {
    console.error('获取概览统计数据出错:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，无法获取概览统计数据'
    });
  }
};

/**
 * @desc 获取收入趋势
 * @route GET /api/statistics/revenue-trend
 * @access 公开
 */
exports.getRevenueTrend = async (req, res) => {
  try {
    // 支持days参数，获取最近n天的数据
    const days = req.query.days ? parseInt(req.query.days) : 7;
    
    // 如果提供了明确的日期范围，则使用指定日期
    // 否则，根据days参数计算日期范围
    let startDate, endDate;
    
    if (req.query.startDate && req.query.endDate) {
      startDate = new Date(req.query.startDate);
      endDate = new Date(req.query.endDate);
    } else {
      endDate = new Date(); // 今天
      startDate = new Date();
      startDate.setDate(endDate.getDate() - days + 1); // 从n天前开始
      
      // 设置时间为当天开始和结束
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    }
    
    // 检查日期有效性
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: '日期参数无效'
      });
    }
    
    console.log(`获取营收趋势: ${startDate.toISOString()} 到 ${endDate.toISOString()}, 天数: ${days}`);
    
    // 获取日期内的服务记录
    const services = await Service.find({
      serviceDate: { $gte: startDate, $lte: endDate }
    }).sort('serviceDate');
    
    // 准备日期数组（包含指定范围内的所有日期）
    const dateArray = [];
    const revenueArray = [];
    
    // 生成所有日期，包括没有数据的日期
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateString = currentDate.toISOString().split('T')[0]; // 格式化为YYYY-MM-DD
      dateArray.push(dateString);
      revenueArray.push(0); // 初始化为0
      
      currentDate.setDate(currentDate.getDate() + 1); // 增加一天
    }
    
    // 计算每天的收入
    services.forEach(service => {
      const serviceDate = service.serviceDate.toISOString().split('T')[0];
      const index = dateArray.indexOf(serviceDate);
      
      if (index !== -1) {
        revenueArray[index] += service.serviceFee || 0;
      }
    });
    
    res.status(200).json({
      success: true,
      data: {
        dates: dateArray,
        revenues: revenueArray
      }
    });
  } catch (error) {
    console.error('获取收入趋势出错:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，无法获取收入趋势'
    });
  }
};

/**
 * @desc 获取收入构成
 * @route GET /api/statistics/income-composition
 * @access 公开
 */
exports.getIncomeComposition = async (req, res) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate) : getMonthStartDate();
    const endDate = req.query.endDate ? new Date(req.query.endDate) : getMonthEndDate();
    
    const incomeComposition = await getIncomeCompositionData(startDate, endDate);
    
    res.status(200).json({
      success: true,
      data: incomeComposition
    });
  } catch (error) {
    console.error('获取收入构成出错:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，无法获取收入构成'
    });
  }
};

/**
 * @desc 获取会员卡收入
 * @route GET /api/statistics/card-revenue
 * @access 公开
 */
exports.getCardRevenue = async (req, res) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate) : getMonthStartDate();
    const endDate = req.query.endDate ? new Date(req.query.endDate) : getMonthEndDate();
    
    const cardRevenue = await getCardRevenueData(startDate, endDate);
    
    res.status(200).json({
      success: true,
      data: cardRevenue
    });
  } catch (error) {
    console.error('获取会员卡收入出错:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，无法获取会员卡收入'
    });
  }
};

/**
 * @desc 获取推拿师绩效
 * @route GET /api/statistics/therapist-performance
 * @access 公开
 */
exports.getTherapistPerformance = async (req, res) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate) : getMonthStartDate();
    const endDate = req.query.endDate ? new Date(req.query.endDate) : getMonthEndDate();
    
    const therapistPerformance = await getTherapistPerformanceData(startDate, endDate);
    
    res.status(200).json({
      success: true,
      data: therapistPerformance
    });
  } catch (error) {
    console.error('获取推拿师绩效出错:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，无法获取推拿师绩效'
    });
  }
};

/**
 * @desc 获取客户活跃度
 * @route GET /api/statistics/customer-activity
 * @access 公开
 */
exports.getCustomerActivity = async (req, res) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate) : getMonthStartDate();
    const endDate = req.query.endDate ? new Date(req.query.endDate) : getMonthEndDate();
    
    const customerActivity = await getCustomerActivityData(startDate, endDate);
    
    res.status(200).json({
      success: true,
      data: customerActivity
    });
  } catch (error) {
    console.error('获取客户活跃度出错:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，无法获取客户活跃度'
    });
  }
};

/**
 * @desc 获取客户体质分布
 * @route GET /api/statistics/customer-constitution
 * @access 公开
 */
exports.getCustomerConstitution = async (req, res) => {
  try {
    const customerConstitution = await getCustomerConstitutionData();
    
    res.status(200).json({
      success: true,
      data: customerConstitution
    });
  } catch (error) {
    console.error('获取客户体质分布出错:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，无法获取客户体质分布'
    });
  }
};

/**
 * @desc 获取未到店客户
 * @route GET /api/statistics/inactive-customers
 * @access 公开
 */
exports.getInactiveCustomers = async (req, res) => {
  try {
    const days = req.query.days ? parseInt(req.query.days) : 30;
    
    if (isNaN(days) || days <= 0) {
      return res.status(400).json({
        success: false,
        message: '天数参数无效'
      });
    }
    
    const inactiveCustomers = await getInactiveCustomersData(days);
    
    res.status(200).json({
      success: true,
      data: inactiveCustomers
    });
  } catch (error) {
    console.error('获取未到店客户出错:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，无法获取未到店客户'
    });
  }
};

/**
 * @desc 获取今日概览数据
 * @route GET /api/statistics/today-overview
 * @access 公开
 */
exports.getTodayOverview = async (req, res) => {
  try {
    // 获取今天的开始和结束时间
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    
    // 获取今日服务数据
    const todayServices = await Service.find({
      serviceDate: { $gte: startOfDay, $lte: endOfDay }
    });
    
    // 获取今日新增会员
    const todayNewMembers = await Membership.countDocuments({
      issueDate: { $gte: startOfDay, $lte: endOfDay }
    });
    
    // 计算今日营收
    const todayRevenue = todayServices.reduce((total, service) => total + (service.serviceFee || 0), 0);
    
    // 获取即将到期的会员卡数量（30天内）
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
    
    const expiringCards = await Membership.countDocuments({
      expiryDate: { $gte: today, $lte: thirtyDaysLater },
      status: 'active'
    });
    
    res.status(200).json({
      success: true,
      data: {
        todayVisits: todayServices.length,
        todayRevenue,
        todayNewMembers,
        expiringCards
      }
    });
  } catch (error) {
    console.error('获取今日概览数据出错:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，无法获取今日概览数据'
    });
  }
};

// ============= 辅助函数 ============= //

/**
 * 获取当月第一天
 * @returns {Date} 当月第一天
 */
function getMonthStartDate() {
  const date = new Date();
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * 获取当月最后一天
 * @returns {Date} 当月最后一天
 */
function getMonthEndDate() {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  date.setDate(0);
  date.setHours(23, 59, 59, 999);
  return date;
}

/**
 * 获取上一个月的日期范围
 * @param {Date} startDate 当前开始日期
 * @param {Date} endDate 当前结束日期
 * @returns {Object} 上一个月的开始和结束日期
 */
function getPreviousPeriod(startDate, endDate) {
  const duration = endDate - startDate;
  const prevStartDate = new Date(startDate);
  prevStartDate.setTime(prevStartDate.getTime() - duration);
  const prevEndDate = new Date(startDate);
  prevEndDate.setTime(prevEndDate.getTime() - 1);
  return { startDate: prevStartDate, endDate: prevEndDate };
}

/**
 * 获取概览统计数据
 * @param {Date} startDate 开始日期
 * @param {Date} endDate 结束日期
 * @returns {Promise<Object>} 概览统计数据
 */
async function getOverviewData(startDate, endDate) {
  // 获取上一个时间段
  const prevPeriod = getPreviousPeriod(startDate, endDate);
  
  // 获取当前时间段服务记录
  const services = await Service.find({
    serviceDate: { $gte: startDate, $lte: endDate }
  });
  
  // 获取上一时间段服务记录
  const prevServices = await Service.find({
    serviceDate: { $gte: prevPeriod.startDate, $lte: prevPeriod.endDate }
  });
  
  // 获取当前时间段新增会员
  const newMembers = await Membership.countDocuments({
    issueDate: { $gte: startDate, $lte: endDate }
  });
  
  // 获取上一时间段新增会员
  const prevNewMembers = await Membership.countDocuments({
    issueDate: { $gte: prevPeriod.startDate, $lte: prevPeriod.endDate }
  });
  
  // 计算服务总收入
  const totalIncome = services.reduce((total, service) => total + (service.serviceFee || 0), 0);
  const prevTotalIncome = prevServices.reduce((total, service) => total + (service.serviceFee || 0), 0);
  
  // 计算平均评分
  const servicesWithRating = services.filter(service => service.rating && service.rating > 0);
  const totalRating = servicesWithRating.reduce((total, service) => total + service.rating, 0);
  const avgRating = servicesWithRating.length > 0 ? totalRating / servicesWithRating.length : 0;
  
  const prevServicesWithRating = prevServices.filter(service => service.rating && service.rating > 0);
  const prevTotalRating = prevServicesWithRating.reduce((total, service) => total + service.rating, 0);
  const prevAvgRating = prevServicesWithRating.length > 0 ? prevTotalRating / prevServicesWithRating.length : 0;
  
  // 计算环比增长率
  const serviceGrowthRate = prevServices.length > 0 
    ? ((services.length - prevServices.length) / prevServices.length) * 100 
    : 100;
  
  const incomeGrowthRate = prevTotalIncome > 0 
    ? ((totalIncome - prevTotalIncome) / prevTotalIncome) * 100 
    : 100;
  
  const memberGrowthRate = prevNewMembers > 0 
    ? ((newMembers - prevNewMembers) / prevNewMembers) * 100 
    : 100;
  
  const ratingChange = avgRating - prevAvgRating;
  
  return {
    serviceCount: services.length,
    serviceGrowthRate,
    totalIncome,
    incomeGrowthRate,
    newMembers,
    memberGrowthRate,
    avgRating,
    ratingChange
  };
}

/**
 * 获取收入趋势数据
 * @param {Date} startDate 开始日期
 * @param {Date} endDate 结束日期
 * @returns {Promise<Array>} 收入趋势数据
 */
async function getRevenueTrendData(startDate, endDate) {
  // 确定时间粒度: 天、月或年
  const durationDays = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));
  let granularity = 'day';
  let format = '%Y-%m-%d';
  let prevYearOffset = -365; // 默认同比为去年同期
  
  if (durationDays > 60) {
    granularity = 'month';
    format = '%Y-%m';
    prevYearOffset = -365; // 按月查看时，同比去年同月
  } else if (durationDays > 730) {
    granularity = 'year';
    format = '%Y';
    prevYearOffset = -1825; // 按年查看时，同比前5年平均
  }
  
  // 获取当前时间段的收入趋势
  const revenueTrend = await Service.aggregate([
    {
      $match: {
        serviceDate: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format, date: "$serviceDate" }
        },
        amount: { $sum: "$serviceFee" }
      }
    },
    {
      $sort: { "_id": 1 }
    }
  ]);
  
  // 获取同比时间段的收入趋势
  const prevStartDate = new Date(startDate);
  const prevEndDate = new Date(endDate);
  
  if (granularity === 'day' || granularity === 'month') {
    prevStartDate.setDate(prevStartDate.getDate() + prevYearOffset);
    prevEndDate.setDate(prevEndDate.getDate() + prevYearOffset);
  } else {
    // 按年查看时，获取前5年数据并平均
    prevStartDate.setFullYear(prevStartDate.getFullYear() - 5);
    prevEndDate.setFullYear(prevEndDate.getFullYear() - 1);
  }
  
  const prevRevenueTrend = await Service.aggregate([
    {
      $match: {
        serviceDate: { $gte: prevStartDate, $lte: prevEndDate }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { 
            format: granularity === 'year' ? '%m' : format, // 按年视图只需要月份部分进行对齐
            date: "$serviceDate" 
          }
        },
        amount: { $sum: "$serviceFee" }
      }
    },
    {
      $sort: { "_id": 1 }
    }
  ]);
  
  // 合并当前和同比数据
  const result = revenueTrend.map(item => {
    let periodLabel = item._id;
    let previousAmount = 0;
    
    if (granularity === 'day') {
      // 提取月日部分用于匹配
      const monthDay = item._id.substring(5);
      const prevItem = prevRevenueTrend.find(p => p._id.endsWith(monthDay));
      previousAmount = prevItem ? prevItem.amount : 0;
    } else if (granularity === 'month') {
      // 提取月份部分用于匹配
      const month = item._id.substring(5);
      const prevItem = prevRevenueTrend.find(p => p._id.endsWith(month));
      previousAmount = prevItem ? prevItem.amount : 0;
    } else {
      // 按年视图，计算前5年对应月份的平均值
      const prevItems = prevRevenueTrend.filter(p => p._id === item._id.substring(5));
      previousAmount = prevItems.length > 0
        ? prevItems.reduce((sum, curr) => sum + curr.amount, 0) / prevItems.length
        : 0;
    }
    
    return {
      period: periodLabel,
      amount: item.amount,
      previousAmount
    };
  });
  
  return result;
}

/**
 * 获取收入构成数据
 * @param {Date} startDate 开始日期
 * @param {Date} endDate 结束日期
 * @returns {Promise<Array>} 收入构成数据
 */
async function getIncomeCompositionData(startDate, endDate) {
  // 获取服务收入
  const serviceIncome = await Service.aggregate([
    {
      $match: {
        serviceDate: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: "$serviceFee" }
      }
    }
  ]);
  
  // 获取会员卡收入（新卡）
  const newCardIncome = await Membership.aggregate([
    {
      $match: {
        issueDate: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: "$initialAmount" }
      }
    }
  ]);
  
  // 获取会员卡充值收入
  const rechargeIncome = await Recharge.aggregate([
    {
      $match: {
        rechargeDate: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: "$amount" }
      }
    }
  ]);
  
  // 计算总收入
  const totalIncome = 
    (serviceIncome.length > 0 ? serviceIncome[0].totalAmount : 0) +
    (newCardIncome.length > 0 ? newCardIncome[0].totalAmount : 0) +
    (rechargeIncome.length > 0 ? rechargeIncome[0].totalAmount : 0);
  
  if (totalIncome === 0) {
    return [
      { category: '会员卡办理', amount: 0, percentage: 0 },
      { category: '单次服务收入', amount: 0, percentage: 0 },
      { category: '会员卡充值', amount: 0, percentage: 0 }
    ];
  }
  
  // 计算各类收入占比
  const categories = [
    {
      category: '会员卡办理',
      amount: newCardIncome.length > 0 ? newCardIncome[0].totalAmount : 0,
      percentage: Math.round((newCardIncome.length > 0 ? newCardIncome[0].totalAmount : 0) / totalIncome * 100)
    },
    {
      category: '单次服务收入',
      amount: serviceIncome.length > 0 ? serviceIncome[0].totalAmount : 0,
      percentage: Math.round((serviceIncome.length > 0 ? serviceIncome[0].totalAmount : 0) / totalIncome * 100)
    },
    {
      category: '会员卡充值',
      amount: rechargeIncome.length > 0 ? rechargeIncome[0].totalAmount : 0,
      percentage: Math.round((rechargeIncome.length > 0 ? rechargeIncome[0].totalAmount : 0) / totalIncome * 100)
    }
  ];
  
  return categories;
}

/**
 * 获取会员卡收入数据
 * @param {Date} startDate 开始日期
 * @param {Date} endDate 结束日期
 * @returns {Promise<Array>} 会员卡收入数据
 */
async function getCardRevenueData(startDate, endDate) {
  // 获取新办卡收入（按卡类型）
  const newCardRevenue = await Membership.aggregate([
    {
      $match: {
        issueDate: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: "$cardType",
        newCardAmount: { $sum: "$initialAmount" }
      }
    }
  ]);
  
  // 获取充值收入（按卡类型）
  const rechargeRevenue = await Recharge.aggregate([
    {
      $match: {
        rechargeDate: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $lookup: {
        from: 'memberships',
        localField: 'membership',
        foreignField: '_id',
        as: 'membershipInfo'
      }
    },
    {
      $unwind: '$membershipInfo'
    },
    {
      $group: {
        _id: "$membershipInfo.cardType",
        renewalAmount: { $sum: "$amount" }
      }
    }
  ]);
  
  // 合并数据
  const cardTypes = ['count', 'period', 'mixed', 'value'];
  const cardTypeLabels = {
    'count': '次卡',
    'period': '期限卡',
    'mixed': '混合卡',
    'value': '储值卡'
  };
  
  return cardTypes.map(cardType => {
    const newCard = newCardRevenue.find(item => item._id === cardType);
    const recharge = rechargeRevenue.find(item => item._id === cardType);
    
    return {
      cardType: cardTypeLabels[cardType] || cardType,
      newCardAmount: newCard ? newCard.newCardAmount : 0,
      renewalAmount: recharge ? recharge.renewalAmount : 0
    };
  });
}

/**
 * 获取推拿师绩效数据
 * @param {Date} startDate 开始日期
 * @param {Date} endDate 结束日期
 * @returns {Promise<Array>} 推拿师绩效数据
 */
async function getTherapistPerformanceData(startDate, endDate) {
  // 获取当前时段推拿师绩效
  const therapistStats = await Service.aggregate([
    {
      $match: {
        serviceDate: { $gte: startDate, $lte: endDate },
        therapist: { $ne: null, $ne: "" }
      }
    },
    {
      $group: {
        _id: "$therapist",
        serviceCount: { $sum: 1 },
        revenue: { $sum: "$serviceFee" },
        totalHours: { $sum: "$duration" },
        totalRating: { $sum: "$rating" },
        ratingCount: { 
          $sum: { 
            $cond: [
              { $and: [
                { $ne: ["$rating", null] },
                { $ne: ["$rating", undefined] },
                { $gt: ["$rating", 0] }
              ]},
              1,
              0
            ]
          }
        },
        goodRatings: { 
          $sum: { 
            $cond: [{ $gte: ["$rating", 4] }, 1, 0]
          }
        }
      }
    }
  ]);
  
  // 获取上一时段推拿师绩效（用于计算环比）
  const prevPeriod = getPreviousPeriod(startDate, endDate);
  const prevTherapistStats = await Service.aggregate([
    {
      $match: {
        serviceDate: { $gte: prevPeriod.startDate, $lte: prevPeriod.endDate },
        therapist: { $ne: null, $ne: "" }
      }
    },
    {
      $group: {
        _id: "$therapist",
        serviceCount: { $sum: 1 }
      }
    }
  ]);
  
  // 处理数据
  return therapistStats.map(therapist => {
    const prevStats = prevTherapistStats.find(prev => prev._id === therapist._id);
    const prevCount = prevStats ? prevStats.serviceCount : 0;
    
    // 计算环比增长率
    const growthRate = prevCount > 0 
      ? Math.round(((therapist.serviceCount - prevCount) / prevCount) * 100)
      : 100;
    
    // 计算平均评分
    const avgRating = therapist.ratingCount > 0 
      ? therapist.totalRating / therapist.ratingCount 
      : 0;
    
    // 计算好评率
    const satisfactionRate = therapist.ratingCount > 0 
      ? Math.round((therapist.goodRatings / therapist.ratingCount) * 100)
      : 0;
    
    // 计算服务时长（小时）
    const serviceHours = therapist.totalHours ? therapist.totalHours / 60 : 0;
    
    return {
      _id: therapist._id, // 使用真实的医师ID
      name: therapist._id, // 暂时使用ID作为名称，前端会处理
      serviceCount: therapist.serviceCount,
      serviceHours,
      revenue: therapist.revenue,
      avgRating,
      satisfactionRate,
      growthRate
    };
  }).sort((a, b) => b.serviceCount - a.serviceCount); // 按服务人次降序排序
}

/**
 * 获取客户活跃度数据
 * @param {Date} startDate 开始日期
 * @param {Date} endDate 结束日期
 * @returns {Promise<Array>} 客户活跃度数据
 */
async function getCustomerActivityData(startDate, endDate) {
  // 获取时间段内各客户的服务次数
  const customerVisits = await Service.aggregate([
    {
      $match: {
        serviceDate: { $gte: startDate, $lte: endDate },
        customer: { $ne: null }
      }
    },
    {
      $group: {
        _id: "$customer",
        visitCount: { $sum: 1 }
      }
    }
  ]);
  
  // 定义活跃度区间
  const frequencyRanges = [
    { min: 1, max: 1, label: '1次' },
    { min: 2, max: 3, label: '2-3次' },
    { min: 4, max: 5, label: '4-5次' },
    { min: 6, max: 10, label: '6-10次' },
    { min: 11, max: Number.MAX_SAFE_INTEGER, label: '10次以上' }
  ];
  
  // 统计每个区间的客户数量
  const activityData = frequencyRanges.map(range => {
    const customerCount = customerVisits.filter(
      customer => customer.visitCount >= range.min && customer.visitCount <= range.max
    ).length;
    
    return {
      frequencyRange: range.label,
      customerCount
    };
  });
  
  return activityData;
}

/**
 * 获取客户体质分布数据
 * @returns {Promise<Array>} 客户体质分布数据
 */
async function getCustomerConstitutionData() {
  // 假设客户体质存储在客户模型的constitution字段
  const constitutionDistribution = await Customer.aggregate([
    {
      $match: {
        constitution: { $ne: null, $ne: "" }
      }
    },
    {
      $group: {
        _id: "$constitution",
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
  
  // 将MongoDB结果转换为前端需要的格式
  return constitutionDistribution.map(item => ({
    constitutionType: item._id,
    count: item.count
  }));
}

/**
 * 获取未到店客户数据
 * @param {number} days 天数阈值
 * @returns {Promise<Array>} 未到店客户数据
 */
async function getInactiveCustomersData(days) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  // 获取最后一次到店时间早于cutoffDate的客户
  const inactiveCustomers = await Service.aggregate([
    {
      $match: {
        customer: { $ne: null }
      }
    },
    {
      $sort: { serviceDate: -1 }
    },
    {
      $group: {
        _id: "$customer",
        lastVisitDate: { $first: "$serviceDate" }
      }
    },
    {
      $match: {
        lastVisitDate: { $lte: cutoffDate }
      }
    },
    {
      $lookup: {
        from: 'customers',
        localField: '_id',
        foreignField: '_id',
        as: 'customerInfo'
      }
    },
    {
      $unwind: '$customerInfo'
    },
    {
      $sort: { lastVisitDate: 1 }
    },
    {
      $limit: 10 // 仅返回前10个最长时间未到店的客户
    }
  ]);
  
  // 计算未到店天数和获取会员卡状态
  const today = new Date();
  const customersWithDetails = await Promise.all(inactiveCustomers.map(async (customer) => {
    // 计算未到店天数
    const inactiveDays = Math.floor((today - customer.lastVisitDate) / (1000 * 60 * 60 * 24));
    
    // 获取客户会员卡状态
    const membership = await Membership.findOne({ 
      customer: customer._id,
      status: { $ne: 'cancelled' }
    }).sort({ expiryDate: -1 });
    
    let membershipStatus = 'none';
    if (membership) {
      if (membership.status === 'active') {
        const expiryDate = new Date(membership.expiryDate);
        const today = new Date();
        const diffDays = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 30 && diffDays > 0) {
          membershipStatus = 'expiring';
        } else if (diffDays <= 0) {
          membershipStatus = 'expired';
        } else {
          membershipStatus = 'active';
        }
      } else {
        membershipStatus = membership.status;
      }
    }
    
    return {
      id: customer._id,
      childName: customer.customerInfo.childName,
      childAge: customer.customerInfo.childAge,
      parentName: customer.customerInfo.parentName,
      phone: customer.customerInfo.phone,
      lastVisitDate: customer.lastVisitDate,
      inactiveDays,
      membershipStatus
    };
  }));
  
  return customersWithDetails;
} 