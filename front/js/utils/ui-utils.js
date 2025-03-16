/**
 * UI工具函数
 */

/**
 * 格式化日期
 * @param {Date|string} date 日期对象或日期字符串
 * @param {string} format 格式字符串，例如 'yyyy-MM-dd'
 * @returns {string} 格式化后的日期字符串
 */
export function formatDate(date, format = 'yyyy-MM-dd') {
  if (!date) return '';
  
  // 如果是字符串，转为日期对象
  if (typeof date === 'string') {
    date = new Date(date);
  }
  
  // 如果无效日期，返回空字符串
  if (isNaN(date.getTime())) {
    return '';
  }
  
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  
  // 替换格式字符串中的占位符
  return format
    .replace('yyyy', year)
    .replace('MM', month.toString().padStart(2, '0'))
    .replace('dd', day.toString().padStart(2, '0'))
    .replace('HH', hours.toString().padStart(2, '0'))
    .replace('mm', minutes.toString().padStart(2, '0'))
    .replace('ss', seconds.toString().padStart(2, '0'));
}

/**
 * 格式化金额
 * @param {number} amount 金额数值
 * @param {string} symbol 货币符号，默认为 '￥'
 * @returns {string} 格式化后的金额字符串
 */
export function formatCurrency(amount, symbol = '￥') {
  if (amount === undefined || amount === null) return `${symbol}0`;
  
  return `${symbol}${parseFloat(amount).toFixed(2)}`;
}

/**
 * 显示Toast提示消息
 * @param {string} message 提示消息
 * @param {string} type 提示类型（'success', 'danger', 'warning', 'info'）
 * @param {number} duration 显示时长，单位毫秒，默认3000ms
 */
export function showToast(message, type = 'info', duration = 3000) {
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toastMessage');
  const toastTitle = document.getElementById('toastTitle');
  
  if (!toast || !toastMessage) return;
  
  // 设置消息内容
  toastMessage.textContent = message;
  
  // 设置标题
  const titleMap = {
    'success': '成功',
    'danger': '错误',
    'warning': '警告',
    'info': '提示'
  };
  toastTitle.textContent = titleMap[type] || '提示';
  
  // 移除所有类型的背景色类
  toast.classList.remove('bg-success', 'bg-danger', 'bg-warning', 'bg-info', 'text-dark', 'text-white');
  
  // 添加对应类型的背景色类
  if (type === 'success') {
    toast.classList.add('bg-success', 'text-white');
  } else if (type === 'danger') {
    toast.classList.add('bg-danger', 'text-white');
  } else if (type === 'warning') {
    toast.classList.add('bg-warning', 'text-dark');
  } else {
    toast.classList.add('bg-info', 'text-white');
  }
  
  // 获取Bootstrap的toast实例并显示
  const bsToast = new bootstrap.Toast(toast, {
    autohide: true,
    delay: duration
  });
  bsToast.show();
}

/**
 * 确认对话框
 * @param {string} message 确认消息
 * @param {string} title 标题，默认为"确认"
 * @returns {Promise<boolean>} 用户确认结果
 */
export function confirmDialog(message, title = '确认') {
  return new Promise((resolve) => {
    if (window.confirm(`${title}\n\n${message}`)) {
      resolve(true);
    } else {
      resolve(false);
    }
  });
}

/**
 * 解析URL查询参数
 * @returns {Object} 查询参数对象
 */
export function getUrlParams() {
  const params = {};
  const queryString = window.location.search.substring(1);
  const pairs = queryString.split('&');
  
  for (const pair of pairs) {
    if (pair === '') continue;
    const parts = pair.split('=');
    params[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1] || '');
  }
  
  return params;
}

/**
 * 验证表单字段
 * @param {HTMLFormElement} form 表单元素
 * @returns {boolean} 验证结果
 */
export function validateForm(form) {
  // 使用HTML5原生表单验证
  if (!form.checkValidity()) {
    // 触发浏览器原生验证界面显示
    form.reportValidity();
    return false;
  }
  return true;
}

/**
 * 计算年龄
 * @param {string|Date} birthDate 出生日期
 * @returns {number} 年龄
 */
export function calculateAge(birthDate) {
  if (!birthDate) return 0;
  
  // 将出生日期转换为Date对象
  const birth = new Date(birthDate);
  
  // 如果日期无效，返回0
  if (isNaN(birth.getTime())) return 0;
  
  // 获取当前日期
  const now = new Date();
  
  // 计算粗略年龄
  let age = now.getFullYear() - birth.getFullYear();
  
  // 根据月份和日期进行调整
  if (
    now.getMonth() < birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())
  ) {
    age--;
  }
  
  return age;
} 