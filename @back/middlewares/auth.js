const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

/**
 * 保护路由 - 验证JWT并添加用户到请求对象
 */
exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  // 从请求头或Cookie中获取令牌
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    // 从请求头获取
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    // 从Cookie获取
    token = req.cookies.token;
  }

  // 确保令牌存在
  if (!token) {
    return res.status(401).json({
      success: false,
      message: '未授权访问，请登录'
    });
  }

  try {
    // 验证令牌
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 将用户信息添加到请求对象
    req.user = await User.findById(decoded.id);
    
    if (!req.user || !req.user.isActive) {
      return res.status(401).json({
        success: false,
        message: '用户已被停用或不存在'
      });
    }

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: '令牌无效或已过期，请重新登录'
    });
  }
});

/**
 * 授权中间件 - 检查用户角色权限
 * @param {string[]} roles 允许访问的角色数组
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未授权访问，请登录'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `用户角色 ${req.user.role} 没有访问权限`
      });
    }
    
    next();
  };
}; 