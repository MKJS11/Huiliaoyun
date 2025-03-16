/**
 * 侧边栏管理模块
 * 处理侧边栏的折叠和展开功能
 */

document.addEventListener('DOMContentLoaded', function() {
  // 初始化侧边栏状态
  initSidebar();
  
  // 如果存在侧边栏切换按钮，设置切换事件
  setupSidebarToggle();
  
  // 设置当前页面对应的导航项为激活状态
  highlightCurrentPageNav();
});

/**
 * 初始化侧边栏状态
 */
function initSidebar() {
  // 获取侧边栏元素
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;
  
  // 在移动设备上默认折叠侧边栏
  if (window.innerWidth < 768) {
    sidebar.classList.add('collapse');
  } else {
    sidebar.classList.remove('collapse');
  }
  
  // 监听窗口大小变化，调整侧边栏状态
  window.addEventListener('resize', function() {
    if (window.innerWidth < 768) {
      sidebar.classList.add('collapse');
    } else {
      sidebar.classList.remove('collapse');
    }
  });
}

/**
 * 设置侧边栏切换按钮事件
 */
function setupSidebarToggle() {
  // 获取侧边栏切换按钮
  const sidebarToggle = document.getElementById('sidebarToggle');
  if (!sidebarToggle) return;
  
  // 获取侧边栏元素
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;
  
  // 设置切换按钮点击事件
  sidebarToggle.addEventListener('click', function() {
    sidebar.classList.toggle('collapse');
  });
}

/**
 * 根据当前页面URL高亮对应的导航项
 */
function highlightCurrentPageNav() {
  // 获取当前页面的文件名
  const currentPage = window.location.pathname.split('/').pop();
  
  // 获取所有导航链接
  const navLinks = document.querySelectorAll('.nav-link');
  
  // 遍历所有导航链接，移除激活状态
  navLinks.forEach(link => {
    link.classList.remove('active');
  });
  
  // 寻找匹配当前页面的链接，添加激活状态
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href) {
      const linkPage = href.split('/').pop();
      if (currentPage === linkPage || 
          (currentPage.includes('service-') && linkPage === 'service.html') ||
          (currentPage.includes('customer-') && linkPage === 'customer.html') ||
          (currentPage.includes('membership-') && linkPage === 'membership.html')) {
        link.classList.add('active');
      }
    }
  });
}

// 导出一个空对象，以便作为模块导入
export default {}; 