/**
 * 统计与数据分析模块
 */
import dataService from '../../services/data-service.js';
import { showToast, formatDate, formatCurrency } from '../../utils/ui-utils.js';

class Statistics {
  constructor() {
    // 初始化属性
    this.stats = null;
    this.dateRange = {
      start: null,
      end: null
    };
    this.charts = {
      revenueChart: null,
      incomeCompositionChart: null,
      cardRevenueChart: null,
      customerActivityChart: null,
      customerConstitutionChart: null
    };
    
    // 绑定方法
    this.init = this.init.bind(this);
    this.setupEventListeners = this.setupEventListeners.bind(this);
    this.loadStats = this.loadStats.bind(this);
    this.updateStatsCards = this.updateStatsCards.bind(this);
    this.renderCharts = this.renderCharts.bind(this);
    this.updateTherapistTable = this.updateTherapistTable.bind(this);
    this.updateInactiveCustomers = this.updateInactiveCustomers.bind(this);
    this.handleDateRangeChange = this.handleDateRangeChange.bind(this);
    this.handlePeriodButtonClick = this.handlePeriodButtonClick.bind(this);
    this.showLoading = this.showLoading.bind(this);
    this.hideLoading = this.hideLoading.bind(this);
  }
  
  /**
   * 初始化模块
   */
  async init() {
    try {
      this.showLoading('正在加载统计数据...');
      
      // 设置日期选择器
      this.setupDatePicker();
      
      // 设置事件监听
      this.setupEventListeners();
      
      // 设置初始日期范围为本月
      this.setCurrentMonthDateRange();
      
      // 加载统计数据
      await this.loadStats();
      
      // 更新统计卡片
      this.updateStatsCards();
      
      // 渲染图表
      this.renderCharts();
      
      // 更新推拿师绩效表格
      this.updateTherapistTable();
      
      // 更新未到店客户列表
      this.updateInactiveCustomers();
      
      this.hideLoading();
    } catch (error) {
      console.error('初始化统计与数据分析模块失败:', error);
      this.hideLoading();
      showToast('加载统计数据失败，请刷新页面重试', 'danger');
    }
  }
  
  /**
   * 设置日期选择器
   */
  setupDatePicker() {
    // 初始化日期范围选择器
    flatpickr("#dateRangePicker", {
      mode: "range",
      locale: "zh",
      dateFormat: "Y-m-d",
      defaultDate: [this.getMonthStartDate(), this.getMonthEndDate()],
      onChange: (selectedDates) => {
        if (selectedDates.length === 2) {
          this.dateRange.start = selectedDates[0];
          this.dateRange.end = selectedDates[1];
        }
      }
    });
  }
  
  /**
   * 设置当前月份的日期范围
   */
  setCurrentMonthDateRange() {
    this.dateRange.start = this.getMonthStartDate();
    this.dateRange.end = this.getMonthEndDate();
  }
  
  /**
   * 获取当月第一天
   * @returns {Date} 当月第一天
   */
  getMonthStartDate() {
    const date = new Date();
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
    return date;
  }
  
  /**
   * 获取当月最后一天
   * @returns {Date} 当月最后一天
   */
  getMonthEndDate() {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    date.setDate(0);
    date.setHours(23, 59, 59, 999);
    return date;
  }
  
