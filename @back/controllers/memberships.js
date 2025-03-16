const Membership = require('../models/Membership');
const Customer = require('../models/Customer');
const Recharge = require('../models/Recharge');
const Consumption = require('../models/Consumption');
const mongoose = require('mongoose');

/**
 * @desc 获取所有会员卡
 * @route GET /api/memberships
 * @access 公开
 */
exports.getMemberships = async (req, res) => {
  try {
    // 查询参数处理
    const { 
      cardNumber, 
      cardType, 
      status, 
      customerId, 
      expired = false, 
      limit = 50, 
      page = 1 
    } = req.query;
    
    // 构建查询条件
    let query = {};
    
    // 按卡号筛选
    if (cardNumber) {
      query.cardNumber = { $regex: cardNumber, $options: 'i' };
    }
    
    // 按卡类型筛选
    if (cardType) {
      query.cardType = cardType;
    }
    
    // 按状态筛选
    if (status) {
      query.status = status;
    }
    
    // 按客户ID筛选
    if (customerId) {
      query.customer = customerId;
    }
    
    // 按过期状态筛选
    if (expired === 'true') {
      query.expiryDate = { $lt: new Date() };
    } else if (expired === 'false') {
      query.expiryDate = { $gte: new Date() };
    }
    
    // 计算分页参数
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // 查询会员卡
    const memberships = await Membership.find(query)
      .populate('customer', 'childName childAge childGender parentName phone')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // 计算总记录数
    const total = await Membership.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: memberships.length,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      },
      data: memberships
    });
  } catch (error) {
    console.error('获取会员卡列表出错:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，无法获取会员卡列表'
    });
  }
};

/**
 * @desc 获取会员卡统计数据
 * @route GET /api/memberships/stats
 * @access 公开
 */
exports.getMembershipStats = async (req, res) => {
  try {
    // 统计会员卡总数
    const totalCount = await Membership.countDocuments();
    
    // 统计有效会员卡数量
    const activeCount = await Membership.countDocuments({
      status: 'active',
      expiryDate: { $gte: new Date() }
    });
    
    // 计算30天内即将过期的会员卡
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
    
    const expiringCount = await Membership.countDocuments({
      status: 'active',
      expiryDate: { 
        $gte: new Date(),
        $lte: thirtyDaysLater
      }
    });
    
    // 统计已过期会员卡数量
    const expiredCount = await Membership.countDocuments({
      expiryDate: { $lt: new Date() }
    });
    
    // 统计各类型会员卡分布
    const cardTypeDistribution = await Membership.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: "$cardType", count: { $sum: 1 } } }
    ]);
    
    // 计算本月新办卡数量
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const newCardThisMonth = await Membership.countDocuments({
      issueDate: { $gte: startOfMonth }
    });
    
    // 获取最近6个月的办卡趋势数据
    const monthlyTrends = [];
    const now = new Date();
    
    // 计算最近6个月的起始日期
    for (let i = 5; i >= 0; i--) {
      // 计算月份的第一天
      const startOfMonth = new Date(now.getFullYear(), now.getMonth() - i, 1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      // 计算月份的最后一天
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      endOfMonth.setHours(23, 59, 59, 999);
      
      // 统计该月每种卡类型的新增数量
      const monthlyStats = await Membership.aggregate([
        { 
          $match: { 
            issueDate: { 
              $gte: startOfMonth, 
              $lte: endOfMonth 
            } 
          } 
        },
        { 
          $group: { 
            _id: "$cardType", 
            count: { $sum: 1 } 
          } 
        }
      ]);
      
      // 准备该月的统计数据
      const monthData = {
        month: `${startOfMonth.getFullYear()}年${startOfMonth.getMonth() + 1}月`,
        startDate: startOfMonth,
        endDate: endOfMonth,
        cardTypes: {
          count: 0,
          period: 0,
          mixed: 0,
          value: 0
        }
      };
      
      // 填充卡类型数量
      monthlyStats.forEach(stat => {
        if (stat._id && monthData.cardTypes.hasOwnProperty(stat._id)) {
          monthData.cardTypes[stat._id] = stat.count;
        }
      });
      
      monthlyTrends.push(monthData);
    }
    
    // 获取即将过期的会员卡列表
    const expiringCards = await Membership.find({
      status: 'active',
      expiryDate: { 
        $gte: new Date(),
        $lte: thirtyDaysLater
      }
    })
    .populate('customer', 'childName parentName phone')
    .sort({ expiryDate: 1 })
    .limit(5);
    
    // 获取余额不足的会员卡列表
    const lowBalanceCards = await Membership.find({
      status: 'active',
      cardType: { $in: ['count', 'mixed'] },
      count: { $lte: 5, $gt: 0 }
    })
    .populate('customer', 'childName parentName phone')
    .sort({ count: 1 })
    .limit(5);
    
    res.status(200).json({
      success: true,
      data: {
        totalCount,
        activeCount,
        expiringCount,
        expiredCount,
        cardTypeDistribution,
        newCardThisMonth,
        monthlyTrends,
        expiringCards,
        lowBalanceCards
      }
    });
  } catch (error) {
    console.error('获取会员卡统计数据出错:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，无法获取会员卡统计数据'
    });
  }
};

