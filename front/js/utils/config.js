/**
 * 系统配置文件
 * 根据当前环境自动选择API URL
 */
const Config = {
  // API基础URL
  getApiUrl: function() {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      // 本地开发环境
      return 'http://localhost:5201/api';
    } else {
      // 生产环境 - 使用相对路径或绝对路径
      // 使用相对路径，假设API和前端在同一域名下
      return '/api';
      // 或者使用绝对路径
      // return 'https://huiliaoyun.site/api';
    }
  }
};

// 导出配置对象
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Config;
} else {
  window.Config = Config;
} 