  /**
   * 设置事件监听器
   */
  setupEventListeners() {
    // 应用日期按钮
    document.getElementById('applyDateBtn').addEventListener('click', () => {
      this.handleDateRangeChange();
    });
    
    // 日期快捷按钮组
    const periodButtons = document.querySelectorAll('.btn-group .btn-outline-secondary');
    periodButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        this.handlePeriodButtonClick(e);
      });
    });
    
    // 显示百分比开关
    const showPercentageSwitch = document.getElementById('showPercentageSwitch');
    if (showPercentageSwitch) {
      showPercentageSwitch.addEventListener('change', () => {
        this.updateConstitutionChartTooltip(showPercentageSwitch.checked);
      });
    }
  }
  
  /**
   * 处理日期范围变更
   */
  async handleDateRangeChange() {
    try {
      this.showLoading('正在更新统计数据...');
      
      // 加载新日期范围的数据
      await this.loadStats();
      
      // 更新UI
      this.updateStatsCards();
      this.renderCharts();
      this.updateTherapistTable();
      
      this.hideLoading();
      showToast('统计数据已更新', 'success');
    } catch (error) {
      console.error('更新日期范围数据失败:', error);
      this.hideLoading();
      showToast('更新统计数据失败: ' + (error.message || '未知错误'), 'danger');
    }
  }
  
  /**
   * 处理快捷日期按钮点击
   * @param {Event} event 点击事件
   */
  async handlePeriodButtonClick(event) {
    try {
      // 移除之前选中状态
      document.querySelectorAll('.btn-group .btn-outline-secondary').forEach(btn => {
        btn.classList.remove('active');
      });
      
      // 设置当前选中
      event.target.classList.add('active');
      
      // 根据选项设置日期范围
      const period = event.target.textContent.trim();
      const now = new Date();
      let startDate = new Date();
      let endDate = new Date();
      
      switch (period) {
        case '本月':
          startDate = this.getMonthStartDate();
          endDate = this.getMonthEndDate();
          break;
        case '上月':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          endDate = new Date(now.getFullYear(), now.getMonth(), 0);
          endDate.setHours(23, 59, 59, 999);
          break;
        case '本季度':
          const quarter = Math.floor(now.getMonth() / 3);
          startDate = new Date(now.getFullYear(), quarter * 3, 1);
          endDate = new Date(now.getFullYear(), quarter * 3 + 3, 0);
          endDate.setHours(23, 59, 59, 999);
          break;
        case '本年':
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = new Date(now.getFullYear(), 11, 31);
          endDate.setHours(23, 59, 59, 999);
          break;
      }
      
      // 更新日期范围
      this.dateRange.start = startDate;
      this.dateRange.end = endDate;
      
      // 更新日期选择器显示
      const dateRangePicker = document.getElementById('dateRangePicker');
      if (dateRangePicker && dateRangePicker._flatpickr) {
        dateRangePicker._flatpickr.setDate([startDate, endDate]);
      }
      
      // 加载新的统计数据
      this.showLoading('正在更新统计数据...');
      await this.loadStats();
      this.updateStatsCards();
      this.renderCharts();
      this.updateTherapistTable();
      this.hideLoading();
      
      showToast(`已切换到${period}统计数据`, 'success');
    } catch (error) {
      console.error('切换时间段失败:', error);
      this.hideLoading();
      showToast('切换时间段失败: ' + (error.message || '未知错误'), 'danger');
    }
  }
  
  /**
   * 加载统计数据
   */
  async loadStats() {
    try {
      // 构建查询参数
      const params = new URLSearchParams();
      if (this.dateRange.start) {
        params.append('startDate', this.dateRange.start.toISOString());
      }
      if (this.dateRange.end) {
        params.append('endDate', this.dateRange.end.toISOString());
      }
      
      console.log('正在加载统计数据，日期范围:', 
                 this.dateRange.start ? formatDate(this.dateRange.start) : '不限', 
                 '至', 
                 this.dateRange.end ? formatDate(this.dateRange.end) : '不限');
      
      // 获取统计数据
      const response = await dataService.getStatisticsData(params.toString());
      
      if (!response.success) {
        throw new Error(response.message || '获取统计数据失败');
      }
      
      this.stats = response.data || {};
      
      // 获取医师列表，用于匹配ID和姓名
      this.therapistList = await this.getTherapistList();
      
      console.log('已加载统计数据:', this.stats);
      
      return this.stats;
    } catch (error) {
      console.error('加载统计数据出错:', error);
      showToast('加载统计数据失败: ' + (error.message || '服务器错误'), 'warning');
      return null;
    }
  }
  
  /**
   * 获取医师列表
   * @returns {Promise<Array>} 医师列表
   */
  async getTherapistList() {
    try {
      const response = await dataService.getAllTherapists();
      return response.success ? response.data : [];
    } catch (error) {
      console.error('获取医师列表失败:', error);
      return [];
    }
  }
  
  /**
   * 更新统计卡片
   */
  updateStatsCards() {
    if (!this.stats) return;
    
    // 更新各个统计卡片
    const overview = this.stats.overview || {};
    
    // 本月服务人次
    const serviceCountEl = document.querySelector('.row.mb-4 .col-md-3:nth-child(1) .h5');
    if (serviceCountEl && overview.serviceCount !== undefined) {
      serviceCountEl.textContent = overview.serviceCount;
    }
    
    // 环比增长率
    const serviceGrowthEl = document.querySelector('.row.mb-4 .col-md-3:nth-child(1) .text-xs.text-success');
    if (serviceGrowthEl && overview.serviceGrowthRate !== undefined) {
      const growthRate = overview.serviceGrowthRate;
      serviceGrowthEl.textContent = `${growthRate >= 0 ? '↑' : '↓'}${Math.abs(growthRate).toFixed(1)}% 环比`;
      serviceGrowthEl.className = growthRate >= 0 ? 'text-xs text-success' : 'text-xs text-danger';
    }
    
    // 本月总收入
    const incomeEl = document.querySelector('.row.mb-4 .col-md-3:nth-child(2) .h5');
    if (incomeEl && overview.totalIncome !== undefined) {
      incomeEl.textContent = formatCurrency(overview.totalIncome);
    }
    
    // 收入环比增长率
    const incomeGrowthEl = document.querySelector('.row.mb-4 .col-md-3:nth-child(2) .text-xs.text-success');
    if (incomeGrowthEl && overview.incomeGrowthRate !== undefined) {
      const growthRate = overview.incomeGrowthRate;
      incomeGrowthEl.textContent = `${growthRate >= 0 ? '↑' : '↓'}${Math.abs(growthRate).toFixed(1)}% 环比`;
      incomeGrowthEl.className = growthRate >= 0 ? 'text-xs text-success' : 'text-xs text-danger';
    }
    
    // 本月新增会员
    const newMemberEl = document.querySelector('.row.mb-4 .col-md-3:nth-child(3) .h5');
    if (newMemberEl && overview.newMembers !== undefined) {
      newMemberEl.textContent = overview.newMembers;
    }
    
    // 会员环比增长率
    const memberGrowthEl = document.querySelector('.row.mb-4 .col-md-3:nth-child(3) .text-xs.text-success');
    if (memberGrowthEl && overview.memberGrowthRate !== undefined) {
      const growthRate = overview.memberGrowthRate;
      memberGrowthEl.textContent = `${growthRate >= 0 ? '↑' : '↓'}${Math.abs(growthRate).toFixed(1)}% 环比`;
      memberGrowthEl.className = growthRate >= 0 ? 'text-xs text-success' : 'text-xs text-danger';
    }
    
    // 平均客户评分
    const ratingEl = document.querySelector('.row.mb-4 .col-md-3:nth-child(4) .h5');
    if (ratingEl && overview.avgRating !== undefined) {
      ratingEl.innerHTML = `${overview.avgRating.toFixed(1)} <small>/5</small>`;
    }
    
    // 评分环比变化
    const ratingChangeEl = document.querySelector('.row.mb-4 .col-md-3:nth-child(4) .text-xs.text-success');
    if (ratingChangeEl && overview.ratingChange !== undefined) {
      const change = overview.ratingChange;
      ratingChangeEl.textContent = `${change >= 0 ? '↑' : '↓'}${Math.abs(change).toFixed(1)} 环比`;
      ratingChangeEl.className = change >= 0 ? 'text-xs text-success' : 'text-xs text-danger';
    }
  }
  
  /**
   * 渲染图表
   */
  renderCharts() {
    if (!this.stats) return;
    
    // 销毁现有图表实例
    this.destroyCharts();
    
    // 渲染营收趋势图表
    this.renderRevenueChart();
    
    // 渲染收入构成图表
    this.renderIncomeCompositionChart();
    
    // 渲染会员卡收入图表
    this.renderCardRevenueChart();
    
    // 渲染客户活跃度图表
    this.renderCustomerActivityChart();
    
    // 渲染客户体质分布图表
    this.renderCustomerConstitutionChart();
  }
  
  /**
   * 销毁所有图表实例
   */
  destroyCharts() {
    for (const chartKey in this.charts) {
      if (this.charts[chartKey]) {
        this.charts[chartKey].destroy();
        this.charts[chartKey] = null;
      }
    }
  }
  
  /**
   * 渲染营收趋势图表
   */
  renderRevenueChart() {
    const revenueData = this.stats.revenueTrend || [];
    const revenueCtx = document.getElementById('revenueChart');
    if (!revenueCtx || !revenueData.length) return;
    
    const labels = revenueData.map(item => item.period);
    const currentData = revenueData.map(item => item.amount);
    const previousData = revenueData.map(item => item.previousAmount || 0);
    
    this.charts.revenueChart = new Chart(revenueCtx.getContext('2d'), {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: '当期收入',
          data: currentData,
          borderColor: 'rgba(78, 115, 223, 1)',
          backgroundColor: 'rgba(78, 115, 223, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.1
        }, {
          label: '同期收入',
          data: previousData,
          borderColor: 'rgba(204, 204, 204, 1)',
          borderWidth: 2,
          borderDash: [5, 5],
          fill: false,
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              drawBorder: false,
              color: 'rgba(0, 0, 0, 0.05)'
            },
            ticks: {
              callback: function(value) {
                return '￥' + value.toLocaleString();
              }
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.dataset.label || '';
                const value = context.raw || 0;
                return `${label}: ￥${value.toLocaleString()}`;
              }
            }
          }
        }
      }
    });
  }
  
  /**
   * 渲染收入构成图表
   */
  renderIncomeCompositionChart() {
    const incomeData = this.stats.incomeComposition || [];
    const incomeCtx = document.getElementById('incomeCompositionChart');
    if (!incomeCtx || !incomeData.length) return;
    
    const labels = [];
    const data = [];
    const bgColors = [
      'rgba(78, 115, 223, 0.7)',
      'rgba(28, 200, 138, 0.7)',
      'rgba(246, 194, 62, 0.7)',
      'rgba(231, 74, 59, 0.7)'
    ];
    
    incomeData.forEach((item, index) => {
      labels.push(item.category);
      data.push(item.percentage);
    });
    
    this.charts.incomeCompositionChart = new Chart(incomeCtx.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: bgColors.slice(0, data.length),
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'right'
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.raw || 0;
                return `${label}: ${value}%`;
              }
            }
          }
        }
      }
    });
  }
  
  /**
   * 渲染会员卡收入图表
   */
  renderCardRevenueChart() {
    const cardData = this.stats.cardRevenue || [];
    const cardCtx = document.getElementById('cardRevenueChart');
    if (!cardCtx || !cardData.length) return;
    
    const labels = cardData.map(item => item.cardType);
    const newCardData = cardData.map(item => item.newCardAmount || 0);
    const renewalData = cardData.map(item => item.renewalAmount || 0);
    
    this.charts.cardRevenueChart = new Chart(cardCtx.getContext('2d'), {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: '新卡收入',
          data: newCardData,
          backgroundColor: 'rgba(78, 115, 223, 0.7)',
        }, {
          label: '续费收入',
          data: renewalData,
          backgroundColor: 'rgba(28, 200, 138, 0.7)',
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return '￥' + value.toLocaleString();
              }
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.dataset.label || '';
                const value = context.raw || 0;
                return `${label}: ￥${value.toLocaleString()}`;
              }
            }
          }
        }
      }
    });
  }
  
  /**
   * 渲染客户活跃度图表
   */
  renderCustomerActivityChart() {
    const activityData = this.stats.customerActivity || [];
    const activityCtx = document.getElementById('customerActivityChart');
    if (!activityCtx || !activityData.length) return;
    
    const labels = activityData.map(item => item.frequencyRange);
    const data = activityData.map(item => item.customerCount);
    const bgColors = [
      'rgba(231, 74, 59, 0.7)',
      'rgba(246, 194, 62, 0.7)',
      'rgba(54, 185, 204, 0.7)',
      'rgba(28, 200, 138, 0.7)',
      'rgba(78, 115, 223, 0.7)'
    ];
    
    this.charts.customerActivityChart = new Chart(activityCtx.getContext('2d'), {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: '客户数量',
          data: data,
          backgroundColor: bgColors.slice(0, data.length),
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: '客户数量'
            }
          },
          x: {
            title: {
              display: true,
              text: '月访问频次'
            }
          }
        },
        plugins: {
          title: {
            display: true,
            text: '客户到店频次统计',
            position: 'top'
          }
        }
      }
    });
  }
  
  /**
   * 渲染客户体质分布图表
   */
  renderCustomerConstitutionChart() {
    const constitutionData = this.stats.customerConstitution || [];
    const constitutionCtx = document.getElementById('customerConstitutionChart');
    if (!constitutionCtx || !constitutionData.length) return;
    
    const labels = constitutionData.map(item => item.constitutionType);
    const data = constitutionData.map(item => item.count);
    const total = data.reduce((sum, val) => sum + val, 0);
    
    const bgColors = [
      'rgba(78, 115, 223, 0.7)',
      'rgba(28, 200, 138, 0.7)',
      'rgba(246, 194, 62, 0.7)',
      'rgba(54, 185, 204, 0.7)',
      'rgba(231, 74, 59, 0.7)',
      'rgba(133, 135, 150, 0.7)',
      'rgba(105, 0, 132, 0.7)',
      'rgba(0, 128, 128, 0.7)',
      'rgba(128, 0, 0, 0.7)'
    ];
    
    this.charts.customerConstitutionChart = new Chart(constitutionCtx.getContext('2d'), {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: bgColors.slice(0, data.length),
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'right'
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.raw || 0;
                const percentage = ((value / total) * 100).toFixed(1);
                const showPercentage = document.getElementById('showPercentageSwitch')?.checked || false;
                
                if (showPercentage) {
                  return `${label}: ${percentage}% (${value}人)`;
                } else {
                  return `${label}: ${value}人`;
                }
              }
            }
          }
        }
      }
    });
  }
  
  /**
   * 更新体质分布图表的提示显示方式
   * @param {boolean} showPercentage 是否显示百分比
   */
  updateConstitutionChartTooltip(showPercentage) {
    if (!this.charts.customerConstitutionChart) return;
    
    const chart = this.charts.customerConstitutionChart;
    const total = chart.data.datasets[0].data.reduce((sum, val) => sum + val, 0);
    
    chart.options.plugins.tooltip = {
      callbacks: {
        label: function(context) {
          const label = context.label || '';
          const value = context.raw || 0;
          const percentage = ((value / total) * 100).toFixed(1);
          
          if (showPercentage) {
            return `${label}: ${percentage}% (${value}人)`;
          } else {
            return `${label}: ${value}人`;
          }
        }
      }
    };
    
    chart.update();
  }
  
  /**
   * 更新推拿师绩效表格
   */
  updateTherapistTable() {
    if (!this.stats || !this.stats.therapistPerformance) return;
    
    const performanceData = this.stats.therapistPerformance || [];
    const tableBody = document.querySelector('#therapistTable tbody');
    if (!tableBody) return;
    
    // 清空表格
    tableBody.innerHTML = '';
    
    // 添加数据行
    performanceData.forEach(therapist => {
      const row = document.createElement('tr');
      
      // 查找医师的实际姓名
      let therapistName = therapist.name;
      if (this.therapistList && this.therapistList.length > 0) {
        const foundTherapist = this.therapistList.find(t => t._id === therapist._id);
        if (foundTherapist) {
          therapistName = foundTherapist.name;
        }
      }
      
      // 构建表格行内容
      row.innerHTML = `
        <td>${therapistName}</td>
        <td>${therapist.serviceCount}</td>
        <td>${therapist.serviceHours.toFixed(1)}</td>
        <td>${formatCurrency(therapist.revenue)}</td>
        <td>${therapist.avgRating.toFixed(1)}</td>
        <td>${therapist.satisfactionRate}%</td>
        <td><span class="${therapist.growthRate >= 0 ? 'text-success' : 'text-danger'}">${therapist.growthRate >= 0 ? '↑' : '↓'}${Math.abs(therapist.growthRate)}%</span></td>
        <td>
          <a href="therapist-detail.html?id=${therapist._id}" class="btn btn-sm btn-outline-primary">详情</a>
        </td>
      `;
      
      tableBody.appendChild(row);
    });
  }
  
  /**
   * 更新未到店客户列表
   */
  updateInactiveCustomers() {
    if (!this.stats || !this.stats.inactiveCustomers) return;
    
    const customersData = this.stats.inactiveCustomers || [];
    const tableBody = document.querySelector('#inactiveCustomersTable tbody');
    if (!tableBody) return;
    
    // 清空表格
    tableBody.innerHTML = '';
    
    // 添加数据行
    customersData.forEach(customer => {
      const row = document.createElement('tr');
      
      // 构建表格行内容
      row.innerHTML = `
        <td><a href="customer-detail.html?id=${customer.id}">${customer.childName}</a></td>
        <td>${customer.childAge}岁</td>
        <td>${customer.parentName}</td>
        <td>${customer.phone}</td>
        <td>${formatDate(customer.lastVisitDate)}</td>
        <td><span class="badge ${this.getMembershipStatusBadgeClass(customer.membershipStatus)}">${this.getMembershipStatusText(customer.membershipStatus)}</span></td>
        <td>${customer.inactiveDays}天</td>
        <td>
          <button class="btn btn-sm btn-outline-primary"><i class="bi bi-telephone"></i> 致电</button>
          <button class="btn btn-sm btn-outline-success"><i class="bi bi-chat-dots"></i> 短信</button>
        </td>
      `;
      
      tableBody.appendChild(row);
    });
  }
  
  /**
   * 获取会员卡状态对应的样式类
   * @param {string} status 会员卡状态
   * @returns {string} 样式类名
   */
  getMembershipStatusBadgeClass(status) {
    switch (status) {
      case 'active':
        return 'bg-success';
      case 'expired':
        return 'bg-danger';
      case 'expiring':
        return 'bg-warning text-dark';
      default:
        return 'bg-secondary';
    }
  }
  
  /**
   * 获取会员卡状态文本
   * @param {string} status 会员卡状态
   * @returns {string} 状态文本
   */
  getMembershipStatusText(status) {
    switch (status) {
      case 'active':
        return '有效';
      case 'expired':
        return '已过期';
      case 'expiring':
        return '即将到期';
      default:
        return status;
    }
  }
  
  /**
   * 显示加载状态
   * @param {string} message 加载提示信息
   */
  showLoading(message = '加载中...') {
    // 检查是否存在loading元素，若不存在则创建
    let loadingElement = document.getElementById('loading');
    if (!loadingElement) {
      loadingElement = document.createElement('div');
      loadingElement.id = 'loading';
      loadingElement.className = 'loading-overlay';
      loadingElement.innerHTML = `
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">加载中...</span>
        </div>
        <div class="mt-2">${message}</div>
      `;
      document.body.appendChild(loadingElement);
    } else {
      const loadingText = loadingElement.querySelector('div:last-child');
      if (loadingText) {
        loadingText.textContent = message;
      }
      loadingElement.style.display = 'flex';
    }
  }
  
  /**
   * 隐藏加载状态
   */
  hideLoading() {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
      loadingElement.style.display = 'none';
    }
  }
}

// 初始化模块
document.addEventListener('DOMContentLoaded', () => {
  const statistics = new Statistics();
  statistics.init();
});

export default Statistics; 