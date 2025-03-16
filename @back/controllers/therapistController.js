const Therapist = require('../models/Therapist');
const Service = require('../models/Service');
const mongoose = require('mongoose');

/**
 * @desc 获取所有医师
 * @route GET /api/therapists
 * @access 公开
 */
exports.getAllTherapists = async (req, res) => {
  try {
    const therapists = await Therapist.find().sort({ name: 1 });
    
    res.status(200).json({
      success: true,
      count: therapists.length,
      data: therapists
    });
  } catch (error) {
    console.error('获取医师列表失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，无法获取医师列表'
    });
  }
};

/**
 * @desc 获取单个医师信息
 * @route GET /api/therapists/:id
 * @access 公开
 */
exports.getTherapist = async (req, res) => {
  try {
    const therapist = await Therapist.findById(req.params.id);
    
    if (!therapist) {
      return res.status(404).json({
        success: false,
        message: '未找到该医师'
      });
    }
    
    res.status(200).json({
      success: true,
      data: therapist
    });
  } catch (error) {
    console.error('获取医师详情失败:', error);
    
    // 处理无效ID格式
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: '医师ID格式无效'
      });
    }
    
    res.status(500).json({
      success: false,
      message: '服务器错误，无法获取医师详情'
    });
  }
};

/**
 * @desc 创建新医师
 * @route POST /api/therapists
 * @access 公开
 */
exports.createTherapist = async (req, res) => {
  try {
    // 检查重复手机号
    const existingTherapist = await Therapist.findOne({ phone: req.body.phone });
    if (existingTherapist) {
      return res.status(400).json({
        success: false,
        message: '该手机号已被注册'
      });
    }
    
    const therapist = await Therapist.create(req.body);
    
    res.status(201).json({
      success: true,
      data: therapist
    });
  } catch (error) {
    console.error('创建医师失败:', error);
    
    // 处理验证错误
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: '服务器错误，无法创建医师'
    });
  }
};

/**
 * @desc 更新医师信息
 * @route PUT /api/therapists/:id
 * @access 公开
 */
exports.updateTherapist = async (req, res) => {
  try {
    // 如果更新了手机号，检查重复
    if (req.body.phone) {
      const existingTherapist = await Therapist.findOne({ 
        phone: req.body.phone,
        _id: { $ne: req.params.id }
      });
      
      if (existingTherapist) {
        return res.status(400).json({
          success: false,
          message: '该手机号已被其他医师使用'
        });
      }
    }
    
    const therapist = await Therapist.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!therapist) {
      return res.status(404).json({
        success: false,
        message: '未找到该医师'
      });
    }
    
    res.status(200).json({
      success: true,
      data: therapist
    });
  } catch (error) {
    console.error('更新医师失败:', error);
    
    // 处理验证错误
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    // 处理无效ID格式
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: '医师ID格式无效'
      });
    }
    
    res.status(500).json({
      success: false,
      message: '服务器错误，无法更新医师信息'
    });
  }
};

/**
 * @desc 删除医师
 * @route DELETE /api/therapists/:id
 * @access 公开
 */
exports.deleteTherapist = async (req, res) => {
  try {
    // 检查是否有关联的服务记录
    const relatedServices = await Service.find({ therapist: req.params.id });
    if (relatedServices.length > 0) {
      // 不真正删除，而是标记为非活跃
      const therapist = await Therapist.findByIdAndUpdate(
        req.params.id,
        { isActive: false },
        { new: true }
      );
      
      if (!therapist) {
        return res.status(404).json({
          success: false,
          message: '未找到该医师'
        });
      }
      
      return res.status(200).json({
        success: true,
        message: '该医师已关联服务记录，已标记为非活跃状态',
        data: therapist
      });
    }
    
    // 如果没有关联记录，执行真正的删除
    const therapist = await Therapist.findByIdAndDelete(req.params.id);
    
    if (!therapist) {
      return res.status(404).json({
        success: false,
        message: '未找到该医师'
      });
    }
    
    res.status(200).json({
      success: true,
      message: '医师已成功删除',
      data: {}
    });
  } catch (error) {
    console.error('删除医师失败:', error);
    
    // 处理无效ID格式
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: '医师ID格式无效'
      });
    }
    
    res.status(500).json({
      success: false,
      message: '服务器错误，无法删除医师'
    });
  }
};