/**
 * @desc 获取客户的所有会员卡
 * @route GET /api/memberships/customer/:customerId
 * @access 公开
 */
exports.getCustomerMemberships = async (req, res) => {
  try {
    const customerId = req.params.customerId;
    
    // 验证客户是否存在
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: '找不到该客户'
      });
    }
    
    // 获取客户的所有会员卡
    const memberships = await Membership.find({ customer: customerId })
      .sort({ issueDate: -1 });
    
    res.status(200).json({
      success: true,
      count: memberships.length,
      data: memberships
    });
    
  } catch (error) {
    console.error('获取客户会员卡出错:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，无法获取客户会员卡'
    });
  }
};

/**
 * @desc 获取单个会员卡详情
 * @route GET /api/memberships/:id
 * @access 公开
 */
exports.getMembershipById = async (req, res) => {
  try {
    const membership = await Membership.findById(req.params.id)
      .populate('customer', 'childName childAge childGender parentName phone');
    
    if (!membership) {
      return res.status(404).json({
        success: false,
        message: '找不到该会员卡'
      });
    }
    
    res.status(200).json({
      success: true,
      data: membership
    });
    
  } catch (error) {
    console.error('获取会员卡详情出错:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，无法获取会员卡详情'
    });
  }
};

/**
 * @desc 创建会员卡
 * @route POST /api/memberships
 * @access 公开
 */
exports.createMembership = async (req, res) => {
  try {
    console.log('收到创建会员卡请求:', JSON.stringify(req.body, null, 2));
    
    // 验证必填字段
    if (!req.body.customer || !req.body.cardType) {
      return res.status(400).json({
        success: false,
        message: '缺少必要字段：客户ID和卡类型为必填项'
      });
    }
    
    // 检查客户是否存在
    const customerId = req.body.customer;
    const customer = await Customer.findById(customerId);
    
    if (!customer) {
      return res.status(400).json({
        success: false,
        message: '客户不存在，无法创建会员卡'
      });
    }
    
    // 生成会员卡号
    const cardNumber = await Membership.generateCardNumber();
    
    // 创建会员卡基础数据
    const membershipData = {
      ...req.body,
      cardNumber
    };
    
    // 处理会员卡类型关联
    if (req.body.membershipTypeId) {
      membershipData.membershipType = req.body.membershipTypeId;
    }
    
    const membership = await Membership.create(membershipData);
    
    // 如果有充值金额，创建充值记录
    if (req.body.initialAmount && parseFloat(req.body.initialAmount) > 0) {
      // 生成收据编号
      const receiptNumber = await Recharge.generateReceiptNumber();
      
      // 创建充值记录
      await Recharge.create({
        membership: membership._id,
        customer: customerId,
        amount: parseFloat(req.body.initialAmount),
        bonusAmount: parseFloat(req.body.bonusAmount || 0),
        paymentMethod: req.body.paymentMethod || 'cash',
        receiptNumber,
        notes: `会员卡初始充值 ${req.body.initialAmount} 元`,
        rechargeDate: new Date()
      });
      
      // 更新会员卡余额
      membership.balance = parseFloat(req.body.initialAmount) + parseFloat(req.body.bonusAmount || 0);
      membership.lastRechargeDate = new Date();
      await membership.save();
    }
    
    // 更新客户的会员状态
    customer.membershipStatus = 'active';
    await customer.save();
    
    res.status(201).json({
      success: true,
      data: membership
    });
    
  } catch (error) {
    console.error('创建会员卡出错:', error);
    
    // 处理验证错误
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: '服务器错误，无法创建会员卡'
    });
  }
};

