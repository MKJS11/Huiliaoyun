const ServiceItem = require('../models/ServiceItem');
const MembershipType = require('../models/MembershipType');

/**
 * @desc 获取所有服务项目
 * @route GET /api/settings/service-items
 * @access 公开
 */
exports.getServiceItems = async (req, res) => {
  try {
    const serviceItems = await ServiceItem.find().sort({ name: 1 });
    
    res.status(200).json({
      success: true,
      count: serviceItems.length,
      data: serviceItems
    });
  } catch (error) {
    console.error('获取服务项目列表出错:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，无法获取服务项目列表'
    });
  }
};

/**
 * @desc 添加服务项目
 * @route POST /api/settings/service-items
 * @access 公开
 */
exports.addServiceItem = async (req, res) => {
  try {
    const { name, price, description } = req.body;
    
    const serviceItem = await ServiceItem.create({
      name,
      price,
      description
    });
    
    res.status(201).json({
      success: true,
      data: serviceItem
    });
  } catch (error) {
    console.error('添加服务项目出错:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: '服务器错误，无法添加服务项目'
    });
  }
};

/**
 * @desc 更新服务项目
 * @route PUT /api/settings/service-items/:id
 * @access 公开
 */
exports.updateServiceItem = async (req, res) => {
  try {
    const { name, price, description, isActive } = req.body;
    
    let serviceItem = await ServiceItem.findById(req.params.id);
    
    if (!serviceItem) {
      return res.status(404).json({
        success: false,
        message: '未找到该服务项目'
      });
    }
    
    serviceItem = await ServiceItem.findByIdAndUpdate(
      req.params.id,
      { name, price, description, isActive },
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      data: serviceItem
    });
  } catch (error) {
    console.error('更新服务项目出错:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: '服务器错误，无法更新服务项目'
    });
  }
};

/**
 * @desc 删除服务项目
 * @route DELETE /api/settings/service-items/:id
 * @access 公开
 */
exports.deleteServiceItem = async (req, res) => {
  try {
    const serviceItem = await ServiceItem.findById(req.params.id);
    
    if (!serviceItem) {
      return res.status(404).json({
        success: false,
        message: '未找到该服务项目'
      });
    }
    
    await ServiceItem.deleteOne({ _id: serviceItem._id });
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('删除服务项目出错:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，无法删除服务项目'
    });
  }
};

/**
 * @desc 获取所有会员卡类型
 * @route GET /api/settings/membership-types
 * @access 公开
 */
exports.getMembershipTypes = async (req, res) => {
  try {
    const membershipTypes = await MembershipType.find().sort({ name: 1 });
    
    res.status(200).json({
      success: true,
      count: membershipTypes.length,
      data: membershipTypes
    });
  } catch (error) {
    console.error('获取会员卡类型列表出错:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，无法获取会员卡类型列表'
    });
  }
};

/**
 * @desc 添加会员卡类型
 * @route POST /api/settings/membership-types
 * @access 公开
 */
exports.addMembershipType = async (req, res) => {
  try {
    const { name, category, price, valueAmount, serviceCount, validityDays, description } = req.body;
    
    const membershipType = await MembershipType.create({
      name,
      category,
      price,
      valueAmount: valueAmount || 0,
      serviceCount: serviceCount || 0,
      validityDays,
      description
    });
    
    res.status(201).json({
      success: true,
      data: membershipType
    });
  } catch (error) {
    console.error('添加会员卡类型出错:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: '服务器错误，无法添加会员卡类型'
    });
  }
};

/**
 * @desc 更新会员卡类型
 * @route PUT /api/settings/membership-types/:id
 * @access 公开
 */
exports.updateMembershipType = async (req, res) => {
  try {
    const { name, category, price, valueAmount, serviceCount, validityDays, description, isActive } = req.body;
    
    let membershipType = await MembershipType.findById(req.params.id);
    
    if (!membershipType) {
      return res.status(404).json({
        success: false,
        message: '未找到该会员卡类型'
      });
    }
    
    membershipType = await MembershipType.findByIdAndUpdate(
      req.params.id,
      { 
        name, 
        category, 
        price, 
        valueAmount: valueAmount || 0, 
        serviceCount: serviceCount || 0, 
        validityDays, 
        description,
        isActive 
      },
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      data: membershipType
    });
  } catch (error) {
    console.error('更新会员卡类型出错:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: '服务器错误，无法更新会员卡类型'
    });
  }
};

/**
 * @desc 删除会员卡类型
 * @route DELETE /api/settings/membership-types/:id
 * @access 公开
 */
exports.deleteMembershipType = async (req, res) => {
  try {
    const membershipType = await MembershipType.findById(req.params.id);
    
    if (!membershipType) {
      return res.status(404).json({
        success: false,
        message: '未找到该会员卡类型'
      });
    }
    
    await MembershipType.deleteOne({ _id: membershipType._id });
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('删除会员卡类型出错:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，无法删除会员卡类型'
    });
  }
}; 