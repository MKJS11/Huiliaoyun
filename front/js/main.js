/**
 * 中医小儿推拿管理系统主JavaScript文件
 * 包含全局通用功能
 */

// 初始化页面基础功能
document.addEventListener('DOMContentLoaded', function() {
  // 侧边栏切换按钮
  const sidebarToggleBtn = document.getElementById('sidebarToggle');
  if (sidebarToggleBtn) {
    sidebarToggleBtn.addEventListener('click', function() {
      document.body.classList.toggle('sidebar-collapsed');
      const sidebar = document.getElementById('sidebar');
      if (sidebar) {
        sidebar.classList.toggle('collapse');
      }
    });
  }
  
  // 响应式侧边栏处理
  function handleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
      if (window.innerWidth < 768) {
        sidebar.classList.add('collapse');
      } else {
        sidebar.classList.remove('collapse');
      }
    }
  }
  
  // 窗口大小改变时处理侧边栏
  window.addEventListener('resize', handleSidebar);
  
  // 初始加载时处理侧边栏
  handleSidebar();
  
  // 初始化工具提示
  initTooltips();
  
  // 初始化Toast容器
  createToastContainer();
});

/**
 * 初始化Bootstrap工具提示
 */
function initTooltips() {
  const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
  if (tooltipTriggerList.length > 0) {
    const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => {
      return new bootstrap.Tooltip(tooltipTriggerEl);
    });
  }
}

/**
 * 创建Toast通知容器
 */
function createToastContainer() {
  if (!document.getElementById('toastContainer')) {
    const toastContainer = document.createElement('div');
    toastContainer.id = 'toastContainer';
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }
}

/**
 * 显示Toast通知
 * @param {string} message - 通知消息
 * @param {string} type - 通知类型 (success, danger, warning, info)
 * @param {number} duration - 持续时间(毫秒)
 */
function showToast(message, type = 'info', duration = 3000) {
  let toastContainer = document.getElementById('toastContainer');
  
  if (!toastContainer) {
    createToastContainer();
    toastContainer = document.getElementById('toastContainer');
  }
  
  const toast = document.createElement('div');
  toast.className = `toast align-items-center text-white bg-${type} border-0`;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'assertive');
  toast.setAttribute('aria-atomic', 'true');
  
  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">
        ${message}
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
  `;
  
  toastContainer.appendChild(toast);
  
  const bsToast = new bootstrap.Toast(toast, {
    autohide: true,
    delay: duration
  });
  
  bsToast.show();
  
  // 自动移除
  toast.addEventListener('hidden.bs.toast', () => {
    toast.remove();
  });
}

/**
 * 获取URL参数
 * @param {string} name - 参数名
 * @returns {string|null} 参数值或null
 */
function getUrlParam(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

/**
 * 格式化日期
 * @param {Date|string} date - 日期对象或日期字符串
 * @param {string} format - 格式 (如 'yyyy-MM-dd')
 * @returns {string} 格式化后的日期字符串
 */
function formatDate(date, format = 'yyyy-MM-dd') {
  if (!date) return '';
  
  if (typeof date === 'string') {
    date = new Date(date);
  }
  
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return '';
  }
  
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  
  format = format.replace('yyyy', year);
  format = format.replace('MM', month.toString().padStart(2, '0'));
  format = format.replace('dd', day.toString().padStart(2, '0'));
  format = format.replace('HH', hours.toString().padStart(2, '0'));
  format = format.replace('mm', minutes.toString().padStart(2, '0'));
  format = format.replace('ss', seconds.toString().padStart(2, '0'));
  
  return format;
}

/**
 * 计算年龄
 * @param {string} birthdate - 出生日期字符串
 * @returns {string} 年龄文本
 */
function calculateAge(birthdate) {
  if (!birthdate) return '未知';
  
  const birth = new Date(birthdate);
  const now = new Date();
  
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  
  if (months < 0) {
    years--;
    months += 12;
  }
  
  if (years < 1) {
    return months + '个月';
  }
  
  return years + '岁' + (months > 0 ? months + '个月' : '');
}

/**
 * 标签页切换函数，供HTML内联onclick使用
 * @param {string} tabId 要激活的标签ID
 */
function nextTab(tabId) {
  console.log('全局nextTab函数被调用，目标标签:', tabId);
  
  if (!tabId) {
    console.error('标签ID为空');
    return;
  }
  
  try {
    // 获取标签触发元素
    const tabTrigger = document.getElementById(tabId);
    if (tabTrigger) {
      const bsTab = new bootstrap.Tab(tabTrigger);
      bsTab.show();
      return;
    }
    
    // 备用方法：手动处理DOM
    const tabPanelId = tabId.replace('-tab', '-info');
    
    // 隐藏所有标签页
    document.querySelectorAll('.tab-pane').forEach(pane => {
      pane.classList.remove('show', 'active');
    });
    
    // 取消所有标签激活状态
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
      link.setAttribute('aria-selected', 'false');
    });
    
    // 激活目标标签
    const targetTab = document.getElementById(tabId);
    if (targetTab) {
      targetTab.classList.add('active');
      targetTab.setAttribute('aria-selected', 'true');
    }
    
    // 显示目标面板
    const targetPane = document.getElementById(tabPanelId);
    if (targetPane) {
      targetPane.classList.add('show', 'active');
    }
  } catch (error) {
    console.error('标签切换出错:', error);
  }
}

// 导出全局函数
window.showToast = showToast;
window.getUrlParam = getUrlParam;
window.formatDate = formatDate;
window.calculateAge = calculateAge;
window.nextTab = nextTab; 