/**
 * @desc 获取医师统计数据
 * @route GET /api/therapists/:id/stats
 * @access 公开
 */
exports.getTherapistStats = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`尝试获取医师(ID: ${id})的统计数据`);

    // 验证ID是否是有效的MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.warn(`无效的医师ID格式: ${id}`);
      return res.status(400).json({
        success: false,
        message: '无效的医师ID格式'
      });
    }

    // 检查医师是否存在
    const therapist = await Therapist.findById(id);
    if (!therapist) {
      console.warn(`未找到医师(ID: ${id})`);
      return res.status(404).json({
        success: false,
        message: '未找到该医师'
      });
    }
    console.log(`找到医师: ${therapist.name}`);

    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1); // 默认获取最近1个月的数据
    
    // 转换医师ID为ObjectId，确保匹配正确
    const therapistId = new mongoose.Types.ObjectId(id);
    console.log(`正在获取医师(${therapist.name}, ID: ${id})的统计数据，时间范围: ${startDate.toISOString()} 至 ${endDate.toISOString()}`);
    
    try {
      // 获取服务记录相关数据
      const serviceStats = await Service.aggregate([
        {
          $match: {
            therapist: therapistId,
            serviceDate: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            totalServices: { $sum: 1 },
            totalRevenue: { $sum: "$serviceFee" },
            totalHours: { $sum: "$duration" },
            ratingSum: { $sum: "$rating" },
            ratingCount: { 
              $sum: { 
                $cond: [{ $gt: ["$rating", 0] }, 1, 0] 
              }
            }
          }
        }
      ]);
      
      console.log(`医师(${therapist.name})服务统计结果:`, JSON.stringify(serviceStats, null, 2));
      
      // 获取每周服务数量趋势
      const weeklyTrend = await Service.aggregate([
        {
          $match: {
            therapist: therapistId,
            serviceDate: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%U", date: "$serviceDate" } },
            count: { $sum: 1 },
            revenue: { $sum: "$serviceFee" }
          }
        },
        {
          $sort: { "_id": 1 }
        }
      ]);
      
      // 计算各类服务分布
      const serviceTypeDistribution = await Service.aggregate([
        {
          $match: {
            therapist: therapistId,
            serviceDate: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: "$serviceType",
            count: { $sum: 1 }
          }
        },
        {
          $sort: { count: -1 }
        }
      ]);
      
      // 提取并格式化数据
      const stats = serviceStats.length > 0 ? serviceStats[0] : {
        totalServices: 0,
        totalRevenue: 0,
        totalHours: 0,
        ratingSum: 0,
        ratingCount: 0
      };
      
      // 计算平均评分
      const avgRating = stats.ratingCount > 0 ? (stats.ratingSum / stats.ratingCount).toFixed(1) : 0;
      
      const responseData = {
        serviceCount: stats.totalServices,
        revenue: stats.totalRevenue,
        workHours: stats.totalHours || 0,
        avgRating: parseFloat(avgRating),
        weeklyTrend,
        serviceTypeDistribution
      };
      
      console.log(`成功获取医师(${therapist.name})的统计数据，返回结果:`, JSON.stringify(responseData, null, 2));
      
      res.status(200).json({
        success: true,
        data: responseData
      });
    } catch (aggregateError) {
      console.error(`执行聚合查询失败:`, aggregateError);
      throw aggregateError;
    }
  } catch (error) {
    console.error('获取医师统计数据失败:', error);
    console.error('错误堆栈:', error.stack);
    res.status(500).json({
      success: false,
      message: '服务器错误，无法获取医师统计数据',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}; 