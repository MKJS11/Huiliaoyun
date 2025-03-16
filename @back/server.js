const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middlewares/error');
const cookieParser = require('cookie-parser');

// 加载环境变量
dotenv.config();

// 连接数据库
connectDB();

// 初始化Express应用
const app = express();

// 中间件
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: ['http://localhost:8080', 'http://127.0.0.1:8080'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true
}));

// 路由
app.use('/api/auth', require('./routes/auth'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/services', require('./routes/services'));
app.use('/api/memberships', require('./routes/memberships'));
app.use('/api/statistics', require('./routes/statistics'));
app.use('/api/therapists', require('./routes/therapists'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/settings', require('./routes/settings'));
// TODO: 添加其他路由如会员卡等

// 首页路由
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '欢迎使用中医小儿推拿管理系统API',
    version: '1.0.0'
  });
});

// 添加健康检查路由
app.get('/health-check', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '找不到请求的资源'
  });
});

// 错误处理中间件
app.use(errorHandler);

// 启动服务器
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`服务器在 http://localhost:${PORT} 环境 ${process.env.NODE_ENV} 运行中...`);
});

// 处理未捕获的异常
process.on('unhandledRejection', (err) => {
  console.error(`错误: ${err.message}`);
  // 关闭服务器并退出进程
  server.close(() => process.exit(1));
}); 