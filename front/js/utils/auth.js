/**
 * 认证工具文件
 * 用于检查用户是否已登录，及处理登录相关功能
 */

// 检查用户是否已登录
function checkAuth() {
  const token = localStorage.getItem('token');
  if (!token) {
    // 如果没有token，重定向到登录页面
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

// 获取当前登录用户信息
function getCurrentUser() {
  try {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('解析用户数据错误:', error);
    return null;
  }
}

// 获取用户显示名称
function getUserDisplayName() {
  const user = getCurrentUser();
  return user ? (user.name || user.username) : '未登录';
}

// 获取用户角色
function getUserRole() {
  const user = getCurrentUser();
  return user ? user.role : null;
}

// 获取用户ID
function getUserId() {
  const user = getCurrentUser();
  return user ? user._id : null;
}

// 检查用户是否有权限
function hasPermission(requiredRoles) {
  const userRole = getUserRole();
  if (!userRole) return false;
  
  // 如果没有指定所需角色，或者用户是管理员，则授予权限
  if (!requiredRoles || requiredRoles.length === 0 || userRole === 'admin') {
    return true;
  }
  
  // 检查用户角色是否在所需角色列表中
  return requiredRoles.includes(userRole);
}

// 退出登录
function logout() {
  // 清除本地存储
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  
  // 重定向到登录页面
  window.location.href = 'login.html';
}

// 导出工具函数
window.authUtils = {
  checkAuth,
  getCurrentUser,
  getUserDisplayName,
  getUserRole,
  getUserId,
  hasPermission,
  logout
}; 