/**
 * @desc 获取会员卡消费记录
 * @route GET /api/memberships/:id/consumption
 * @access 公开
 */
exports.getConsumptionHistory = async (req, res) => {
  try {
    const membershipId = req.params.id;
    
    // 获取分页参数
    const { page = 1, limit = 10, startDate, endDate, debug } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // 验证会员卡是否存在
    const membership = await Membership.findById(membershipId);
    
    if (!membership) {
      return res.status(404).json({
        success: false,
        message: '找不到该会员卡'
      });
    }
    
    // 构建查询条件
    let query = { membership: membershipId };
    
    // 如果有日期范围参数
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (startDate) {
      query.date = { $gte: new Date(startDate) };
    } else if (endDate) {
      query.date = { $lte: new Date(endDate) };
    }
    
    if (debug) {
      console.log('消费记录查询条件:', JSON.stringify(query));
    }
    
    // 查询消费记录总数
    const total = await Consumption.countDocuments(query);
    
    // 查询消费记录
    const records = await Consumption.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    if (debug) {
      console.log('消费记录数量:', records.length);
      console.log('消费记录示例:', records.length > 0 ? JSON.stringify(records[0]) : '无记录');
    }
    
    // 手动计算总金额和总次数
    let totalAmount = 0;
    let totalCount = 0;
    
    for (const record of records) {
      totalAmount += record.amount || 0;
      totalCount += record.count || 0;
    }
    
    // 如果需要计算所有记录（不仅仅是当前页的）
    if (total > records.length) {
      const allRecords = await Consumption.find(query);
      totalAmount = 0;
      totalCount = 0;
      
      for (const record of allRecords) {
        totalAmount += record.amount || 0;
        totalCount += record.count || 0;
      }
    }
    
    res.status(200).json({
      success: true,
      count: records.length,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      },
      data: {
        records,
        summary: {
          totalAmount,
          totalCount
        }
      },
      debug: debug ? { query, totalRecords: total } : undefined
    });
  } catch (error) {
    console.error('获取会员卡消费记录出错:', error);
    
    res.status(500).json({
      success: false,
      message: '服务器错误，无法获取会员卡消费记录'
    });
  }
};

/**
 * @desc 获取会员卡充值记录
 * @route GET /api/memberships/:id/recharge
 * @access 公开
 */
