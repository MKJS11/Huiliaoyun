const Inventory = require('../models/Inventory');
const InventoryTransaction = require('../models/InventoryTransaction');

/**
 * @desc 获取所有商品
 * @route GET /api/inventory
 * @access 公开
 */
exports.getInventoryItems = async (req, res) => {
  try {
    const { 
      category, 
      name, 
      lowStock = false,
      sortBy = 'name', 
      order = 'asc', 
      limit = 100, 
      page = 1 
    } = req.query;
    
    // 构建查询条件
    let query = {};
    
    // 按类别筛选
    if (category) {
      query.category = category;
    }
    
    // 按名称搜索
    if (name) {
      query.name = { $regex: name, $options: 'i' };
    }
    
    // 低库存筛选
    if (lowStock === 'true') {
      query.$expr = { $lte: ['$stock', '$warningThreshold'] };
    }

    // 只查询激活的商品
    query.isActive = true;
    
    // 排序选项
    const sortOptions = {};
    sortOptions[sortBy] = order === 'desc' ? -1 : 1;
    
    // 分页
    const skip = (page - 1) * limit;
    
    // 执行查询
    const items = await Inventory.find(query)
      .sort(sortOptions)
      .limit(Number(limit))
      .skip(skip);
      
    // 获取总数
    const total = await Inventory.countDocuments(query);
    
    // 返回结果
    res.json({
      success: true,
      count: items.length,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      data: items
    });
  } catch (err) {
    console.error('获取库存列表失败:', err);
    res.status(500).json({
      success: false,
      message: '服务器错误，无法获取库存列表'
    });
  }
};

/**
 * @desc 获取单个商品
 * @route GET /api/inventory/:id
 * @access 公开
 */
exports.getInventoryItem = async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: '找不到该商品'
      });
    }
    
    res.json({
      success: true,
      data: item
    });
  } catch (err) {
    console.error('获取商品详情失败:', err);
    res.status(500).json({
      success: false,
      message: '服务器错误，无法获取商品详情'
    });
  }
};

/**
 * @desc 创建商品
 * @route POST /api/inventory
 * @access 私有
 */
exports.createInventoryItem = async (req, res) => {
  try {
    const item = await Inventory.create(req.body);
    
    res.status(201).json({
      success: true,
      data: item
    });
  } catch (err) {
    console.error('创建商品失败:', err);
    
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: '服务器错误，无法创建商品'
    });
  }
};

/**
 * @desc 更新商品
 * @route PUT /api/inventory/:id
 * @access 私有
 */
exports.updateInventoryItem = async (req, res) => {
  try {
    let item = await Inventory.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: '找不到该商品'
      });
    }
    
    item = await Inventory.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.json({
      success: true,
      data: item
    });
  } catch (err) {
    console.error('更新商品失败:', err);
    
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: '服务器错误，无法更新商品'
    });
  }
};

/**
 * @desc 删除商品(软删除)
 * @route DELETE /api/inventory/:id
 * @access 私有
 */
exports.deleteInventoryItem = async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: '找不到该商品'
      });
    }
    
    // 软删除（更新状态）
    await Inventory.findByIdAndUpdate(req.params.id, { isActive: false });
    
    res.json({
      success: true,
      data: {}
    });
  } catch (err) {
    console.error('删除商品失败:', err);
    res.status(500).json({
      success: false,
      message: '服务器错误，无法删除商品'
    });
  }
};

/**
 * @desc 库存入库
 * @route POST /api/inventory/:id/stock-in
 * @access 私有
 */
exports.stockIn = async (req, res) => {
  try {
    const { quantity, unitPrice, supplier, notes, operator } = req.body;
    
    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: '请提供有效的入库数量'
      });
    }
    
    const item = await Inventory.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: '找不到该商品'
      });
    }
    
    // 更新库存
    item.stock += Number(quantity);
    
    // 如果提供了新的成本价，更新商品成本价
    if (unitPrice && unitPrice > 0) {
      item.costPrice = unitPrice;
    }
    
    // 保存更新后的商品信息
    await item.save();
    
    // 创建入库记录
    const transaction = await InventoryTransaction.create({
      inventory: item._id,
      type: '入库',
      quantity,
      unitPrice: unitPrice || item.costPrice,
      supplier,
      notes,
      operator
    });
    
    res.status(201).json({
      success: true,
      data: {
        item,
        transaction
      }
    });
  } catch (err) {
    console.error('商品入库失败:', err);
    
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: '服务器错误，无法完成入库操作'
    });
  }
};

