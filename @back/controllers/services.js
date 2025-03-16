const Service = require('../models/Service');
const Customer = require('../models/Customer');
const Membership = require('../models/Membership');
const mongoose = require('mongoose');

/**
 * @desc 获取所有服务记录
 * @route GET /api/services
 * @access 公开
 */
exports.getServices = async (req, res) => {
  try {
    // 查询参数处理
    const { startDate, endDate, serviceType, therapist, limit = 50, page = 1 } = req.query;
    
    // 构建查询条件
    let query = {};
    
    // 按日期范围筛选
    if (startDate && endDate) {
      query.serviceDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (startDate) {
      query.serviceDate = { $gte: new Date(startDate) };
    } else if (endDate) {
      query.serviceDate = { $lte: new Date(endDate) };
    }
    
    // 按服务类型筛选
    if (serviceType) {
      query.serviceType = serviceType;
    }
    
    // 按推拿师筛选
    if (therapist) {
      query.therapist = therapist;
    }
    
    // 计算分页参数
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // 查询服务记录并关联客户信息
    const services = await Service.find(query)
      .populate('customer', 'childName childAge childGender')
      .populate('therapist', 'name title')
      .sort({ serviceDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // 计算总记录数
    const total = await Service.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: services.length,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      },
      data: services
    });
  } catch (error) {
    console.error('获取服务记录出错:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，无法获取服务记录'
    });
  }
};

/**
 * @desc 获取服务统计数据
 * @route GET /api/services/stats
 * @access 公开
 */
exports.getServiceStats = async (req, res) => {
  try {
    // 获取今天的日期范围
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // 获取本月的日期范围
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    // 获取上月的日期范围
    const firstDayOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastDayOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    
    // 查询今日服务数据
    const todayServices = await Service.find({
      serviceDate: { $gte: today, $lt: tomorrow }
    });
    
    // 计算今日收入总额
    let todayIncome = 0;
    
    // 详细记录每个服务项目及其费用
    console.log(`===== 今日服务收入计算 ${today.toISOString().split('T')[0]} =====`);
    console.log(`共找到 ${todayServices.length} 条今日服务记录`);
    
    todayServices.forEach(service => {
      const serviceFee = Number(service.serviceFee) || 0;
      console.log(`服务ID: ${service._id}, 类型: ${service.serviceType}, 费用: ${serviceFee}`);
      todayIncome += serviceFee;
    });
    
    console.log(`今日服务收入总计: ${todayIncome}`);
    
    // 查询本月服务数据
    const monthServices = await Service.find({
      serviceDate: { $gte: firstDayOfMonth, $lte: lastDayOfMonth }
    });
    
    // 查询上月服务数据
    const lastMonthServices = await Service.find({
      serviceDate: { $gte: firstDayOfLastMonth, $lte: lastDayOfLastMonth }
    });
    
    // 计算环比增长率
    const lastMonthCount = lastMonthServices.length;
    const monthCount = monthServices.length;
    const growthRate = lastMonthCount > 0 
      ? ((monthCount - lastMonthCount) / lastMonthCount * 100).toFixed(1)
      : 100;
    
    // 获取服务类型分布
    const serviceTypes = await Service.aggregate([
      { $match: { serviceDate: { $gte: firstDayOfMonth, $lte: lastDayOfMonth } } },
      { $group: { _id: "$serviceType", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // 获取推拿师工作量
    const therapistWorkload = await Service.aggregate([
      { $match: { serviceDate: { $gte: firstDayOfMonth, $lte: lastDayOfMonth } } },
      { $lookup: { from: 'therapists', localField: 'therapist', foreignField: '_id', as: 'therapistInfo' } },
      { $unwind: { path: '$therapistInfo', preserveNullAndEmptyArrays: true } },
      { $group: { 
          _id: '$therapist', 
          count: { $sum: 1 },
          name: { $first: '$therapistInfo.name' },
          title: { $first: '$therapistInfo.title' }
        } 
      },
      { $sort: { count: -1 } }
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        today: {
          serviceCount: todayServices.length,
          income: todayIncome
        },
        month: {
          serviceCount: monthCount,
          growthRate
        },
        serviceTypes,
        therapistWorkload
      }
    });
    
  } catch (error) {
    console.error('获取服务统计数据出错:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，无法获取服务统计数据'
    });
  }
};

/**
 * @desc 获取单个客户的所有服务记录
 * @route GET /api/services/customer/:customerId
 * @access 公开
 */
exports.getServicesByCustomer = async (req, res) => {
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
    
    // 获取该客户的所有服务记录
    const services = await Service.find({ customer: customerId })
      .populate('therapist', 'name title')
      .sort({ serviceDate: -1 });
    
    res.status(200).json({
      success: true,
      count: services.length,
      data: services
    });
    
  } catch (error) {
    console.error('获取客户服务记录出错:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，无法获取客户服务记录'
    });
  }
};