exports.getRechargeHistory = async (req, res) => {
  try {
    const membershipId = req.params.id;
    
    // 获取分页参数
    const { page = 1, limit = 10, startDate, endDate } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // 验证会员卡是否存在
    const membership = await Membership.findById(membershipId);
    
    if (!membership) {
      return res.status(404).json({
        success: false,
        message: '找不到该会员卡'
      });
    }
    
    // 构建查询条件
    let query = { membership: membershipId };
    
    // 如果有日期范围参数
    if (startDate && endDate) {
      query.rechargeDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (startDate) {
      query.rechargeDate = { $gte: new Date(startDate) };
    } else if (endDate) {
      query.rechargeDate = { $lte: new Date(endDate) };
    }
    
    // 查询充值记录总数
    const total = await Recharge.countDocuments(query);
    
    // 查询充值记录
    const recharges = await Recharge.find(query)
      .sort({ rechargeDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // 计算总金额和总次数
    let totalAmount = 0;
    let totalCount = 0;
    let totalExtendMonths = 0;
    
    for (const recharge of recharges) {
      totalAmount += recharge.amount || 0;
      totalCount += recharge.rechargeCount || 0;
      totalExtendMonths += recharge.extendMonths || 0;
    }
    
    // 如果需要计算所有记录（不仅仅是当前页的）
    if (total > recharges.length) {
      const allRecharges = await Recharge.find(query);
      totalAmount = 0;
      totalCount = 0;
      totalExtendMonths = 0;
      
      for (const recharge of allRecharges) {
        totalAmount += recharge.amount || 0;
        totalCount += recharge.rechargeCount || 0;
        totalExtendMonths += recharge.extendMonths || 0;
      }
    }
    
    // 格式化充值记录，匹配前端需要的格式
    const formattedRecharges = recharges.map(recharge => {
      return {
        id: recharge._id,
        date: recharge.rechargeDate,
        amount: recharge.amount,
        count: recharge.rechargeCount || 0,
        extendDuration: recharge.extendMonths || 0,
        operatorName: recharge.operator || '系统',
        paymentMethod: getPaymentMethodText(recharge.paymentMethod),
        notes: recharge.notes || ''
      };
    });
    
    res.status(200).json({
      success: true,
      count: formattedRecharges.length,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      },
      data: {
        records: formattedRecharges,
        summary: {
          totalAmount,
          totalCount,
          totalExtendMonths
        }
      }
    });
  } catch (error) {
    console.error('获取会员卡充值记录出错:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，无法获取会员卡充值记录'
    });
  }
};

/**
 * 获取支付方式的中文显示
 */
function getPaymentMethodText(method) {
  const methodMap = {
    'cash': '现金',
    'wechat': '微信支付',
    'alipay': '支付宝',
    'card': '银行卡',
    'other': '其他'
  };
  return methodMap[method] || method;
}

/**
 * @desc 会员卡充值
 * @route POST /api/memberships/:id/recharge
 * @access 公开
 */
exports.rechargeMembership = async (req, res) => {
  try {
    console.log('收到会员卡充值请求:', JSON.stringify(req.body, null, 2));
    
    // 查找会员卡
    const membership = await Membership.findById(req.params.id);
    
    if (!membership) {
      return res.status(404).json({
        success: false,
        message: '找不到该会员卡'
      });
    }
    
    // 检查会员卡状态
    if (membership.status !== 'active' && membership.status !== 'expired') {
      return res.status(400).json({
        success: false,
        message: `无法为${membership.status === 'cancelled' ? '已作废' : '已冻结'}的会员卡充值`
      });
    }
    
    // 获取充值类型和对应数据
    const { rechargeType, count, amount, extendMonths, totalAmount, paymentMethod, notes, operatorName } = req.body;
    
    // 验证必填字段
    if (!rechargeType) {
      return res.status(400).json({
        success: false,
        message: '充值类型不能为空'
      });
    }
    
    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message: '支付方式不能为空'
      });
    }
    
    if (!totalAmount || totalAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: '充值总金额必须大于0'
      });
    }
    
    // 生成收据编号
    const receiptNumber = await Recharge.generateReceiptNumber();
    
    // 创建充值记录
    const recharge = await Recharge.create({
      membership: membership._id,
      customer: membership.customer,
      amount: totalAmount,
      rechargeCount: count || 0,
      extendMonths: extendMonths || 0,
      paymentMethod: paymentMethod,
      operator: operatorName,
      receiptNumber,
      notes: notes,
      rechargeDate: new Date()
    });
    
    // 更新会员卡
    switch (rechargeType) {
      case 'count':
        // 更新剩余次数
        if (count > 0) {
          membership.count = (membership.count || 0) + parseInt(count);
        }
        break;
      case 'amount':
        // 更新剩余金额 - 对于储值卡，直接使用totalAmount
        if (membership.cardType === 'value') {
          membership.balance = (membership.balance || 0) + parseFloat(totalAmount);
        } else if (amount > 0) {
          // 对于其他类型卡，使用amount参数
          membership.balance = (membership.balance || 0) + parseFloat(amount);
        }
        break;
      case 'extend':
        // 更新有效期
        if (extendMonths > 0) {
          // 使用原到期日期或当前日期（如果已过期）
          const baseDate = membership.expiryDate > new Date() ? membership.expiryDate : new Date();
          
          // 延长有效期
          membership.expiryDate = new Date(baseDate);
          membership.expiryDate.setMonth(membership.expiryDate.getMonth() + parseInt(extendMonths));
        }
        break;
      case 'mixed':
        // 综合充值
        if (count > 0) {
          membership.count = (membership.count || 0) + parseInt(count);
        }
        if (amount > 0) {
          membership.balance = (membership.balance || 0) + parseFloat(amount);
        } else if (membership.cardType === 'value' && totalAmount > 0) {
          // 对于储值卡，如果没有指定amount，则使用totalAmount
          membership.balance = (membership.balance || 0) + parseFloat(totalAmount);
        }
        if (extendMonths > 0) {
          // 使用原到期日期或当前日期（如果已过期）
          const baseDate = membership.expiryDate > new Date() ? membership.expiryDate : new Date();
          
          // 延长有效期
          membership.expiryDate = new Date(baseDate);
          membership.expiryDate.setMonth(membership.expiryDate.getMonth() + parseInt(extendMonths));
        }
        break;
      default:
        // 默认情况下，如果是储值卡，直接增加余额
        if (membership.cardType === 'value') {
          membership.balance = (membership.balance || 0) + parseFloat(totalAmount);
        }
    }
    
    // 更新最后充值日期
    membership.lastRechargeDate = new Date();
    
    // 如果会员卡已过期但有了新的有效期，重新激活
    if (membership.status === 'expired' && membership.expiryDate > new Date()) {
      membership.status = 'active';
    }
    
    await membership.save();
    
    res.status(200).json({
      success: true,
      data: {
        membership,
        recharge
      }
    });
    
  } catch (error) {
    console.error('会员卡充值出错:', error);
    
    // 处理验证错误
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: '服务器错误，会员卡充值失败'
    });
  }
};

