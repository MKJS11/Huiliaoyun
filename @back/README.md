# 中医小儿推拿管理系统后端API

这是一个基于Node.js和Express构建的RESTful API，用于中医小儿推拿管理系统。

## 功能特点

- 客户档案管理
- 会员卡管理
- 服务记录管理
- 数据同步支持
- RESTful API设计

## 技术栈

- Node.js
- Express
- MongoDB 
- Mongoose
- JWT认证

## 安装与运行

### 前提条件

- Node.js 14.0 或更高版本
- MongoDB 4.0 或更高版本

### 安装步骤

1. 安装依赖：
   ```
   npm install
   ```

2. 环境配置：
   - 复制 `.env` 文件并根据需要修改配置
   - 确保MongoDB服务已启动

3. 启动服务：
   - 开发模式：`npm run dev`
   - 生产模式：`npm start`

## API文档

### 客户管理

- `GET /api/customers` - 获取所有客户
- `GET /api/customers/:id` - 获取单个客户
- `POST /api/customers` - 创建客户
- `PUT /api/customers/:id` - 更新客户
- `DELETE /api/customers/:id` - 删除客户
- `GET /api/customers/recent` - 获取最近更新的客户
- `PUT /api/customers/:id/sync` - 更新客户同步状态

### 会员卡管理

- `GET /api/memberships` - 获取所有会员卡
- `GET /api/memberships/:id` - 获取单个会员卡
- `POST /api/memberships` - 创建会员卡
- `PUT /api/memberships/:id` - 更新会员卡
- `DELETE /api/memberships/:id` - 删除会员卡
- `GET /api/memberships/customer/:customerId` - 获取客户的会员卡

### 服务记录

- `GET /api/services` - 获取所有服务记录
- `GET /api/services/:id` - 获取单个服务记录
- `POST /api/services` - 创建服务记录
- `PUT /api/services/:id` - 更新服务记录
- `DELETE /api/services/:id` - 删除服务记录
- `GET /api/services/customer/:customerId` - 获取客户的服务记录

## 前端对接指南

1. 在前端项目中修改 `js/services/data-service.js` 文件
2. 将本地存储逻辑替换为API调用
3. 配置服务器URL与同步功能

## 许可证

MIT 