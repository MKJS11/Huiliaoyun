# 中医小儿推拿管理系统部署指南

本文档提供了将中医小儿推拿管理系统部署到生产环境的完整指南。

## 📋 快速导航

- [1. 服务器选择与准备](#1-服务器选择与准备)
- [2. 环境配置](#2-环境配置)
- [3. 部署应用](#3-部署应用)
- [4. HTTPS配置](#4-https配置强烈推荐)
- [5. 数据库备份策略](#5-数据库备份策略)
- [6. 日志管理](#6-日志管理)
- [7. 监控与维护](#7-监控与维护)
- [8. 安全强化建议](#8-安全强化建议)
- [9. 故障排除](#9-故障排除)
- [10. 扩展与优化](#10-扩展与优化)
- [⚡ 快速部署清单](#-快速部署清单)

## 🎯 系统架构概览

```
用户访问 → Nginx (80/443) → Node.js API (5201) → MongoDB (27017)
                ↓
            静态文件服务 (前端HTML/JS/CSS)
```

## 1. 服务器选择与准备

### 推荐配置

对于中小型医疗管理系统，推荐以下配置的云服务器：

| 配置项 | 推荐参数 |
|-------|---------|
| 操作系统 | Ubuntu 22.04 LTS |
| CPU | 2核 |
| 内存 | 4GB |
| 存储 | 50GB SSD |
| 带宽 | 5Mbps |

### 云服务商选择

- **阿里云**：轻量应用服务器或ECS
- **腾讯云**：轻量应用服务器或CVM
- **华为云**：轻量应用服务器

价格参考：约150-200元/月

### 域名与备案

1. 购买域名（推荐.com或.cn域名）
2. 如使用国内服务器，需完成域名备案（约需1-2周）
3. 将域名解析到服务器IP

## 2. 环境配置

### 系统基础配置

```bash
# 连接到服务器
ssh root@你的服务器IP

# 更新系统
apt update && apt upgrade -y

# 安装必要工具
apt install -y git curl wget vim htop unzip net-tools
```

### 安装Node.js环境

```bash
# 安装Node.js 18.x (LTS版本)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs

# 验证安装
node -v  # 应显示v18.x.x版本
npm -v   # 应显示9.x.x版本

# 安装PM2进程管理器
npm install -g pm2
```

### 安装MongoDB数据库

```bash
# 导入MongoDB公钥
wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add -

# 添加MongoDB源
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-5.0.list

# 更新包列表
apt update

# 安装MongoDB
apt install -y mongodb-org

# 启动MongoDB并设置开机自启
systemctl start mongod
systemctl enable mongod

# 验证MongoDB运行状态
systemctl status mongod
```

### 配置MongoDB安全设置（可选但推荐）

```bash
# 创建管理员用户
mongosh admin --eval '
  db.createUser({
    user: "admin",
    pwd: "jzh627200", 
    roles: [ { role: "userAdminAnyDatabase", db: "admin" } ]
  })
'

# 创建应用数据库用户
mongosh admin -u admin -p jzh627200 --eval '
  db.createUser({
    user: "huiliaoyun",
    pwd: "k87y6gjyf656",
    roles: [ { role: "readWrite", db: "huiliaoyun" } ]
  })
'

mongosh -u huiliaoyun -p k87y6gjyf656 huiliaoyun

db.users.updateOne(
  { username: "jzh" },
  { $set: { password: "jzh627200" } }
)

# 编辑MongoDB配置启用认证
sed -i 's/#security:/security:\n  authorization: enabled/' /etc/mongod.conf

# 重启MongoDB
systemctl restart mongod
```

### 安装Nginx

```bash
# 安装Nginx
apt install -y nginx

# 启动Nginx并设置开机自启
systemctl start nginx
systemctl enable nginx

# 验证Nginx状态
systemctl status nginx
```

## 3. 部署应用

### 获取应用代码

```bash
# 创建应用目录
mkdir -p /var/www/huiliaoyun

# 方法1：使用Git获取代码
cd /var/www/huiliaoyun
git clone 你的代码仓库地址 .

# 方法2：从本地上传代码到服务器
# 在本地执行: 
# scp -r 项目文件夹/* root@服务器IP:/var/www/huiliaoyun/
```

### 配置后端

```bash
# 进入后端目录
cd /var/www/huiliaoyun/@back

# 安装依赖
npm install --production

# 创建环境配置文件
cp .env.example .env  # 如果没有示例文件，则创建新文件
```

编辑`.env`文件配置环境变量：

```bash
cat > /var/www/huiliaoyun/p1/@back/.env << 'EOL'
NODE_ENV=production
PORT=5201
MONGO_URI=mongodb://huiliaoyun:k87y6gjyf656@localhost:27017/huiliaoyun
JWT_SECRET=your_jwt_secret_key_here
EOL

# 生成随机密钥方法
# openssl rand -base64 32
```

### 配置前端

```bash
# 进入前端目录
cd /var/www/huiliaoyun/p1/front

# 安装依赖（如果有前端构建过程）
npm install --production
```

修改前端API地址配置：

```bash
# 找到data-service.js文件并编辑
vim /var/www/huiliaoyun/p1/front/js/services/data-service.js

# 修改apiUrl为生产环境地址，例如：
# this.apiUrl = 'https://你的域名/api';
# 或者使用相对路径：
# this.apiUrl = '/api';
```

### 配置Nginx

```bash
# 创建Nginx配置文件
cat > /etc/nginx/sites-available/huiliaoyun.conf << 'EOL'
server {
    listen 80;
    server_name huiliaoyun.site;
    
    # 前端静态文件
    location / {
        root /var/www/huiliaoyun/p1/front;
        index login.html index.html;
        try_files $uri $uri/ /login.html;
    }
    
    # 直接访问根路径时重定向到登录页
    location = / {
        root /var/www/huiliaoyun/p1/front;
        try_files /login.html =404;
    }
    
    # 后端API
    location /api {
        proxy_pass http://localhost:5201;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # 禁止直接访问.env文件和其他敏感文件
    location ~ \.env$ {
        deny all;
        return 404;
    }
    
    # 日志配置
    access_log /var/log/nginx/huiliaoyun-access.log;
    error_log /var/log/nginx/huiliaoyun-error.log;
}
EOL

# 启用配置
ln -s /etc/nginx/sites-available/huiliaoyun.conf /etc/nginx/sites-enabled/

# 移除默认配置（可选）
rm -f /etc/nginx/sites-enabled/default

# 验证Nginx配置
nginx -t

# 重启Nginx
systemctl restart nginx
```

### 启动应用

```bash
# 启动后端应用
cd /var/www/huiliaoyun/p1/@back
pm2 start server.js --name "huiliaoyun-backend"

# 配置PM2开机自启
pm2 startup
pm2 save

# 检查应用状态
pm2 status
```

### 配置防火墙

```bash
# 安装防火墙
apt install -y ufw

# 配置防火墙规则
ufw allow ssh        # 允许SSH连接（端口22）
ufw allow http       # 允许HTTP连接（端口80）
ufw allow https      # 允许HTTPS连接（端口443）

# 启用防火墙
ufw enable

# 检查防火墙状态
ufw status
```

## 4. HTTPS配置（强烈推荐）

### 使用Let's Encrypt免费SSL证书

Let's Encrypt提供免费的SSL证书，有效期为90天，但可以自动续期。以下是详细配置步骤：

```bash
# 安装Certbot和Nginx插件
apt update
apt install -y certbot python3-certbot-nginx

# 获取SSL证书并自动配置Nginx
certbot --nginx -d 你的域名

# 如果有多个域名，可以添加多个-d参数
# certbot --nginx -d 你的主域名 -d www.你的域名

# 根据交互式提示完成配置
# 会询问是否将HTTP自动重定向到HTTPS，建议选择"2"(重定向)
```

Certbot会自动修改Nginx配置，添加SSL设置并可选地重定向HTTP到HTTPS。

### 配置自动续期

Let's Encrypt证书有效期为90天，需要定期续期，可以通过以下方式配置自动续期：

```bash
# 测试证书续期（不会真正续期）
certbot renew --dry-run

# 如果测试成功，系统已自动配置了续期任务
# 查看续期定时任务
systemctl list-timers | grep certbot
```

默认情况下，Certbot安装后会自动创建一个定时任务，每天尝试续期即将过期的证书。

### HTTPS安全增强配置

配置完基本的HTTPS后，可以进一步增强安全性：

```bash
# 编辑Nginx站点配置文件
vim /etc/nginx/sites-available/huiliaoyun.conf

# 在server块中添加以下配置以增强安全性
server {
    # 已有的配置...
    
    # 增加SSL安全头
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header X-Frame-Options SAMEORIGIN;
    
    # 优化SSL设置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:10m;
    ssl_session_tickets off;
}
```

### 可能遇到的问题与解决方案

1. **端口80/443被占用**
   ```bash
   # 检查是否有其他服务占用这些端口
   netstat -tlnp | grep ':80\|:443'
   
   # 停止占用端口的服务
   systemctl stop 服务名
   ```

2. **DNS配置问题**
   确保域名已正确解析到服务器IP，可以使用以下命令检查：
   ```bash
   dig 你的域名 +short
   # 应返回你的服务器IP
   ```

3. **防火墙阻止**
   确保防火墙允许443端口：
   ```bash
   ufw status | grep 443
   # 如果没有开放，使用以下命令开放
   ufw allow https
   ```

### 验证HTTPS配置

完成配置后，可以通过以下方法验证HTTPS是否正确配置：

1. 使用浏览器访问 https://你的域名 确认网站可以正常通过HTTPS访问
2. 检查证书信息是否正确（点击浏览器地址栏的锁图标）
3. 使用 [SSL Labs](https://www.ssllabs.com/ssltest/) 对HTTPS配置进行测试，获取安全评级
   ```
   # 在浏览器中访问
   https://www.ssllabs.com/ssltest/analyze.html?d=你的域名
   ```

4. 使用命令行工具检查证书状态
   ```bash
   echo | openssl s_client -showcerts -servername 你的域名 -connect 你的域名:443 2>/dev/null | openssl x509 -inform pem -noout -text
   ```

完成以上步骤后，您的网站应该已经成功启用免费的HTTPS服务，并且会自动续期证书。

## 5. 数据库备份策略

### 创建自动备份脚本

```bash
# 创建备份目录
mkdir -p /var/backups/mongodb

# 创建备份脚本
cat > /root/backup-mongodb.sh << 'EOL'
#!/bin/bash
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
BACKUP_DIR="/var/backups/mongodb"
BACKUP_FILE="$BACKUP_DIR/huiliaoyun-$TIMESTAMP"

# 创建备份
mongodump --uri="mongodb://huiliaoyun:k87y6gjyf656@localhost:27017/huiliaoyun" --out="$BACKUP_FILE"

# 压缩备份
tar -zcf "$BACKUP_FILE.tar.gz" -C "$BACKUP_DIR" "huiliaoyun-$TIMESTAMP"
rm -rf "$BACKUP_FILE"

# 删除7天前的备份
find $BACKUP_DIR -name "*.tar.gz" -type f -mtime +7 -delete
EOL

# 添加执行权限
chmod +x /root/backup-mongodb.sh

# 测试备份脚本
/root/backup-mongodb.sh

# 添加到计划任务，每天凌晨2点备份
(crontab -l 2>/dev/null; echo "0 2 * * * /root/backup-mongodb.sh") | crontab -
```

### 备份验证与恢复测试

```bash
# 确认备份文件存在
ls -la /var/backups/mongodb/

# 模拟恢复测试（可选，谨慎操作）
# tar -zxf /var/backups/mongodb/最新备份文件.tar.gz -C /tmp/
# mongorestore --uri="mongodb://huiliaoyun:密码@localhost:27017/huiliaoyun_test" /tmp/huiliaoyun-备份日期/huiliaoyun/
```

## 6. 日志管理

### 配置日志轮转

```bash
# 创建应用日志轮转配置
cat > /etc/logrotate.d/huiliaoyun << 'EOL'
/var/log/nginx/huiliaoyun-*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        [ -s /run/nginx.pid ] && kill -USR1 `cat /run/nginx.pid`
    endscript
}

/var/www/huiliaoyun/p1/@back/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 0640 root root
    sharedscripts
    postrotate
        pm2 flush
    endscript
}
EOL
```

## 7. 监控与维护

### 系统监控

```bash
# 安装简易监控工具Netdata
bash <(curl -Ss https://my-netdata.io/kickstart.sh)

# 访问监控界面
# http://服务器IP:19999
```

### 定期维护计划

#### 每周维护任务

```bash
# 更新系统包
apt update && apt upgrade -y

# 检查服务状态
systemctl status nginx mongod
pm2 status

# 检查磁盘空间
df -h

# 检查日志是否有错误
grep -i error /var/log/nginx/huiliaoyun-error.log
grep -i error /var/www/huiliaoyun/p1/@back/logs/error.log
```

#### 每月维护任务

```bash
# 检查并安装安全更新
apt dist-upgrade

# 检查备份完整性
ls -la /var/backups/mongodb/

# 检查SSL证书有效期（Let's Encrypt证书90天有效期）
certbot certificates
```

## 8. 安全强化建议

### 系统安全

1. 禁用密码登录，使用SSH密钥认证
   ```bash
   # 编辑SSH配置
   vim /etc/ssh/sshd_config
   # 设置：PasswordAuthentication no
   systemctl restart sshd
   ```

2. 安装自动安全更新
   ```bash
   apt install -y unattended-upgrades
   dpkg-reconfigure -plow unattended-upgrades
   ```

3. 安装入侵检测工具
   ```bash
   apt install -y fail2ban
   systemctl enable fail2ban
   systemctl start fail2ban
   ```

### 应用安全

1. 定期更改管理员密码
2. 确保JWT密钥的安全性和定期轮换
3. 配置适当的CORS策略，限制API访问
4. 实现速率限制防止暴力攻击

## 9. 故障排除

### 常见问题与解决方案

1. **应用无法启动**
   ```bash
   # 检查日志
   pm2 logs huiliaoyun-backend
   # 确认环境变量正确
   cat /var/www/huiliaoyun/p1/@back/.env
   ```

2. **无法连接数据库**
   ```bash
   # 检查MongoDB状态
   systemctl status mongod
   # 检查连接字符串
   cat /var/www/huiliaoyun/p1/@back/.env | grep MONGO_URI
   ```

3. **Nginx返回502错误**
   ```bash
   # 确认后端运行中
   pm2 status
   # 检查Nginx错误日志
   tail -n 100 /var/log/nginx/error.log
   ```

4. **SSL证书问题**
   ```bash
   # 检查证书状态
   certbot certificates
   # 尝试续期
   certbot renew --dry-run
   ```

## 10. 扩展与优化

### 性能优化

1. 启用Nginx缓存
   ```bash
   # 编辑Nginx配置
   vim /etc/nginx/sites-available/huiliaoyun.conf
   # 添加缓存配置
   ```

2. MongoDB索引优化
   ```bash
   # 为常用查询字段创建索引
   mongosh -u huiliaoyun -p 密码 huiliaoyun --eval 'db.customers.createIndex({phone: 1})'
   ```

### 可扩展性考虑

如果将来需要扩展系统，可以考虑：

1. 使用负载均衡处理更多并发请求
2. 数据库主从复制提高读取性能
3. 使用Redis缓存减轻数据库负担
4. 采用容器化部署实现更灵活的扩展

## 结语

按照本指南完成部署后，您的中医小儿推拿管理系统应已成功运行在生产环境中。根据业务需求和系统负载，定期评估系统性能并进行相应调整。

---

## ⚡ 快速部署清单

### 🔥 一键部署脚本（推荐）

创建自动化部署脚本，快速完成整个部署过程：

```bash
#!/bin/bash
# 部署脚本 - deploy.sh

echo "🚀 开始部署中医小儿推拿管理系统..."

# 1. 更新系统
echo "📦 更新系统..."
apt update && apt upgrade -y

# 2. 安装基础软件
echo "🔧 安装基础软件..."
apt install -y git curl wget vim htop unzip net-tools ufw

# 3. 安装Node.js
echo "📥 安装Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs

# 4. 安装PM2
echo "⚙️ 安装PM2..."
npm install -g pm2

# 5. 安装MongoDB
echo "🗄️ 安装MongoDB..."
wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-5.0.list
apt update && apt install -y mongodb-org

# 6. 安装Nginx
echo "🌐 安装Nginx..."
apt install -y nginx

# 7. 启动服务
echo "▶️ 启动服务..."
systemctl start mongod nginx
systemctl enable mongod nginx

# 8. 配置防火墙
echo "🔒 配置防火墙..."
ufw allow ssh
ufw allow http
ufw allow https
ufw --force enable

# 9. 创建应用目录
echo "📁 创建应用目录..."
mkdir -p /var/www/huiliaoyun/p1

echo "✅ 基础环境部署完成！"
echo "📝 接下来请："
echo "1. 上传应用代码到 /var/www/huiliaoyun/p1/"
echo "2. 配置数据库用户和环境变量"
echo "3. 配置Nginx站点"
echo "4. 启动应用"
```

### 📋 部署检查清单

在部署过程中，请确保完成以下所有步骤：

#### ✅ 环境准备
- [ ] 服务器基础配置完成
- [ ] Node.js 18.x 安装并验证
- [ ] MongoDB 5.0 安装并启动
- [ ] Nginx 安装并启动
- [ ] PM2 全局安装
- [ ] 防火墙规则配置

#### ✅ 代码部署
- [ ] 应用代码上传到正确目录
- [ ] 后端依赖安装 (`npm install --production`)
- [ ] 环境变量文件 `.env` 配置
- [ ] 数据库连接测试通过

#### ✅ 服务配置
- [ ] Nginx 站点配置文件创建
- [ ] Nginx 配置语法检查通过 (`nginx -t`)
- [ ] 站点配置已启用
- [ ] PM2 应用启动成功

#### ✅ 安全配置
- [ ] MongoDB 用户权限配置
- [ ] 防火墙规则生效
- [ ] SSL 证书配置（推荐）
- [ ] 敏感文件访问禁止

#### ✅ 监控备份
- [ ] 自动备份脚本配置
- [ ] 日志轮转配置
- [ ] 监控工具安装（可选）
- [ ] PM2 开机自启配置

### 🚨 部署验证步骤

完成部署后，请按顺序进行以下验证：

```bash
# 1. 检查所有服务状态
systemctl status nginx mongod
pm2 status

# 2. 检查端口监听
netstat -tlnp | grep -E ':80|:443|:5201|:27017'

# 3. 测试网站访问
curl -I http://localhost
curl -I http://您的域名

# 4. 测试API接口
curl http://localhost/api/health
curl http://您的域名/api/health

# 5. 检查日志
tail -f /var/log/nginx/huiliaoyun-access.log
pm2 logs huiliaoyun-backend --lines 20

# 6. 数据库连接测试
mongosh -u huiliaoyun -p k87y6gjyf656 huiliaoyun --eval "db.stats()"
```

### 🔧 常见部署问题快速解决

| 问题症状 | 可能原因 | 快速解决 |
|---------|---------|---------|
| 网站无法访问 | Nginx未启动 | `systemctl start nginx` |
| 502错误 | 后端未运行 | `pm2 restart huiliaoyun-backend` |
| 数据库连接失败 | MongoDB未启动 | `systemctl start mongod` |
| PM2应用崩溃 | 环境变量错误 | 检查 `.env` 文件配置 |
| SSL证书错误 | 证书过期 | `certbot renew` |
| 磁盘空间不足 | 日志文件过大 | 清理日志或配置日志轮转 |

### 📞 技术支持联系方式

如遇到部署问题，请提供以下信息：

1. **系统信息**：`uname -a && lsb_release -a`
2. **服务状态**：`systemctl status nginx mongod && pm2 status`
3. **错误日志**：相关的错误日志内容
4. **网络测试**：`curl -I http://localhost` 结果

---

## 📚 相关文档

- [常用命令说明.md](./常用命令说明.md) - 系统管理常用命令
- [instruction.md](./instruction.md) - 基础操作指令
- [nginx.conf](./nginx.conf) - Nginx配置参考

---

*最后更新：2024年3月19日*
*版本：v2.0*

如有任何问题，请参考项目文档或联系技术支持团队。