/**
 * @desc 获取会员卡充值记录
 * @route GET /api/memberships/:id/recharge-history
 * @access 公开
 */
exports.getMembershipRechargeHistory = async (req, res) => {
  try {
    const membershipId = req.params.id;
    
    // 查找会员卡
    const membership = await Membership.findById(membershipId);
    
    if (!membership) {
      return res.status(404).json({
        success: false,
        message: '找不到该会员卡'
      });
    }
    
    // 获取充值记录
    const recharges = await Recharge.find({ membership: membershipId })
      .sort({ rechargeDate: -1 });
    
    res.status(200).json({
      success: true,
      count: recharges.length,
      data: recharges
    });
    
  } catch (error) {
    console.error('获取会员卡充值记录出错:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，无法获取会员卡充值记录'
    });
  }
};

/**
 * @desc 更新会员卡信息
 * @route PUT /api/memberships/:id
 * @access 公开
 */
exports.updateMembership = async (req, res) => {
  try {
    console.log('收到更新会员卡请求:', JSON.stringify(req.body, null, 2));
    
    // 查找会员卡
    let membership = await Membership.findById(req.params.id);
    
    if (!membership) {
      return res.status(404).json({
        success: false,
        message: '找不到该会员卡'
      });
    }
    
    // 更新会员卡
    membership = await Membership.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.status(200).json({
      success: true,
      data: membership
    });
    
  } catch (error) {
    console.error('更新会员卡出错:', error);
    
    // 处理验证错误
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: '服务器错误，无法更新会员卡'
    });
  }
};

/**
 * @desc 更改会员卡状态
 * @route PATCH /api/memberships/:id/status
 * @access 公开
 */
