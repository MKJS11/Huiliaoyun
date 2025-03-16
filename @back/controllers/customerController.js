const Customer = require('../models/Customer');

// @desc    获取所有客户
// @route   GET /api/customers
// @access  Public
exports.getCustomers = async (req, res) => {
  try {
    // 查询参数
    const keyword = req.query.keyword ? {
      $or: [
        { childName: { $regex: req.query.keyword, $options: 'i' } },
        { parentName: { $regex: req.query.keyword, $options: 'i' } },
        { phone: { $regex: req.query.keyword, $options: 'i' } }
      ]
    } : {};

    // 会员状态筛选
    if (req.query.membershipStatus && req.query.membershipStatus !== 'all') {
      keyword.membershipStatus = req.query.membershipStatus;
    }

    // 分页
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const customers = await Customer.find(keyword)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Customer.countDocuments(keyword);

    res.json({
      success: true,
      count: customers.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: customers
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error.message
    });
  }
};

// @desc    获取单个客户
// @route   GET /api/customers/:id
// @access  Public
exports.getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: '未找到该客户'
      });
    }
    
    res.json({
      success: true,
      data: customer
    });
  } catch (error) {
    console.error(error);
    
    // 处理无效ID格式错误
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: '未找到该客户'
      });
    }
    
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error.message
    });
  }
};

// @desc    创建客户
// @route   POST /api/customers
// @access  Public
exports.createCustomer = async (req, res) => {
  try {
    const customer = await Customer.create(req.body);
    
    res.status(201).json({
      success: true,
      data: customer
    });
  } catch (error) {
    console.error(error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error.message
    });
  }
};

// @desc    更新客户
// @route   PUT /api/customers/:id
// @access  Public
exports.updateCustomer = async (req, res) => {
  try {
    // 记录请求内容以便调试
    console.log('更新客户请求，ID:', req.params.id);
    console.log('请求体:', req.body);
    
    // 添加基本验证
    if (!req.body.childName) {
      return res.status(400).json({
        success: false,
        message: '孩子姓名不能为空'
      });
    }
    
    if (!req.body.parentName) {
      return res.status(400).json({
        success: false,
        message: '家长姓名不能为空'
      });
    }
    
    if (!req.body.phone) {
      return res.status(400).json({
        success: false,
        message: '联系电话不能为空'
      });
    }
    
    // 预处理数据，确保类型正确
    const updateData = { ...req.body };
    
    // 处理日期字段
    if (updateData.childBirthdate) {
      try {
        updateData.childBirthdate = new Date(updateData.childBirthdate);
        if (isNaN(updateData.childBirthdate.getTime())) {
          delete updateData.childBirthdate;
        }
      } catch (error) {
        console.error('日期转换失败:', error);
        delete updateData.childBirthdate;
      }
    }
    
    // 确保年龄是数字
    if (updateData.childAge !== undefined) {
      updateData.childAge = parseInt(updateData.childAge);
      if (isNaN(updateData.childAge)) {
        delete updateData.childAge;
      }
    }
    
    // 更新同步状态
    updateData.synced = true;
    updateData.syncedAt = new Date();
    
    // 执行更新
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    );
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: '未找到该客户'
      });
    }
    
    res.json({
      success: true,
      data: customer
    });
  } catch (error) {
    console.error('更新客户错误:', error);
    
    // 处理验证错误
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    // 处理无效ID格式错误
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: '未找到该客户'
      });
    }
    
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error.message
    });
  }
};

// @desc    删除客户
// @route   DELETE /api/customers/:id
// @access  Public
exports.deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: '未找到该客户'
      });
    }
    
    await customer.deleteOne();
    
    res.json({
      success: true,
      message: '客户已成功删除',
      data: {}
    });
  } catch (error) {
    console.error(error);
    
    // 处理无效ID格式错误
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: '未找到该客户'
      });
    }
    
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error.message
    });
  }
};

// @desc    获取最近更新的客户
// @route   GET /api/customers/recent
// @access  Public
exports.getRecentlyUpdated = async (req, res) => {
  try {
    const updatedSince = req.query.updated_since;
    
    let query = {};
    if (updatedSince) {
      query.updatedAt = { $gt: new Date(updatedSince) };
    }
    
    const customers = await Customer.find(query)
      .sort({ updatedAt: -1 })
      .limit(50);
    
    res.json({
      success: true,
      count: customers.length,
      data: customers
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error.message
    });
  }
};

// @desc    更新客户同步状态
// @route   PUT /api/customers/:id/sync
// @access  Public
exports.updateSyncStatus = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: '未找到该客户'
      });
    }
    
    customer.synced = true;
    customer.syncedAt = new Date();
    
    await customer.save();
    
    res.json({
      success: true,
      data: customer
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error.message
    });
  }
}; 