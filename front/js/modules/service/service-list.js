/**
 * 服务记录列表模块
 */
import dataService from '../../services/data-service.js';
import { formatDate, showToast } from '../../utils/ui-utils.js';
import { createChart, destroyChart, formatCurrency, generateChartColors } from '../../utils/chart-utils.js';

class ServiceList {
  constructor() {
    // 初始化属性
    this.services = [];
    this.stats = null;
    this.currentPage = 1;
    this.serviceTable = null;
    this.serviceTypeChart = null;
    this.therapistWorkloadChart = null;
    this.filters = {
      startDate: '',
      endDate: '',
      serviceType: '',
      therapist: ''
    };
    
    // 绑定方法
    this.loadServices = this.loadServices.bind(this);
    this.loadStats = this.loadStats.bind(this);
    this.renderServiceTable = this.renderServiceTable.bind(this);
    this.setupCharts = this.setupCharts.bind(this);
    this.setupEventListeners = this.setupEventListeners.bind(this);
    this.handleDelete = this.handleDelete.bind(this);
    this.applyFilters = this.applyFilters.bind(this);
    this.handleFilterChange = this.handleFilterChange.bind(this);
    this.formatPaymentMethod = this.formatPaymentMethod.bind(this);
    this.checkSessionErrors = this.checkSessionErrors.bind(this);
  }
  
  /**
   * 初始化模块
   */
  async init() {
    try {
      // 检查是否有来自其他页面的错误消息
      this.checkSessionErrors();
      
      this.showLoading('正在加载服务记录...');
      
      // 初始化DataTable
      this.initDataTable();
      
      // 设置事件监听器
      this.setupEventListeners();
      
      try {
        // 加载服务记录数据
        await this.loadServices();
      } catch (servicesError) {
        console.error('加载服务记录失败:', servicesError);
        showToast('加载服务记录失败，请刷新页面重试', 'danger');
      }
      
      try {
        // 加载统计数据
        await this.loadStats();
      } catch (statsError) {
        console.error('加载统计数据失败，但不影响服务列表功能:', statsError);
        showToast('加载统计数据失败，将显示默认值', 'warning');
        
        // 确保有默认的统计数据可供使用
        this.stats = {
          today: { serviceCount: 0, income: 0 },
          month: { serviceCount: 0, growthRate: 0 },
          serviceTypes: [],
          therapistWorkload: []
        };
      }
      
      // 图表设置放在try-catch块中，防止图表错误影响主功能
      try {
        if (this.stats) {
          // 设置图表
          this.setupCharts();
        }
      } catch (chartError) {
        console.error('设置图表失败:', chartError);
      }
      
      this.hideLoading();
    } catch (error) {
      console.error('初始化服务记录列表失败:', error);
      this.hideLoading();
      showToast('系统初始化失败，请刷新页面重试', 'danger');
    }
  }
  
  /**
   * 检查会话存储中的错误消息
   */
  checkSessionErrors() {
    // 检查详情页面错误
    const detailError = sessionStorage.getItem('serviceDetailError');
    if (detailError) {
      showToast(detailError, 'warning');
      sessionStorage.removeItem('serviceDetailError');
    }
    
    // 检查编辑页面错误
    const editError = sessionStorage.getItem('serviceEditError');
    if (editError) {
      showToast(editError, 'warning');
      sessionStorage.removeItem('serviceEditError');
    }
  }
  
  /**
   * 初始化DataTable
   */
  initDataTable() {
    const tableElement = document.getElementById('serviceTable');
    if (!tableElement) return;
    
    this.serviceTable = $(tableElement).DataTable({
      language: {
        "processing": "处理中...",
        "lengthMenu": "显示 _MENU_ 项结果",
        "zeroRecords": "没有匹配结果",
        "info": "显示第 _START_ 至 _END_ 项结果，共 _TOTAL_ 项",
        "infoEmpty": "显示第 0 至 0 项结果，共 0 项",
        "infoFiltered": "(由 _MAX_ 项结果过滤)",
        "search": "搜索:",
        "emptyTable": "表中数据为空",
        "paginate": {
          "first": "首页",
          "previous": "上一页",
          "next": "下一页",
          "last": "末页"
        },
        "aria": {
          "sortAscending": ": 以升序排列此列",
          "sortDescending": ": 以降序排列此列"
        }
      },
      order: [[0, 'desc']], // 默认按日期降序排序
      responsive: true,
      searching: true
    });
  }
  