exports.updateMembershipStatus = async (req, res) => {
  try {
    const { status, reason } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: '缺少状态参数'
      });
    }
    
    // 验证状态是否有效
    const validStatuses = ['active', 'expired', 'cancelled', 'frozen', 'lost'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: '无效的状态值'
      });
    }
    
    // 查找会员卡
    let membership = await Membership.findById(req.params.id);
    
    if (!membership) {
      return res.status(404).json({
        success: false,
        message: '找不到该会员卡'
      });
    }
    
    // 更新状态
    membership.status = status;
    
    // 添加备注
    if (reason) {
      const statusChanges = membership.notes ? `${membership.notes}\n` : '';
      membership.notes = `${statusChanges}[${new Date().toLocaleString()}] 状态变更为"${status}"，原因：${reason}`;
    }
    
    await membership.save();
    
    res.status(200).json({
      success: true,
      data: membership
    });
    
  } catch (error) {
    console.error('更新会员卡状态出错:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，无法更新会员卡状态'
    });
  }
};

/**
 * @desc 删除会员卡
 * @route DELETE /api/memberships/:id
 * @access 公开
 */
exports.deleteMembership = async (req, res) => {
  try {
    const membership = await Membership.findById(req.params.id);
    
    if (!membership) {
      return res.status(404).json({
        success: false,
        message: '找不到该会员卡'
      });
    }
    
    // 删除会员卡 - 使用deleteOne替代已弃用的remove方法
    await Membership.deleteOne({ _id: membership._id });
    
    res.status(200).json({
      success: true,
      data: {}
    });
    
  } catch (error) {
    console.error('删除会员卡出错:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，无法删除会员卡'
    });
  }
};

/**
 * @desc 记录会员卡消费
 * @route POST /api/memberships/:id/consumption
 * @access 公开
 */
exports.recordConsumption = async (req, res) => {
  try {
    const membershipId = req.params.id;
    
    // 验证会员卡是否存在
    const membership = await Membership.findById(membershipId)
      .populate('customer', 'childName parentName');
    
    if (!membership) {
      return res.status(404).json({
        success: false,
        message: '找不到该会员卡'
      });
    }
    
    // 检查会员卡状态
    if (membership.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: `无法为${membership.status === 'expired' ? '已过期' : membership.status === 'cancelled' ? '已作废' : '已冻结'}的会员卡记录消费`
      });
    }
    
    // 获取请求数据
    const { 
      serviceName, 
      amount, 
      count, 
      therapistName, 
      notes, 
      operatorName, 
      date = new Date() 
    } = req.body;
    
    // 验证必填字段
    if (!serviceName) {
      return res.status(400).json({
        success: false,
        message: '服务名称不能为空'
      });
    }
    
    if (!amount && amount !== 0) {
      return res.status(400).json({
        success: false,
        message: '消费金额不能为空'
      });
    }
    
    if (!count || count <= 0) {
      return res.status(400).json({
        success: false,
        message: '消费次数必须大于0'
      });
    }
    
    // 检查次卡次数是否足够
    if (membership.cardType === 'count' && membership.count < count) {
      return res.status(400).json({
        success: false,
        message: '会员卡剩余次数不足'
      });
    }
    
    // 检查储值卡余额是否足够
    if (membership.cardType === 'value' && membership.balance < amount) {
      return res.status(400).json({
        success: false,
        message: '会员卡余额不足'
      });
    }
    
    // 生成消费记录编号
    const receiptNumber = await Consumption.generateReceiptNumber();
    
    // 创建消费记录
    const consumption = await Consumption.create({
      membership: membershipId,
      serviceName,
      amount,
      count,
      date,
      therapistName,
      customer: membership.customer._id,
      childName: membership.customer.childName,
      notes,
      operator: operatorName,
      receiptNumber
    });
    
    // 更新会员卡
    if (membership.cardType === 'count' || membership.cardType === 'mixed') {
      membership.count -= count;
    }
    
    if (membership.cardType === 'value' || membership.cardType === 'mixed') {
      membership.balance -= amount;
    }
    
    // 更新最后使用日期
    membership.lastConsumeDate = date;
    
    // 如果次数用完，更新状态
    if (membership.cardType === 'count' && membership.count <= 0) {
      membership.status = 'depleted';
    }
    
    await membership.save();
    
    res.status(200).json({
      success: true,
      data: {
        consumption,
        membership
      }
    });
  } catch (error) {
    console.error('记录会员卡消费出错:', error);
    
    // 处理验证错误
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: '服务器错误，无法记录会员卡消费'
    });
  }
}; 