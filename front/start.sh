#!/bin/bash

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的信息
info() {
  echo -e "${BLUE}[信息]${NC} $1"
}

success() {
  echo -e "${GREEN}[成功]${NC} $1"
}

warn() {
  echo -e "${YELLOW}[警告]${NC} $1"
}

error() {
  echo -e "${RED}[错误]${NC} $1"
}

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
  error "未找到Node.js，请先安装Node.js"
  exit 1
fi

# 项目根目录
BASEDIR=$(dirname "$0")
cd "$BASEDIR"
FRONTEND_DIR="$(pwd)"
BACKEND_DIR="../@back"

# 检查后端目录是否存在
if [ ! -d "$BACKEND_DIR" ]; then
  error "后端目录不存在: $BACKEND_DIR"
  exit 1
fi

# 启动前端服务器
start_frontend() {
  info "正在启动前端服务器..."
  
  # 如果start-server.js存在，使用它
  if [ -f "./start-server.js" ]; then
    node start-server.js &
    FE_PID=$!
    success "前端服务器已启动 (PID: $FE_PID), 访问: http://localhost:8080"
  else
    # 尝试使用npx http-server
    if command -v npx &> /dev/null; then
      npx http-server -p 8080 -c-1 &
      FE_PID=$!
      success "前端服务器已启动 (PID: $FE_PID), 访问: http://localhost:8080"
    else
      # 尝试使用python
      if command -v python3 &> /dev/null; then
        python3 -m http.server 8080 &
        FE_PID=$!
        success "前端服务器(Python)已启动 (PID: $FE_PID), 访问: http://localhost:8080"
      elif command -v python &> /dev/null; then
        python -m SimpleHTTPServer 8080 &
        FE_PID=$!
        success "前端服务器(Python)已启动 (PID: $FE_PID), 访问: http://localhost:8080"
      else
        error "无法启动前端服务器，请安装Node.js或Python"
        exit 1
      fi
    fi
  fi
}

# 启动后端服务器
start_backend() {
  info "正在启动后端服务器..."
  
  # 转到后端目录
  cd "$BACKEND_DIR"
  
  # 检查package.json是否存在
  if [ ! -f "package.json" ]; then
    error "后端package.json不存在"
    exit 1
  fi
  
  # 启动后端服务
  npm start &
  BE_PID=$!
  
  # 返回前端目录
  cd "$FRONTEND_DIR"
  
  success "后端服务器已启动 (PID: $BE_PID), API地址: http://localhost:5201/api"
}

# 清理函数
cleanup() {
  info "正在关闭服务器..."
  
  if [ ! -z "$FE_PID" ]; then
    kill $FE_PID 2>/dev/null
    success "前端服务器已停止"
  fi
  
  if [ ! -z "$BE_PID" ]; then
    kill $BE_PID 2>/dev/null
    success "后端服务器已停止"
  fi
  
  exit 0
}

# 注册清理函数
trap cleanup INT TERM EXIT

# 启动服务器
start_backend
start_frontend

# 等待用户输入
info "服务器正在运行中，按 Ctrl+C 停止服务器"
info "========================================"
info "前端地址: http://localhost:8080"
info "后端API地址: http://localhost:5200/api"
info "========================================"

# 保持脚本运行
wait 