  /**
   * 设置事件监听器
   */
  setupEventListeners() {
    // 删除服务记录按钮事件
    document.getElementById('confirmDeleteBtn')?.addEventListener('click', this.handleDelete);
    
    // 监听删除模态框显示事件，传递服务记录ID
    const deleteModal = document.getElementById('deleteServiceModal');
    if (deleteModal) {
      deleteModal.addEventListener('show.bs.modal', (event) => {
        // 获取触发模态框的按钮
        const button = event.relatedTarget;
        // 从按钮获取服务记录ID
        const serviceId = button.getAttribute('data-service-id');
        console.log('准备删除服务记录:', serviceId);
        
        // 将ID设置到确认删除按钮上
        const confirmButton = document.getElementById('confirmDeleteBtn');
        if (confirmButton) {
          confirmButton.setAttribute('data-service-id', serviceId);
        } else {
          console.error('找不到确认删除按钮');
        }
      });
    }
    
    // 时间范围筛选事件
    const dropdownItems = document.querySelectorAll('.dropdown-item');
    dropdownItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const range = e.target.textContent;
        this.handleTimeRangeFilter(range);
      });
    });
    
    // 筛选表单事件
    document.querySelectorAll('.service-filter')?.forEach(input => {
      input.addEventListener('change', this.handleFilterChange);
    });
    
    // 应用筛选按钮事件
    document.getElementById('applyFiltersBtn')?.addEventListener('click', this.applyFilters);
    
    // 重置筛选按钮事件
    document.getElementById('resetFiltersBtn')?.addEventListener('click', () => {
      // 重置筛选表单
      document.querySelectorAll('.service-filter').forEach(input => {
        input.value = '';
      });
      this.filters = {
        startDate: '',
        endDate: '',
        serviceType: '',
        therapist: ''
      };
      this.applyFilters();
    });
  }
  
  /**
   * 处理时间范围筛选
   * @param {string} range 时间范围文本
   */
  handleTimeRangeFilter(range) {
    const today = new Date();
    const formattedToday = formatDate(today, 'yyyy-MM-dd');
    
    switch (range) {
      case '今日服务':
        this.filters.startDate = formattedToday;
        this.filters.endDate = formattedToday;
        break;
      case '本周服务':
        // 计算本周的起始日期（周一）
        const firstDayOfWeek = new Date(today);
        const day = today.getDay() || 7; // 获取星期几，如果是0（周日）则设为7
        firstDayOfWeek.setDate(today.getDate() - day + 1); // 设置为本周一
        
        this.filters.startDate = formatDate(firstDayOfWeek, 'yyyy-MM-dd');
        this.filters.endDate = formattedToday;
        break;
      case '本月服务':
        // 计算本月的起始日期
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        
        this.filters.startDate = formatDate(firstDayOfMonth, 'yyyy-MM-dd');
        this.filters.endDate = formattedToday;
        break;
      case '自定义时间...':
        // 显示日期选择器
        return;
    }
    
    // 更新筛选表单
    if (document.getElementById('startDate')) {
      document.getElementById('startDate').value = this.filters.startDate;
    }
    if (document.getElementById('endDate')) {
      document.getElementById('endDate').value = this.filters.endDate;
    }
    
    // 应用筛选
    this.applyFilters();
  }
  
  /**
   * 处理筛选条件变化
   * @param {Event} event 事件对象
   */
  handleFilterChange(event) {
    const { name, value } = event.target;
    this.filters[name] = value;
  }
  
  /**
   * 应用筛选条件
   */
  async applyFilters() {
    try {
      this.showLoading('正在筛选服务记录...');
      await this.loadServices();
      this.hideLoading();
    } catch (error) {
      console.error('应用筛选条件出错:', error);
      this.hideLoading();
      showToast('筛选服务记录失败，请重试', 'danger');
    }
  }
  
  /**
   * 加载服务记录数据
   */
  async loadServices() {
    try {
      // 构建查询参数
      const query = {
        ...this.filters,
        page: this.currentPage
      };
      
      // 调用API获取服务记录
      const response = await dataService.getServices(query);
      
      // 更新服务记录数据
      this.services = response.data;
      
      // 渲染服务记录表格
      this.renderServiceTable();
      
      return response;
    } catch (error) {
      console.error('加载服务记录出错:', error);
      showToast('加载服务记录失败，请重试', 'danger');
      throw error;
    }
  }
  
  /**
   * 加载统计数据
   */
  async loadStats() {
    // 默认的统计数据结构
    const defaultStats = {
      today: { serviceCount: 0, income: 0 },
      month: { serviceCount: 0, growthRate: 0 },
      serviceTypes: [
        { _id: '小儿推拿', count: 0 },
        { _id: '艾灸调理', count: 0 }
      ],
      therapistWorkload: [
        { _id: '暂无数据', count: 0, name: '暂无医师数据' }
      ]
    };
    
    try {
      console.log('正在加载统计数据...');
      
      // 获取统计数据
      const response = await dataService.getServiceStats();
      console.log('统计数据API原始响应:', JSON.stringify(response));
      
      // 检查响应数据结构
      if (!response || !response.data) {
        console.warn('API返回的统计数据为空或格式不正确，使用默认数据');
        this.stats = defaultStats;
        this.updateStatsCards();
        return this.stats;
      }
      
      // 抽取响应中的数据部分
      this.stats = response.data;
      console.log('解析后的统计数据:', JSON.stringify(this.stats));
      
      // 验证关键数据结构是否完整
      if (!this.stats.today) {
        console.warn('统计数据缺少today字段，使用默认值');
        this.stats.today = defaultStats.today;
      }
      
      if (!this.stats.month) {
        console.warn('统计数据缺少month字段，使用默认值');
        this.stats.month = defaultStats.month;
      }
      
      if (!this.stats.serviceTypes || !Array.isArray(this.stats.serviceTypes) || this.stats.serviceTypes.length === 0) {
        console.warn('统计数据缺少serviceTypes字段或为空数组，使用默认值');
        this.stats.serviceTypes = defaultStats.serviceTypes;
      }
      
      if (!this.stats.therapistWorkload || !Array.isArray(this.stats.therapistWorkload) || this.stats.therapistWorkload.length === 0) {
        console.warn('统计数据缺少therapistWorkload字段或为空数组，使用默认值');
        this.stats.therapistWorkload = defaultStats.therapistWorkload;
      }
      
      // 验证数值是否有效
      if (typeof this.stats.today.serviceCount !== 'number') {
        console.warn('today.serviceCount不是数字，设为0');
        this.stats.today.serviceCount = 0;
      }
      
      if (typeof this.stats.today.income !== 'number') {
        console.warn('today.income不是数字，设为0');
        this.stats.today.income = 0;
      }
      
      if (typeof this.stats.month.serviceCount !== 'number') {
        console.warn('month.serviceCount不是数字，设为0');
        this.stats.month.serviceCount = 0;
      }
      
      if (typeof this.stats.month.growthRate !== 'number') {
        console.warn('month.growthRate不是数字，设为0');
        this.stats.month.growthRate = 0;
      }
      
      console.log('统计数据处理完成:', JSON.stringify(this.stats));
      
      // 更新统计卡片
      this.updateStatsCards();
      
      return this.stats;
    } catch (error) {
      console.error('加载统计数据出错:', error);
      
      // 使用默认数据
      this.stats = defaultStats;
      
      // 尝试安全地更新UI
      try {
        this.updateStatsCards();
      } catch (uiError) {
        console.error('更新统计卡片UI失败:', uiError);
      }
      
      showToast('加载统计数据失败，将显示默认值', 'warning');
      return this.stats;
    }
  }
  
  /**
   * 更新统计卡片
   */
  updateStatsCards() {
    if (!this.stats) return;
    
    const { today, month } = this.stats;
    
    // 更新今日服务数
    const todayServiceCountElement = document.querySelector('.border-left-primary .h5');
    if (todayServiceCountElement) {
      todayServiceCountElement.textContent = `${today.serviceCount}人次`;
    }
    
    // 更新今日服务收入
    const todayIncomeElement = document.querySelector('.border-left-success .h5');
    if (todayIncomeElement) {
      todayIncomeElement.textContent = formatCurrency(today.income);
    }
    
    // 更新本月累计服务
    const monthServiceCountElement = document.querySelector('.border-left-info .h5');
    if (monthServiceCountElement) {
      monthServiceCountElement.textContent = `${month.serviceCount}人次`;
    }
    
    // 更新环比增长
    const growthElement = document.querySelector('.border-left-warning .h5');
    if (growthElement) {
      growthElement.textContent = `${month.growthRate > 0 ? '+' : ''}${month.growthRate}%`;
      growthElement.classList.remove('text-success', 'text-danger', 'text-warning');
      
      if (month.growthRate > 0) {
        growthElement.classList.add('text-success');
      } else if (month.growthRate < 0) {
        growthElement.classList.add('text-danger');
      } else {
        growthElement.classList.add('text-warning');
      }
    }
    
    // 设置完统计卡片后设置图表
    this.setupCharts();
  }
  
  /**
   * 渲染服务记录表格
   */
  renderServiceTable() {
    if (!this.serviceTable) return;
    
    // 清空表格
    this.serviceTable.clear();
    
    // 添加服务记录数据
    this.services.forEach(service => {
      const serviceDate = new Date(service.serviceDate);
      const formattedDate = formatDate(serviceDate, 'yyyy-MM-dd');
      const formattedTime = `${String(serviceDate.getHours()).padStart(2, '0')}:${String(serviceDate.getMinutes()).padStart(2, '0')}`;
      
      // 获取客户信息
      const customerName = service.customer ? service.customer.childName : '未知客户';
      const customerAge = service.customer ? `${service.customer.childAge}岁` : '-';
      
      // 获取医师信息
      let therapistDisplay = '-';
      if (service.therapist) {
        if (typeof service.therapist === 'object') {
          therapistDisplay = service.therapist.name + (service.therapist.title ? ` (${service.therapist.title})` : '');
        } else {
          therapistDisplay = service.therapist;
        }
      }
      
      this.serviceTable.row.add([
        formattedDate,
        formattedTime,
        service.customer ? `<a href="customer-detail.html?id=${service.customer._id}">${customerName}</a>` : customerName,
        customerAge,
        service.serviceType,
        therapistDisplay,
        formatCurrency(service.serviceFee),
        this.formatPaymentMethod(service.paymentMethod),
        `<div class="btn-group btn-group-sm">
          <a href="service-detail.html?id=${service._id}" class="btn btn-outline-primary">查看</a>
          <a href="service-edit.html?id=${service._id}" class="btn btn-outline-secondary">编辑</a>
          <button type="button" class="btn btn-outline-danger" data-bs-toggle="modal" data-bs-target="#deleteServiceModal" data-service-id="${service._id}">删除</button>
         </div>`
      ]);
    });
    
    // 重新绘制表格
    this.serviceTable.draw();
  }
  
  /**
   * 格式化支付方式
   * @param {string} method 支付方式
   * @returns {string} 格式化后的支付方式文本
   */
  formatPaymentMethod(method) {
    const methodMap = {
      'cash': '现金',
      'card': '银行卡',
      'membership': '会员卡',
      'wechat': '微信支付',
      'alipay': '支付宝',
      'other': '其他'
    };
    
    return methodMap[method] || method;
  }
  
  /**
   * 设置图表
   */
  setupCharts() {
    console.log('开始设置图表');
    
    // 确保图表容器存在
    const serviceTypeChartContainer = document.querySelector('#serviceTypeChart')?.parentElement;
    const therapistChartContainer = document.querySelector('#therapistWorkloadChart')?.parentElement;
    
    if (!serviceTypeChartContainer || !therapistChartContainer) {
      console.error('找不到图表容器元素');
      return;
    }
    
    // 显示加载指示器
    this.showChartLoading(serviceTypeChartContainer, '正在加载服务类型图表...');
    this.showChartLoading(therapistChartContainer, '正在加载医师工作量图表...');
    
    // 先检查统计数据是否存在
    if (!this.stats) {
      console.warn('无法设置图表：统计数据不存在，尝试重新加载');
      
      // 尝试再次加载统计数据
      this.loadStats().then(() => {
        // 如果成功加载了统计数据，重新调用setupCharts
        if (this.stats) {
          console.log('统计数据已重新加载，继续设置图表');
          this.setupCharts();
        } else {
          this.hideChartLoading(serviceTypeChartContainer, '无法加载统计数据');
          this.hideChartLoading(therapistChartContainer, '无法加载统计数据');
        }
      }).catch(error => {
        console.error('重新加载统计数据失败:', error);
        this.hideChartLoading(serviceTypeChartContainer, '无法加载统计数据');
        this.hideChartLoading(therapistChartContainer, '无法加载统计数据');
      });
      
      return;
    }
    
    // 检查Chart.js是否已加载
    if (typeof Chart === 'undefined') {
      console.error('Chart.js库未加载，无法创建图表');
      
      this.hideChartLoading(serviceTypeChartContainer, 'Chart.js库加载失败，请刷新页面');
      this.hideChartLoading(therapistChartContainer, 'Chart.js库加载失败，请刷新页面');
      return;
    }
    
    // 创建图表
    this.createCharts();
  }
  
  /**
   * 创建所有图表
   */
  createCharts() {
    try {
      // 服务类型分布图表
      this.setupServiceTypeChart();
    } catch (error) {
      console.error('创建服务类型图表失败:', error);
      const container = document.querySelector('#serviceTypeChart')?.parentElement;
      if (container) {
        this.hideChartLoading(container, `图表创建失败: ${error.message}`);
      }
    }
    
    try {
      // 医师工作量图表
      this.setupTherapistWorkloadChart();
    } catch (error) {
      console.error('创建医师工作量图表失败:', error);
      const container = document.querySelector('#therapistWorkloadChart')?.parentElement;
      if (container) {
        this.hideChartLoading(container, `图表创建失败: ${error.message}`);
      }
    }
  }
  
  /**
   * 设置服务类型分布图表
   */
  setupServiceTypeChart() {
    console.log('设置服务类型图表');
    
    // 获取图表容器
    const canvas = document.getElementById('serviceTypeChart');
    const container = canvas?.parentElement;
    if (!container) {
      console.error('找不到服务类型图表容器');
      return;
    }
    
    // 使用图表工具函数销毁旧图表
    destroyChart(this.serviceTypeChart);
    
    // 准备图表数据
    let chartData = null;
    
    try {
      // 尝试从stats获取数据
      const serviceTypes = this.stats?.serviceTypes || [];
      console.log('服务类型数据:', JSON.stringify(serviceTypes));
      
      if (serviceTypes.length > 0) {
        // 使用有效的服务类型数据
        const labels = serviceTypes.map(type => type._id || '未分类');
        const values = serviceTypes.map(type => type.count || 0);
        
        console.log('图表标签:', labels);
        console.log('图表数据值:', values);
        
        chartData = {
          labels: labels,
          datasets: [{
            data: values,
            backgroundColor: generateChartColors(labels.length),
            borderWidth: 1
          }]
        };
      } else {
        console.warn('服务类型数据为空，使用占位符数据');
        // 使用占位符数据
        chartData = {
          labels: ['暂无数据'],
          datasets: [{
            data: [1],
            backgroundColor: ['rgba(200, 200, 200, 0.7)'],
            borderWidth: 1
          }]
        };
      }
      
      // 图表配置
      const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            display: true
          },
          tooltip: {
            enabled: true
          },
          title: {
            display: serviceTypes.length === 0,
            text: '暂无服务类型数据',
            font: {
              size: 16
            }
          }
        }
      };
      
      console.log('开始创建服务类型图表');
      // 创建图表
      this.serviceTypeChart = createChart('serviceTypeChart', 'pie', chartData, options);
      console.log('服务类型图表创建结果:', this.serviceTypeChart ? '成功' : '失败');
      
      // 隐藏加载指示器
      this.hideChartLoading(container);
    } catch (error) {
      console.error('准备服务类型图表数据时出错:', error);
      // 显示错误消息
      this.hideChartLoading(container, `图表创建失败: ${error.message}`);
    }
  }
  
  /**
   * 设置医师工作量图表
   */
  setupTherapistWorkloadChart() {
    console.log('设置医师工作量图表');
    
    const canvas = document.getElementById('therapistWorkloadChart');
    const container = canvas?.parentElement;
    if (!container) {
      console.error('找不到医师工作量图表容器');
      return;
    }
    
    // 显示加载状态
    this.showChartLoading(container, '加载医师工作量数据...');
    
    try {
      // 检查是否有医师工作量数据
      if (!this.stats || !this.stats.therapistWorkload || !Array.isArray(this.stats.therapistWorkload) || this.stats.therapistWorkload.length === 0) {
        console.warn('医师工作量数据不存在或为空');
        this.hideChartLoading(container, '暂无医师工作量数据');
        return;
      }
      
      console.log('医师工作量数据:', JSON.stringify(this.stats.therapistWorkload));
      
      // 处理医师工作量数据
      const therapistData = this.stats.therapistWorkload.slice(0, 10); // 最多显示10个医师
      
      // 提取医师名称和工作量
      const labels = therapistData.map(item => {
        // 处理医师名称显示
        if (item.name) {
          return item.name + (item.title ? ` (${item.title})` : '');
        } else if (item._id) {
          // 处理MongoDB ObjectId情况
          if (typeof item._id === 'object') {
            return '未知医师';
          } else {
            return String(item._id);
          }
        } else {
          return '未知医师';
        }
      });
      
      const data = therapistData.map(item => Number(item.count) || 0);
      
      console.log('医师工作量图表数据处理完成:', { labels, data });
      
      // 安全地清除旧图表实例
      if (this.therapistWorkloadChart) {
        try {
          this.therapistWorkloadChart.destroy();
        } catch (destroyError) {
          console.warn('销毁旧图表实例出错:', destroyError);
        }
        this.therapistWorkloadChart = null;
      }
      
      // 验证Chart.js可用性
      if (typeof Chart === 'undefined') {
        console.error('Chart.js未加载，无法创建图表');
        this.hideChartLoading(container, 'Chart.js库加载失败');
        return;
      }
      
      // 确保canvas元素存在且可用
      if (!canvas || !canvas.getContext) {
        console.error('Canvas元素无效或不支持getContext');
        this.hideChartLoading(container, '无法创建图表：浏览器不支持Canvas');
        return;
      }
      
      // 重置canvas大小
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = 300;
      
      // 尝试获取2D上下文
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error('无法获取canvas 2D上下文');
        this.hideChartLoading(container, '无法创建图表：Canvas上下文获取失败');
        return;
      }
      
      console.log('开始创建医师工作量图表...');
      
      // 创建新的图表
      this.therapistWorkloadChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: '服务次数',
            data: data,
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            title: {
              display: true,
              text: '本月医师工作量统计',
              font: {
                size: 16
              }
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return `服务次数: ${context.raw}`;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                precision: 0
              }
            }
          }
        }
      });
      
      console.log('医师工作量图表创建成功');
      
      // 隐藏加载状态
      this.hideChartLoading(container);
      
    } catch (error) {
      console.error('设置医师工作量图表出错:', error);
      this.hideChartLoading(container, `加载图表失败: ${error.message || '未知错误'}`);
    }
  }
  
  /**
   * 显示图表加载指示器
   * @param {HTMLElement} container 图表容器
   * @param {string} message 加载提示信息
   */
  showChartLoading(container, message = '加载中...') {
    if (!container) return;
    
    // 移除可能存在的旧加载指示器
    container.querySelectorAll('.chart-loading').forEach(el => el.remove());
    
    // 创建新的加载指示器
    const loadingEl = document.createElement('div');
    loadingEl.className = 'chart-loading';
    loadingEl.innerHTML = `
      <div class="d-flex flex-column align-items-center">
        <div class="spinner-border text-primary mb-2" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <div>${message}</div>
      </div>
    `;
    
    container.appendChild(loadingEl);
  }
  
  /**
   * 隐藏图表加载指示器
   * @param {HTMLElement} container 图表容器
   * @param {string} errorMessage 如果提供，则显示错误消息而不是隐藏加载指示器
   */
  hideChartLoading(container, errorMessage = null) {
    if (!container) return;
    
    // 移除加载指示器
    container.querySelectorAll('.chart-loading').forEach(el => el.remove());
    
    // 如果有错误消息，显示错误提示
    if (errorMessage) {
      // 移除可能存在的旧错误消息
      container.querySelectorAll('.alert').forEach(el => el.remove());
      
      const errorEl = document.createElement('div');
      errorEl.className = 'alert alert-warning mt-2';
      errorEl.textContent = errorMessage;
      container.appendChild(errorEl);
      
      // 隐藏可能导致问题的canvas
      const canvas = container.querySelector('canvas');
      if (canvas) {
        canvas.style.display = 'none';
      }
    }
  }
  
  /**
   * 处理删除服务记录
   */
  async handleDelete() {
    try {
      const deleteModal = document.getElementById('deleteServiceModal');
      // 获取确认按钮上的服务记录ID
      const confirmButton = document.getElementById('confirmDeleteBtn');
      const serviceId = confirmButton?.getAttribute('data-service-id');
      
      if (!serviceId) {
        console.error('未找到要删除的服务记录ID');
        showToast('删除失败：无法确定要删除的记录', 'danger');
        
        // 隐藏模态框
        if (deleteModal) {
          const bsModal = bootstrap.Modal.getInstance(deleteModal);
          bsModal?.hide();
        }
        return;
      }
      
      console.log(`开始删除服务记录，ID: ${serviceId}`);
      this.showLoading('正在删除服务记录...');
      
      // 调用API删除服务记录
      await dataService.deleteService(serviceId);
      
      // 关闭模态框
      if (deleteModal) {
        const bsModal = bootstrap.Modal.getInstance(deleteModal);
        if (bsModal) {
          bsModal.hide();
        } else {
          console.warn('无法获取模态框实例');
          deleteModal.classList.remove('show');
          deleteModal.style.display = 'none';
          document.body.classList.remove('modal-open');
          const backdrop = document.querySelector('.modal-backdrop');
          if (backdrop) backdrop.remove();
        }
      }
      
      // 重新加载服务记录
      await this.loadServices();
      
      // 重新加载统计数据
      await this.loadStats();
      
      // 更新图表
      this.setupCharts();
      
      this.hideLoading();
      showToast('服务记录删除成功', 'success');
    } catch (error) {
      console.error('删除服务记录出错:', error);
      this.hideLoading();
      showToast(`删除服务记录失败: ${error.message || '未知错误'}`, 'danger');
      
      // 尝试关闭模态框
      const deleteModal = document.getElementById('deleteServiceModal');
      if (deleteModal) {
        try {
          const bsModal = bootstrap.Modal.getInstance(deleteModal);
          if (bsModal) bsModal.hide();
        } catch (e) {
          console.warn('关闭模态框失败:', e);
        }
      }
    } finally {
      // 清除确认按钮上的ID
      const confirmButton = document.getElementById('confirmDeleteBtn');
      if (confirmButton) {
        confirmButton.removeAttribute('data-service-id');
      }
    }
  }
  
  /**
   * 显示加载状态
   * @param {string} message 加载提示信息
   */
  showLoading(message = '加载中...') {
    // 如果页面上有loading元素，显示它
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
      loadingElement.textContent = message;
      loadingElement.style.display = 'flex';
    }
  }
  
  /**
   * 隐藏加载状态
   */
  hideLoading() {
    // 隐藏loading元素
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
      loadingElement.style.display = 'none';
    }
  }
  
  /**
   * 手动刷新所有图表（公共方法，可从控制台调用）
   */
  refreshCharts() {
    console.log('手动刷新图表');
    try {
      // 重新加载统计数据
      this.loadStats().then(() => {
        console.log('统计数据已重新加载，开始刷新图表');
        // 重新创建图表
        this.createCharts();
        console.log('图表刷新完成');
      }).catch(error => {
        console.error('刷新图表时加载统计数据失败:', error);
      });
    } catch (error) {
      console.error('手动刷新图表失败:', error);
    }
  }
}

// 初始化模块
document.addEventListener('DOMContentLoaded', () => {
  const serviceList = new ServiceList();
  serviceList.init();
  
  // 将实例暴露给全局，方便调试
  window.serviceListInstance = serviceList;
});

export default ServiceList; 