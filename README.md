<<<<<<< HEAD
# 🏥 中医小儿推拿管理系统

> 专为中医小儿推拿诊所设计的现代化管理系统，提供客户档案、服务记录、会员管理、库存管理和数据统计等全方位功能。

<div align="center">

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/mongodb-5.0+-green)](https://mongodb.com/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

[功能特性](#-功能特性) • [技术栈](#-技术栈) • [快速开始](#-快速开始) • [部署指南](#-部署指南) • [API文档](#-api文档)

</div>

---

## 📋 目录

- [💡 功能特性](#-功能特性)
- [🛠 技术栈](#-技术栈)
- [🚀 快速开始](#-快速开始)
- [📦 项目结构](#-项目结构)
- [🔧 环境配置](#-环境配置)
- [📚 API文档](#-api文档)
- [🌐 部署指南](#-部署指南)
- [📸 系统截图](#-系统截图)
- [🤝 贡献指南](#-贡献指南)
- [📄 许可证](#-许可证)

---

## 💡 功能特性

### 👥 客户档案管理
- 📝 **完整客户信息**：孩子基本信息、家长联系方式、医疗历史
- 🧬 **中医体质档案**：体质类型分类、舌苔照片时间轴对比
- 📊 **健康档案追踪**：过敏史、既往病史、体质改善建议
- 🔍 **智能搜索**：支持姓名、电话、年龄等多维度快速检索

### 🎫 会员办卡系统
- 💳 **多样卡类型**：次卡、期限卡、混合卡（次数+时间）
- 🔔 **智能提醒**：卡到期前7天自动提醒、次数不足预警
- 💰 **消费记录**：详细扣卡记录、关联服务项目和推拿师
- 📈 **会员权益**：积分系统、优惠政策管理

### 🩺 服务记录模块
- 📋 **推拿日志**：详细记录每次服务内容、使用手法、效果评估
- 📸 **舌苔档案**：支持照片上传、时间轴对比、变化追踪
- ✍️ **电子签名**：家长确认签字、推拿师评价记录
- 🎯 **疗效评估**：症状缓解程度、家长满意度评分

### 📦 库存管理
- 📊 **实时库存**：商品数量实时更新、库存预警机制
- 📝 **进销存管理**：入库、出库、盘点操作记录
- 🚨 **自动预警**：库存低于阈值自动提醒、采购建议
- 📋 **商品分类**：药膏、器具、消耗品等分类管理

### 📊 数据统计分析
- 💼 **推拿师绩效**：工作量统计、客户评价、业务分析
- 💰 **营收分析**：收入构成、趋势图表、同比环比分析
- 👥 **客户分析**：活跃度统计、沉默客户识别、召回策略
- 📈 **经营报表**：日报、周报、月报，支持数据导出

### 🔐 权限管理
- 👨‍⚕️ **推拿师权限**：仅查看本人服务记录和客户信息
- 👨‍💼 **店长权限**：查看全店数据、导出统计报表
- 👑 **超级管理员**：跨门店数据汇总、系统配置管理
- 🔒 **安全认证**：JWT token认证、密码加密存储

---

## 🛠 技术栈

### 🖥 前端技术
- **语言**：JavaScript (ES6+)
- **UI框架**：原生JavaScript + CSS3
- **图表库**：Chart.js 4.4+
- **模块化**：ES6 Modules
- **构建工具**：无需构建，直接运行

### ⚙️ 后端技术
- **运行时**：Node.js 18+
- **框架**：Express.js 4.18+
- **数据库**：MongoDB 5.0+
- **ODM**：Mongoose 7.5+
- **认证**：JWT + bcryptjs
- **进程管理**：PM2

### 🌐 部署技术
- **反向代理**：Nginx
- **操作系统**：Ubuntu 22.04 LTS
- **容器化**：支持Docker（可选）
- **SSL证书**：Let's Encrypt

### 🔧 开发工具
- **开发模式**：Nodemon
- **代码风格**：ESLint
- **版本控制**：Git
- **文档管理**：Markdown

---

## 🚀 快速开始

### 📋 环境要求

确保您的系统已安装以下软件：

- **Node.js** 18.0+ ([下载地址](https://nodejs.org/))
- **MongoDB** 5.0+ ([安装指南](https://docs.mongodb.com/manual/installation/))
- **Git** ([下载地址](https://git-scm.com/))

### ⚡ 一键启动

```bash
# 1. 克隆项目
git clone https://github.com/你的用户名/hospital-management-system.git
cd hospital-management-system

# 2. 安装后端依赖
cd @back
npm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 文件设置数据库连接等配置

# 4. 启动MongoDB服务
# macOS (使用 Homebrew)
brew services start mongodb-community
# Ubuntu/CentOS
sudo systemctl start mongod

# 5. 创建管理员账户
npm run create-admin

# 6. 启动后端服务
npm run dev

# 7. 启动前端服务（新建终端窗口）
cd ../front
# 使用任意静态文件服务器，例如：
npx http-server -p 8080 -c-1

# 8. 访问系统
# 前端：http://localhost:8080
# 后端API：http://localhost:5201
```

### 🔧 开发模式配置

#### 后端开发

```bash
cd @back

# 安装开发依赖
npm install

# 启动开发模式（自动重启）
npm run dev

# 生产模式启动
npm start

# 创建管理员用户
npm run create-admin
```

#### 前端开发

```bash
cd front

# 启动开发服务器
npm start
# 或使用其他静态服务器
python3 -m http.server 8080
# 或
php -S localhost:8080
```

---

## 📦 项目结构

```
hospital-management-system/
├── 📁 @back/                     # 后端目录
│   ├── 📁 config/               # 配置文件
│   │   └── db.js               # 数据库连接配置
│   ├── 📁 controllers/          # 控制器层
│   │   ├── auth.js             # 认证控制器
│   │   ├── customerController.js # 客户管理
│   │   ├── inventory.js        # 库存管理
│   │   ├── memberships.js      # 会员管理
│   │   ├── services.js         # 服务记录
│   │   ├── statistics.js       # 统计分析
│   │   └── therapistController.js # 推拿师管理
│   ├── 📁 models/              # 数据模型层
│   │   ├── Customer.js         # 客户模型
│   │   ├── Membership.js       # 会员卡模型
│   │   ├── Service.js          # 服务记录模型
│   │   ├── Inventory.js        # 库存模型
│   │   ├── User.js             # 用户模型
│   │   └── ...                # 其他模型
│   ├── 📁 routes/              # 路由层
│   │   ├── auth.js             # 认证路由
│   │   ├── customers.js        # 客户路由
│   │   ├── memberships.js      # 会员路由
│   │   ├── services.js         # 服务路由
│   │   ├── inventory.js        # 库存路由
│   │   └── statistics.js       # 统计路由
│   ├── 📁 middlewares/         # 中间件
│   │   ├── auth.js             # 认证中间件
│   │   └── error.js            # 错误处理中间件
│   ├── 📁 scripts/             # 脚本文件
│   │   └── createAdmin.js      # 创建管理员脚本
│   ├── 📄 server.js            # 服务器主文件
│   ├── 📄 package.json         # 后端依赖配置
│   └── 📄 .env                 # 环境变量文件
├── 📁 front/                    # 前端目录
│   ├── 📁 css/                 # 样式文件
│   │   └── main.css           # 主样式文件
│   ├── 📁 js/                  # JavaScript文件
│   │   ├── 📁 modules/         # 功能模块
│   │   │   ├── customer/       # 客户管理模块
│   │   │   ├── service/        # 服务记录模块
│   │   │   ├── membership/     # 会员管理模块
│   │   │   ├── inventory/      # 库存管理模块
│   │   │   ├── statistics/     # 统计分析模块
│   │   │   └── settings/       # 系统设置模块
│   │   ├── 📁 services/        # API服务层
│   │   │   └── data-service.js # 数据服务
│   │   ├── 📁 utils/           # 工具函数
│   │   │   ├── auth.js         # 认证工具
│   │   │   ├── ui-utils.js     # UI工具
│   │   │   └── chart-utils.js  # 图表工具
│   │   └── main.js             # 主入口文件
│   ├── 📁 images/              # 图片资源
│   │   ├── logo.png           # 系统Logo
│   │   └── default-avatar.png # 默认头像
│   ├── 📄 index.html           # 系统首页
│   ├── 📄 login.html           # 登录页面
│   ├── 📄 customer.html        # 客户管理页
│   ├── 📄 service.html         # 服务记录页
│   ├── 📄 membership.html      # 会员管理页
│   ├── 📄 inventory.html       # 库存管理页
│   ├── 📄 statistics.html      # 统计分析页
│   ├── 📄 settings.html        # 系统设置页
│   └── 📄 package.json         # 前端依赖配置
├── 📄 deployment.md            # 详细部署指南
├── 📄 nginx.conf               # Nginx配置示例
├── 📄 常用命令说明.md           # 开发运维命令
├── 📄 plan.MD                  # 开发计划文档
└── 📄 README.md                # 项目说明文档（本文件）
```

---

## 🔧 环境配置

### 后端环境变量 (.env)

在 `@back` 目录下创建 `.env` 文件：

```env
# 服务器配置
NODE_ENV=development
PORT=5201

# 数据库配置
MONGO_URI=mongodb://localhost:27017/hospital_management

# JWT配置
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d

# 文件上传配置
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760

# 邮件配置（可选）
SMTP_HOST=smtp.qq.com
SMTP_PORT=587
SMTP_USER=your_email@qq.com
SMTP_PASS=your_email_password

# 短信配置（可选）
SMS_ACCESS_KEY=your_sms_access_key
SMS_SECRET_KEY=your_sms_secret_key
```

### 前端配置

在 `front/js/utils/config.js` 中配置：

```javascript
// API配置
const CONFIG = {
    // 开发环境
    API_BASE_URL: 'http://localhost:5201/api',
    
    // 生产环境
    // API_BASE_URL: 'https://your-domain.com/api',
    
    // 分页配置
    PAGE_SIZE: 10,
    
    // 文件上传配置
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/gif'],
    
    // 其他配置
    DEFAULT_AVATAR: '/images/default-avatar.png',
    COMPANY_NAME: '中医小儿推拿管理系统'
};
```

---

## 📚 API文档

### 🔐 认证接口

| 方法 | 路径 | 说明 | 参数 |
|------|------|------|------|
| POST | `/api/auth/login` | 用户登录 | `username, password` |
| POST | `/api/auth/logout` | 用户退出 | - |
| GET | `/api/auth/profile` | 获取用户信息 | Header: `Authorization` |
| PUT | `/api/auth/profile` | 更新用户信息 | `name, email, phone` |

### 👥 客户管理接口

| 方法 | 路径 | 说明 | 参数 |
|------|------|------|------|
| GET | `/api/customers` | 获取客户列表 | `page, limit, search` |
| GET | `/api/customers/:id` | 获取客户详情 | - |
| POST | `/api/customers` | 创建客户 | 客户信息对象 |
| PUT | `/api/customers/:id` | 更新客户 | 客户信息对象 |
| DELETE | `/api/customers/:id` | 删除客户 | - |
| GET | `/api/customers/recent` | 最近更新客户 | `limit` |

### 🎫 会员管理接口

| 方法 | 路径 | 说明 | 参数 |
|------|------|------|------|
| GET | `/api/memberships` | 获取会员卡列表 | `page, limit, status` |
| GET | `/api/memberships/:id` | 获取会员卡详情 | - |
| POST | `/api/memberships` | 创建会员卡 | 会员卡信息对象 |
| PUT | `/api/memberships/:id` | 更新会员卡 | 会员卡信息对象 |
| POST | `/api/memberships/:id/recharge` | 会员卡充值 | `amount, type` |
| POST | `/api/memberships/:id/consume` | 会员卡消费 | `amount, serviceId` |

### 🩺 服务记录接口

| 方法 | 路径 | 说明 | 参数 |
|------|------|------|------|
| GET | `/api/services` | 获取服务记录 | `page, limit, customerId` |
| GET | `/api/services/:id` | 获取服务详情 | - |
| POST | `/api/services` | 创建服务记录 | 服务信息对象 |
| PUT | `/api/services/:id` | 更新服务记录 | 服务信息对象 |
| DELETE | `/api/services/:id` | 删除服务记录 | - |

### 📦 库存管理接口

| 方法 | 路径 | 说明 | 参数 |
|------|------|------|------|
| GET | `/api/inventory` | 获取库存列表 | `page, limit, category` |
| GET | `/api/inventory/:id` | 获取库存详情 | - |
| POST | `/api/inventory` | 创建库存商品 | 商品信息对象 |
| PUT | `/api/inventory/:id` | 更新库存信息 | 商品信息对象 |
| POST | `/api/inventory/:id/stock-in` | 入库操作 | `quantity, note` |
| POST | `/api/inventory/:id/stock-out` | 出库操作 | `quantity, note` |

### 📊 统计分析接口

| 方法 | 路径 | 说明 | 参数 |
|------|------|------|------|
| GET | `/api/statistics/overview` | 系统概览 | `period` |
| GET | `/api/statistics/revenue` | 营收统计 | `startDate, endDate` |
| GET | `/api/statistics/customers` | 客户统计 | `period` |
| GET | `/api/statistics/services` | 服务统计 | `period` |
| GET | `/api/statistics/therapists` | 推拿师统计 | `period` |

---

## 🌐 部署指南

### 🚀 快速部署

我们提供了一键部署脚本，适用于 Ubuntu 22.04 LTS 系统：

```bash
# 下载部署脚本
wget https://raw.githubusercontent.com/你的用户名/hospital-management-system/main/deploy.sh

# 执行部署
chmod +x deploy.sh
./deploy.sh
```

### 🔧 手动部署

详细的部署指南请参考 [deployment.md](./deployment.md) 文档，包含：

- 🖥️ **服务器选择与配置**
- 🛠️ **环境安装与配置**
- 📦 **应用部署步骤**
- 🔒 **安全配置建议**
- 🔍 **监控与维护**
- 🚨 **故障排除指南**

### 🐳 Docker部署（推荐）

```bash
# 使用Docker Compose一键部署
git clone https://github.com/你的用户名/hospital-management-system.git
cd hospital-management-system

# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

### ☁️ 云服务器推荐配置

| 云服务商 | 配置 | 预估费用 | 备注 |
|---------|------|---------|------|
| 阿里云 | 2核4G, 40G SSD | ¥150-200/月 | 适合中小型诊所 |
| 腾讯云 | 2核4G, 50G SSD | ¥140-180/月 | 性价比较高 |
| 华为云 | 2核4G, 40G SSD | ¥160-210/月 | 稳定性好 |

---

## 📸 系统截图

### 🏠 系统首页
- 📊 实时数据概览
- 🔗 快捷功能入口
- 📈 关键指标展示

### 👥 客户管理
- 📋 客户列表与搜索
- 📝 客户详情管理
- 📸 体质档案记录

### 🎫 会员系统
- 💳 会员卡管理
- 💰 充值消费记录
- 🔔 到期提醒功能

### 🩺 服务记录
- 📋 服务记录列表
- 📸 舌苔照片对比
- ⭐ 疗效评价系统

### 📦 库存管理
- 📊 库存状态一览
- 📝 进销存操作
- 🚨 库存预警提醒

### 📈 数据统计
- 💰 营收分析报表
- 👨‍⚕️ 推拿师绩效
- 📊 客户活跃度分析

---


**⭐ 如果这个项目对你有帮助，请给我们一个星标！ ⭐**

**🔥 让我们一起打造更好的中医推拿管理系统！ 🔥**

[⬆ 回到顶部](#-中医小儿推拿管理系统)

</div>
=======
# Huiliaoyun
>>>>>>> 8cfe7b94bd9c69a25d3ffbae40d9111667eabb31
