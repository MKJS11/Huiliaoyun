const crypto = require('crypto');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

/**
 * @desc   注册用户
 * @route  POST /api/auth/register
 * @access Public
 */
exports.register = asyncHandler(async (req, res) => {
  const { username, password, name, email, phone, role } = req.body;

  // 检查用户是否已存在
  const userExists = await User.findOne({ username });
  if (userExists) {
    return res.status(400).json({
      success: false,
      message: '用户名已存在'
    });
  }

  // 创建用户
  const user = await User.create({
    username,
    password,
    name,
    email,
    phone,
    role: role || 'receptionist' // 默认为前台接待员角色
  });

  // 创建并返回令牌
  sendTokenResponse(user, 201, res, '用户注册成功');
});

/**
 * @desc   用户登录
 * @route  POST /api/auth/login
 * @access Public
 */
exports.login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  // 验证请求参数
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: '请提供用户名和密码'
    });
  }

  // 查找用户并包含密码字段
  const user = await User.findOne({ username }).select('+password');
  if (!user) {
    return res.status(401).json({
      success: false,
      message: '用户名或密码不正确'
    });
  }

  // 验证密码
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: '用户名或密码不正确'
    });
  }

  // 检查用户是否被禁用
  if (!user.isActive) {
    return res.status(401).json({
      success: false,
      message: '该用户已被禁用，请联系管理员'
    });
  }

  // 更新最后登录时间
  user.lastLogin = Date.now();
  await user.save({ validateBeforeSave: false });

  // 创建并返回令牌
  sendTokenResponse(user, 200, res, '登录成功');
});

/**
 * @desc   退出登录
 * @route  GET /api/auth/logout
 * @access Private
 */
exports.logout = asyncHandler(async (req, res) => {
  // 清除Cookie中的令牌
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000), // 10秒后过期
    httpOnly: true
  });

  res.status(200).json({
    success: true,
    message: '已成功退出登录'
  });
});

/**
 * @desc   获取当前登录用户信息
 * @route  GET /api/auth/me
 * @access Private
 */
exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: user
  });
});

/**
 * @desc   更新用户密码
 * @route  PUT /api/auth/updatepassword
 * @access Private
 */
exports.updatePassword = asyncHandler(async (req, res) => {
  // 获取包含密码的用户
  const user = await User.findById(req.user.id).select('+password');

  // 检查当前密码
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: '请提供当前密码和新密码'
    });
  }

  // 验证当前密码
  if (!(await user.matchPassword(currentPassword))) {
    return res.status(401).json({
      success: false,
      message: '当前密码不正确'
    });
  }

  // 设置新密码
  user.password = newPassword;
  await user.save();

  // 更新令牌
  sendTokenResponse(user, 200, res, '密码已成功更新');
});

/**
 * @desc   发送重置密码邮件
 * @route  POST /api/auth/forgotpassword
 * @access Public
 */
exports.forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: '该邮箱未注册'
    });
  }

  // 生成重置令牌
  const resetToken = crypto.randomBytes(20).toString('hex');

  // 设置加密令牌和过期时间
  user.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  user.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30分钟

  await user.save({ validateBeforeSave: false });

  // 在实际应用中，这里会发送邮件
  // 为了开发测试，我们直接返回重置令牌
  res.status(200).json({
    success: true,
    message: '密码重置链接已生成',
    resetToken
  });
});

/**
 * @desc   重置密码
 * @route  PUT /api/auth/resetpassword/:resettoken
 * @access Public
 */
exports.resetPassword = asyncHandler(async (req, res) => {
  // 获取令牌并加密
  const resetToken = crypto
    .createHash('sha256')
    .update(req.params.resettoken)
    .digest('hex');

  // 查找有效重置令牌的用户
  const user = await User.findOne({
    resetPasswordToken: resetToken,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      message: '无效或已过期的重置令牌'
    });
  }

  // 设置新密码
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  // 返回新令牌
  sendTokenResponse(user, 200, res, '密码已成功重置');
});

/**
 * 创建令牌，设置cookie并返回响应
 * @param {Object} user 用户对象
 * @param {number} statusCode HTTP状态码
 * @param {Object} res 响应对象
 * @param {string} message 成功消息
 */
const sendTokenResponse = (user, statusCode, res, message) => {
  // 创建令牌
  const token = user.getSignedJwtToken();

  // Cookie设置
  const options = {
    expires: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12小时
    httpOnly: true // 仅服务器可访问
  };

  // 在生产环境中使用安全Cookie
  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  // 不在响应中包含密码
  const userData = { ...user.toObject() };
  delete userData.password;

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      message,
      token,
      data: userData
    });
}; 