/**
 * @desc 库存出库
 * @route POST /api/inventory/:id/stock-out
 * @access 私有
 */
exports.stockOut = async (req, res) => {
  try {
    const { quantity, reason, notes, operator } = req.body;
    
    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: '请提供有效的出库数量'
      });
    }
    
    const item = await Inventory.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: '找不到该商品'
      });
    }
    
    // 检查库存是否充足
    if (item.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: '库存不足，无法完成出库操作'
      });
    }
    
    // 更新库存
    item.stock -= Number(quantity);
    
    // 保存更新后的商品信息
    await item.save();
    
    // 创建出库记录
    const transaction = await InventoryTransaction.create({
      inventory: item._id,
      type: '出库',
      quantity,
      unitPrice: item.sellingPrice,
      notes: `${reason ? reason + ': ' : ''}${notes || ''}`,
      operator
    });
    
    res.status(201).json({
      success: true,
      data: {
        item,
        transaction
      }
    });
  } catch (err) {
    console.error('商品出库失败:', err);
    
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: '服务器错误，无法完成出库操作'
    });
  }
};

/**
 * @desc 获取库存交易记录
 * @route GET /api/inventory/transactions
 * @access 私有
 */
exports.getTransactions = async (req, res) => {
  try {
    const { 
      type, 
      inventoryId, 
      startDate, 
      endDate, 
      limit = 50, 
      page = 1 
    } = req.query;
    
    // 构建查询条件
    let query = {};
    
    // 按类型筛选
    if (type) {
      query.type = type;
    }
    
    // 按商品ID筛选
    if (inventoryId) {
      query.inventory = inventoryId;
    }
    
    // 按日期范围筛选
    if (startDate || endDate) {
      query.transactionDate = {};
      
      if (startDate) {
        query.transactionDate.$gte = new Date(startDate);
      }
      
      if (endDate) {
        query.transactionDate.$lte = new Date(endDate);
      }
    }
    
    // 分页
    const skip = (page - 1) * limit;
    
    // 执行查询
    const transactions = await InventoryTransaction.find(query)
      .populate('inventory', 'name specification category unit')
      .sort({ transactionDate: -1 })
      .limit(Number(limit))
      .skip(skip);
      
    // 获取总数
    const total = await InventoryTransaction.countDocuments(query);
    
    // 返回结果
    res.json({
      success: true,
      count: transactions.length,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      data: transactions
    });
  } catch (err) {
    console.error('获取交易记录失败:', err);
    res.status(500).json({
      success: false,
      message: '服务器错误，无法获取交易记录'
    });
  }
};

/**
 * @desc 获取库存统计信息
 * @route GET /api/inventory/stats
 * @access 私有
 */
exports.getInventoryStats = async (req, res) => {
  try {
    // 获取商品总数
    const totalItems = await Inventory.countDocuments({ isActive: true });
    
    // 获取总库存价值
    const inventoryItems = await Inventory.find({ isActive: true });
    const totalValue = inventoryItems.reduce((total, item) => {
      return total + (item.stock * item.costPrice);
    }, 0);
    
    // 获取低库存商品数量
    const lowStockCount = await Inventory.countDocuments({
      isActive: true,
      $expr: { $lte: ['$stock', '$warningThreshold'] }
    });
    
    // 获取本月交易记录数量
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const monthlyInCount = await InventoryTransaction.countDocuments({
      type: '入库',
      transactionDate: {
        $gte: firstDayOfMonth,
        $lte: lastDayOfMonth
      }
    });
    
    const monthlyOutCount = await InventoryTransaction.countDocuments({
      type: '出库',
      transactionDate: {
        $gte: firstDayOfMonth,
        $lte: lastDayOfMonth
      }
    });
    
    // 返回统计数据
    res.json({
      success: true,
      data: {
        totalItems,
        totalValue,
        lowStockCount,
        monthlyInCount,
        monthlyOutCount
      }
    });
  } catch (err) {
    console.error('获取库存统计信息失败:', err);
    res.status(500).json({
      success: false,
      message: '服务器错误，无法获取库存统计信息'
    });
  }
}; 