/**
 * @desc 获取单个服务记录
 * @route GET /api/services/:id
 * @access 公开
 */
exports.getServiceById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id)
      .populate('customer', 'childName childAge childGender parentName phone')
      .populate('membership', 'cardNumber balance');
    
    if (!service) {
      return res.status(404).json({
        success: false,
        message: '找不到该服务记录'
      });
    }
    
    res.status(200).json({
      success: true,
      data: service
    });
    
  } catch (error) {
    console.error('获取服务记录详情出错:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，无法获取服务记录详情'
    });
  }
};

/**
 * @desc 创建服务记录
 * @route POST /api/services
 * @access 公开
 */
exports.createService = async (req, res) => {
  try {
    console.log('收到创建服务记录请求:', JSON.stringify(req.body, null, 2));
    
    // 验证必填字段
    if (!req.body.customer || !req.body.serviceType || !req.body.serviceFee) {
      console.error('缺少必要字段:', {
        customer: req.body.customer,
        serviceType: req.body.serviceType,
        serviceFee: req.body.serviceFee
      });
      return res.status(400).json({
        success: false,
        message: '缺少必要字段：客户ID、服务类型和服务费用为必填项'
      });
    }
    
    // 检查客户是否存在
    const customerId = req.body.customer;
    let customer;
    
    try {
      console.log('查找客户ID:', customerId);
      customer = await Customer.findById(customerId).lean();
      console.log('查找客户结果:', customer ? '找到客户' : '未找到客户');
    } catch (err) {
      console.error('查找客户出错:', err);
      return res.status(400).json({
        success: false,
        message: '无效的客户ID格式'
      });
    }
    
    if (!customer) {
      return res.status(400).json({
        success: false,
        message: '客户不存在，无法创建服务记录'
      });
    }
    
    // 检查会员卡（如果提供）
    if (req.body.membership && req.body.paymentMethod === 'membership') {
      let membership;
      
      try {
        console.log('查找会员卡ID:', req.body.membership);
        membership = await Membership.findById(req.body.membership).lean();
        console.log('查找会员卡结果:', membership ? '找到会员卡' : '未找到会员卡');
      } catch (err) {
        console.error('查找会员卡出错:', err);
        return res.status(400).json({
          success: false,
          message: '无效的会员卡ID'
        });
      }
      
      if (!membership) {
        return res.status(400).json({
          success: false,
          message: '会员卡不存在'
        });
      }
      
      // 如果使用会员卡支付，检查余额是否足够
      if (membership.balance < req.body.serviceFee) {
        return res.status(400).json({
          success: false,
          message: '会员卡余额不足'
        });
      }
      
      // 扣减会员卡余额
      try {
        await Membership.findByIdAndUpdate(
          req.body.membership,
          { $inc: { balance: -req.body.serviceFee } }
        );
        console.log(`已从会员卡 ${membership.cardNumber} 扣款 ${req.body.serviceFee} 元`);
      } catch (err) {
        console.error('扣减会员卡余额出错:', err);
        return res.status(500).json({
          success: false,
          message: '扣减会员卡余额失败'
        });
      }
    }
    
    // 处理日期格式
    let serviceData = { ...req.body };
    
    if (serviceData.serviceDate) {
      try {
        // 如果日期是字符串，尝试转换为Date对象
        if (typeof serviceData.serviceDate === 'string') {
          const parsedDate = new Date(serviceData.serviceDate);
          // 验证日期有效性
          if (isNaN(parsedDate.getTime())) {
            console.warn('无效的日期格式，使用当前日期', serviceData.serviceDate);
            serviceData.serviceDate = new Date();
          } else {
            serviceData.serviceDate = parsedDate;
          }
        }
      } catch (error) {
        console.error('日期转换错误，使用当前日期:', error);
        serviceData.serviceDate = new Date();
      }
    } else {
      // 如果未提供日期，使用当前日期
      serviceData.serviceDate = new Date();
    }
    
    // 确保服务费用是数字类型
    if (typeof serviceData.serviceFee === 'string') {
      serviceData.serviceFee = parseFloat(serviceData.serviceFee);
    }
    
    // 过滤掉undefined和null值
    serviceData = Object.fromEntries(
      Object.entries(serviceData).filter(([_, v]) => v !== undefined && v !== null)
    );
    
    console.log('准备创建服务记录:', JSON.stringify(serviceData, null, 2));
    
    // 创建服务记录
    try {
      // 如果有传入医师ID，验证其有效性
      if (serviceData.therapist) {
        try {
          console.log(`验证医师ID: ${serviceData.therapist}`);
          const therapist = await mongoose.model('Therapist').findById(serviceData.therapist);
          if (!therapist) {
            console.warn(`未找到医师: ${serviceData.therapist}`);
            return res.status(400).json({
              success: false,
              message: '选择的医师不存在'
            });
          }
          console.log(`找到医师: ${therapist.name} (ID: ${therapist._id})`);
        } catch (therapistErr) {
          console.error('验证医师ID出错:', therapistErr);
          return res.status(400).json({
            success: false,
            message: '无效的医师ID格式'
          });
        }
      }

      const service = await Service.create(serviceData);
      console.log('服务记录创建成功:', service._id.toString());
      console.log('关联的医师ID:', service.therapist || '无');
      
      res.status(201).json({
        success: true,
        data: service
      });
    } catch (createError) {
      console.error('MongoDB创建服务记录出错:', createError);
      throw createError; // 继续抛出以便在外部catch中处理
    }
    
  } catch (error) {
    console.error('创建服务记录出错:', error);
    console.error('错误类型:', error.name);
    console.error('错误消息:', error.message);
    console.error('错误堆栈:', error.stack);
    
    // 处理验证错误
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    // 处理MongoDB ID转换错误
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: `无效的${error.path}: ${error.value}`
      });
    }
    
    res.status(500).json({
      success: false,
      message: '服务器错误，无法创建服务记录',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * @desc 更新服务记录
 * @route PUT /api/services/:id
 * @access 公开
 */
exports.updateService = async (req, res) => {
  try {
    console.log('收到更新服务记录请求:', JSON.stringify(req.body, null, 2));
    
    // 检查并处理空的membership字段
    if (req.body.membership === '') {
      console.log('检测到空的membership字段，将其设置为null');
      req.body.membership = null;
    }
    
    // 查找服务记录
    let service = await Service.findById(req.params.id);
    
    if (!service) {
      return res.status(404).json({
        success: false,
        message: '找不到该服务记录'
      });
    }
    
    // 如果支付方式或金额变了，可能需要处理会员卡余额变化
    if (req.body.paymentMethod && req.body.serviceFee && 
        (service.paymentMethod !== req.body.paymentMethod || 
         service.serviceFee !== req.body.serviceFee)) {
      
      // 如果原支付方式是会员卡，需要退还原扣款
      if (service.paymentMethod === 'membership' && service.membership) {
        const originalMembership = await Membership.findById(service.membership);
        if (originalMembership) {
          originalMembership.balance += service.serviceFee;
          await originalMembership.save();
        }
      }
      
      // 如果新支付方式是会员卡，需要重新扣款
      if (req.body.paymentMethod === 'membership' && req.body.membership) {
        const newMembership = await Membership.findById(req.body.membership);
        if (!newMembership) {
          return res.status(400).json({
            success: false,
            message: '会员卡不存在'
          });
        }
        
        if (newMembership.balance < req.body.serviceFee) {
          return res.status(400).json({
            success: false,
            message: '会员卡余额不足'
          });
        }
        
        newMembership.balance -= req.body.serviceFee;
        await newMembership.save();
      }
    }
    
    // 清理数据对象，移除所有空字符串的字段，避免类型转换错误
    const updateData = {};
    for (const [key, value] of Object.entries(req.body)) {
      // 如果值不是空字符串，则保留
      if (value !== '') {
        updateData[key] = value;
      } else if (key === 'membership' || key === 'customer') {
        // 对于关联字段，空字符串应该设置为null
        updateData[key] = null;
      }
      // 其他空字符串的字段不添加到更新数据中
    }
    
    console.log('清理后的更新数据:', JSON.stringify(updateData, null, 2));
    
    // 更新服务记录
    service = await Service.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });
    
    console.log('服务记录更新成功:', service._id.toString());
    
    res.status(200).json({
      success: true,
      data: service
    });
    
  } catch (error) {
    console.error('更新服务记录出错:', error);
    console.error('错误类型:', error.name);
    console.error('错误消息:', error.message);
    console.error('错误堆栈:', error.stack);
    
    // 处理验证错误
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    // 处理MongoDB ID转换错误
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: `无效的${error.path}: ${error.value}`
      });
    }
    
    res.status(500).json({
      success: false,
      message: '服务器错误，无法更新服务记录',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * @desc 删除服务记录
 * @route DELETE /api/services/:id
 * @access 公开
 */
exports.deleteService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    
    if (!service) {
      return res.status(404).json({
        success: false,
        message: '找不到该服务记录'
      });
    }
    
    // 如果服务记录是通过会员卡支付的，删除时需要退还余额
    if (service.paymentMethod === 'membership' && service.membership) {
      const membership = await Membership.findById(service.membership);
      if (membership) {
        membership.balance += service.serviceFee;
        await membership.save();
      }
    }
    
    // 删除服务记录 - 使用deleteOne替代已弃用的remove方法
    await Service.deleteOne({ _id: service._id });
    
    res.status(200).json({
      success: true,
      data: {}
    });
    
  } catch (error) {
    console.error('删除服务记录出错:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，无法删除服务记录'
    });
  }
}; 