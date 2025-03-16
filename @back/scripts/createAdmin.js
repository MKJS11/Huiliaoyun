/**
 * 初始化管理员用户脚本
 * 使用方法: node scripts/createAdmin.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

// 加载环境变量
dotenv.config();

// 连接数据库
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('数据库连接成功...');
  createAdmin();
}).catch(err => {
  console.error('数据库连接失败:', err.message);
  process.exit(1);
});

/**
 * 创建默认管理员用户
 */
const createAdmin = async () => {
  try {
    // 检查管理员是否已存在
    const adminExists = await User.findOne({ username: 'admin' });
    
    if (adminExists) {
      console.log('管理员用户已存在');
      process.exit(0);
    }
    
    // 创建管理员用户
    const admin = await User.create({
      username: 'admin',
      password: 'admin123',  // 这是初始密码，应在首次登录后修改
      name: '系统管理员',
      role: 'admin',
      email: 'admin@example.com'
    });
    
    console.log('管理员用户创建成功:');
    console.log(`用户名: ${admin.username}`);
    console.log(`密码: admin123`);
    console.log(`角色: ${admin.role}`);
    console.log('\n首次登录后请务必修改默认密码!');
    
    process.exit(0);
  } catch (err) {
    console.error('创建管理员用户失败:', err.message);
    process.exit(1);
  }
}; 