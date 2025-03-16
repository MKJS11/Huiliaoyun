/**
 * 会员卡列表模块
 */
import dataService from '../../services/data-service.js';
import { showToast, formatDate, formatCurrency } from '../../utils/ui-utils.js';

class MembershipList {
  constructor() {
    // 初始化属性
    this.memberships = [];
    this.stats = null;
    this.cardTypeChart = null;
    this.cardTrendChart = null;
    this.dataTable = null;
    
    // 绑定方法
    this.init = this.init.bind(this);
    this.loadMemberships = this.loadMemberships.bind(this);
    this.loadStats = this.loadStats.bind(this);
    this.renderMembershipTable = this.renderMembershipTable.bind(this);
    this.updateStatsCards = this.updateStatsCards.bind(this);
    this.renderCharts = this.renderCharts.bind(this);
    this.setupRemindersList = this.setupRemindersList.bind(this);
    this.handleCancelCard = this.handleCancelCard.bind(this);
    this.checkSessionErrors = this.checkSessionErrors.bind(this);
  }
  
  /**
   * 初始化模块
   */
  async init() {
    try {
      // 检查会话存储中的错误信息
      this.checkSessionErrors();
      
      this.showLoading('正在加载会员卡数据...');
      
      // 设置事件监听
      this.setupEventListeners();
      
      // 加载统计数据
      await this.loadStats();
      
      // 更新统计卡片
      this.updateStatsCards();
      
      // 渲染图表
      this.renderCharts();
      
      // 加载会员卡列表
      await this.loadMemberships();
      
      // 渲染会员卡表格
      this.renderMembershipTable();
      
      // 设置提醒列表
      this.setupRemindersList();
      
      this.hideLoading();
    } catch (error) {
      console.error('初始化会员卡列表页面失败:', error);
      this.hideLoading();
      showToast('加载数据失败，请刷新页面重试', 'danger');
    }
  }
  
  /**
   * 检查会话存储中的错误消息
   */
  checkSessionErrors() {
    const membershipError = sessionStorage.getItem('membershipError');
    if (membershipError) {
      showToast(membershipError, 'warning');
      sessionStorage.removeItem('membershipError');
    }
  }
  
  /**
   * 设置事件监听器
   */
  setupEventListeners() {
    // 会员卡作废确认按钮
    document.getElementById('confirmCancelBtn').addEventListener('click', this.handleCancelCard);
    
    // 作废弹窗显示时，更新会员卡信息
    $('#cancelCardModal').on('show.bs.modal', (event) => {
      const button = $(event.relatedTarget);
      const cardId = button.data('card-id');
      const cardName = button.data('card-name');
      const modal = $(this);
      document.getElementById('cancelCardName').textContent = cardName;
      document.getElementById('confirmCancelBtn').setAttribute('data-card-id', cardId);
    });
  }
  
  /**
   * 加载会员卡列表
   */
  async loadMemberships() {
    try {
      const response = await dataService.getMemberships();
      
      if (!response.success) {
        throw new Error(response.message || '获取会员卡列表失败');
      }
      
      this.memberships = response.data || [];
      console.log(`已加载 ${this.memberships.length} 张会员卡:`, this.memberships);
      
      return this.memberships;
    } catch (error) {
      console.error('加载会员卡列表出错:', error);
      showToast('加载会员卡列表失败: ' + (error.message || '服务器错误'), 'danger');
      return [];
    }
  }
  
  /**
   * 加载统计数据
   */
  async loadStats() {
    try {
      const response = await dataService.getMembershipStats();
      
      if (!response.success) {
        throw new Error(response.message || '获取会员卡统计数据失败');
      }
      
      this.stats = response.data || {};
      console.log('已加载会员卡统计数据:', this.stats);
      
      return this.stats;
    } catch (error) {
      console.error('加载会员卡统计数据出错:', error);
      showToast('加载会员卡统计数据失败: ' + (error.message || '服务器错误'), 'warning');
      return null;
    }
  }
  
  /**
   * 更新统计卡片
   */
  updateStatsCards() {
    if (!this.stats) return;
    
    // 更新各个统计卡片
    document.querySelector('[data-stat="totalCount"]').textContent = this.stats.totalCount + '张';
    document.querySelector('[data-stat="activeCount"]').textContent = this.stats.activeCount + '张';
    document.querySelector('[data-stat="expiringCount"]').textContent = this.stats.expiringCount + '张';
    document.querySelector('[data-stat="expiredCount"]').textContent = this.stats.expiredCount + '张';
  }
  
  /**
   * 渲染会员卡表格
   */
  renderMembershipTable() {
    // 销毁现有DataTable实例（如果存在）
    if (this.dataTable) {
      this.dataTable.destroy();
    }
    
    // 确保表格数据已清空
    $('#membershipTable tbody').empty();
    
    // 初始化DataTable
    this.dataTable = $('#membershipTable').DataTable({
      data: this.memberships,
      columns: [
        { 
          data: 'cardNumber',
          render: (data, type, row) => `<a href="membership-detail.html?id=${row._id}">${data}</a>` 
        },
        { 
          data: 'customer',
          render: (data) => {
            if (!data) return '未知客户';
            return `<a href="customer-detail.html?id=${data._id}">${data.childName || '未知客户'}</a>`;
          }
        },
        { 
          data: 'cardType',
          render: (data) => {
            const types = {
              'count': '次卡',
              'period': '期限卡',
              'mixed': '混合卡',
              'value': '储值卡'
            };
            return types[data] || data;
          }
        },
        { 
          data: 'issueDate',
          render: (data) => formatDate(data)
        },
        { 
          data: 'expiryDate',
          render: (data) => formatDate(data)
        },
        { 
          data: null,
          render: (data, type, row) => {
            if (row.cardType === 'count' || row.cardType === 'mixed') {
              return `${row.count}次`;
            } else if (row.cardType === 'value') {
              return formatCurrency(row.balance);
            } else {
              return '不限';
            }
          }
        },
        { 
          data: 'status',
          render: (data, type, row) => {
            const badges = {
              'active': '<span class="badge bg-success">有效</span>',
              'expired': '<span class="badge bg-danger">已过期</span>',
              'cancelled': '<span class="badge bg-secondary">已作废</span>',
              'frozen': '<span class="badge bg-info">已冻结</span>',
              'lost': '<span class="badge bg-warning text-dark">已挂失</span>'
            };
            
            // 如果即将过期
            if (data === 'active' && row.expiryDate) {
              const expiryDate = new Date(row.expiryDate);
              const today = new Date();
              const diffDays = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
              
              if (diffDays <= 30 && diffDays > 0) {
                return '<span class="badge bg-warning text-dark">即将到期</span>';
              }
            }
            
            return badges[data] || data;
          }
        },
        { 
          data: null,
          orderable: false,
          render: (data, type, row) => {
            const isActive = row.status === 'active';
            const isExpired = row.status === 'expired';
            
            return `
              <div class="btn-group btn-group-sm">
                <a href="membership-detail.html?id=${row._id}" class="btn btn-outline-primary">查看</a>
                <button type="button" class="btn btn-outline-secondary dropdown-toggle dropdown-toggle-split" data-bs-toggle="dropdown" aria-expanded="false">
                  <span class="visually-hidden">更多</span>
                </button>
                <ul class="dropdown-menu">
                  ${isActive ? `<li><a class="dropdown-item" href="membership-edit.html?id=${row._id}">编辑</a></li>` : ''}
                  ${(isActive || isExpired) ? `<li><a class="dropdown-item" href="membership-recharge.html?id=${row._id}">充值</a></li>` : ''}
                  ${isActive ? `<li><a class="dropdown-item" href="membership-consume.html?id=${row._id}">消费</a></li>` : ''}
                  <li><hr class="dropdown-divider"></li>
                  ${row.status !== 'cancelled' ? `<li><a class="dropdown-item text-danger" href="#" data-bs-toggle="modal" data-bs-target="#cancelCardModal" data-card-id="${row._id}" data-card-name="${(row.customer?.childName || '未知客户') + '的' + (row.cardType === 'count' ? '次卡' : row.cardType === 'period' ? '期限卡' : row.cardType === 'mixed' ? '混合卡' : '储值卡')}">作废</a></li>` : ''}
                </ul>
              </div>
            `;
          }
        }
      ],
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
      pageLength: 10,
      responsive: true,
      order: [[4, 'asc']] // 默认按到期日期升序排序
    });
  }
  
  /**
   * 渲染图表
   */
  renderCharts() {
    if (!this.stats) return;
    
    // 销毁现有图表实例（如果存在）
    if (this.cardTypeChart) {
      this.cardTypeChart.destroy();
    }
    
    if (this.cardTrendChart) {
      this.cardTrendChart.destroy();
    }
    
    // 会员卡类型分布图表
    const cardTypeCtx = document.getElementById('cardTypeChart').getContext('2d');
    
    // 转换卡类型分布数据
    const cardTypeData = this.stats.cardTypeDistribution || [];
    const labels = [];
    const data = [];
    const bgColors = [
      'rgba(78, 115, 223, 0.7)',
      'rgba(28, 200, 138, 0.7)',
      'rgba(246, 194, 62, 0.7)',
      'rgba(231, 74, 59, 0.7)'
    ];
    
    const typeLabels = {
      'count': '次卡',
      'period': '期限卡',
      'mixed': '混合卡',
      'value': '储值卡'
    };
    
    cardTypeData.forEach((item, index) => {
      labels.push(typeLabels[item._id] || item._id);
      data.push(item.count);
    });
    
    this.cardTypeChart = new Chart(cardTypeCtx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: bgColors,
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'right'
          }
        }
      }
    });
    
    // 近期办卡趋势图表
    if (document.getElementById('cardTrendChart')) {
      // 使用后端提供的月度趋势数据
      const monthlyTrends = this.stats.monthlyTrends || [];
      
      // 如果后端未提供数据，则回退到本地处理
      if (!monthlyTrends || monthlyTrends.length === 0) {
        console.warn('后端未提供月度趋势数据，将使用会员卡数据本地处理');
        this.renderLocalTrendChart();
        return;
      }
      
      console.log('使用后端提供的月度趋势数据:', monthlyTrends);
      
      // 提取月份标签
      const monthLabels = monthlyTrends.map(item => item.month);
      
      // 提取各类型卡的数据
      const countCardData = monthlyTrends.map(item => item.cardTypes.count);
      const periodCardData = monthlyTrends.map(item => item.cardTypes.period);
      const mixedCardData = monthlyTrends.map(item => item.cardTypes.mixed);
      const valueCardData = monthlyTrends.map(item => item.cardTypes.value);
      
      // 创建趋势图
      const cardTrendCtx = document.getElementById('cardTrendChart').getContext('2d');
      this.cardTrendChart = new Chart(cardTrendCtx, {
        type: 'line',
        data: {
          labels: monthLabels,
          datasets: [{
            label: '次卡',
            data: countCardData,
            borderColor: 'rgba(78, 115, 223, 1)',
            backgroundColor: 'rgba(78, 115, 223, 0.1)',
            tension: 0.1,
            fill: true
          }, {
            label: '期限卡',
            data: periodCardData,
            borderColor: 'rgba(28, 200, 138, 1)',
            backgroundColor: 'rgba(28, 200, 138, 0.1)',
            tension: 0.1,
            fill: true
          }, {
            label: '混合卡',
            data: mixedCardData,
            borderColor: 'rgba(246, 194, 62, 1)',
            backgroundColor: 'rgba(246, 194, 62, 0.1)',
            tension: 0.1,
            fill: true
          }, {
            label: '储值卡',
            data: valueCardData,
            borderColor: 'rgba(231, 74, 59, 1)',
            backgroundColor: 'rgba(231, 74, 59, 0.1)',
            tension: 0.1,
            fill: true
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'top'
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return `${context.dataset.label}: ${context.raw} 张`;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                precision: 0,
                callback: function(value) {
                  return value + ' 张';
                }
              }
            }
          }
        }
      });
    }
  }
  
  /**
   * 渲染本地处理的趋势图（当后端未提供趋势数据时使用）
   */
  renderLocalTrendChart() {
    // 获取最近6个月的数据
    const now = new Date();
    const months = [];
    const monthLabels = [];
    
    // 获取最近6个月的月份标签
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = `${month.getFullYear()}年${month.getMonth() + 1}月`;
      months.push(month);
      monthLabels.push(monthLabel);
    }
    
    // 准备趋势图数据
    const countCardData = Array(6).fill(0);
    const periodCardData = Array(6).fill(0);
    const mixedCardData = Array(6).fill(0);
    const valueCardData = Array(6).fill(0);
    
    // 处理会员卡数据以获取每月新卡数量
    const memberships = this.memberships || [];
    
    // 遍历会员卡数据，统计各类型会员卡的每月新增数量
    memberships.forEach(membership => {
      const issueDate = new Date(membership.issueDate);
      
      // 检查发卡日期是否在最近6个月内
      for (let i = 0; i < 6; i++) {
        const monthStart = new Date(months[i].getFullYear(), months[i].getMonth(), 1);
        const monthEnd = new Date(months[i].getFullYear(), months[i].getMonth() + 1, 0);
        
        if (issueDate >= monthStart && issueDate <= monthEnd) {
          // 根据卡类型累加数量
          switch (membership.cardType) {
            case 'count':
              countCardData[i]++;
              break;
            case 'period':
              periodCardData[i]++;
              break;
            case 'mixed':
              mixedCardData[i]++;
              break;
            case 'value':
              valueCardData[i]++;
              break;
            default:
              break;
          }
          break; // 找到对应月份后跳出循环
        }
      }
    });
    
    // 创建趋势图
    const cardTrendCtx = document.getElementById('cardTrendChart').getContext('2d');
    this.cardTrendChart = new Chart(cardTrendCtx, {
      type: 'line',
      data: {
        labels: monthLabels,
        datasets: [{
          label: '次卡',
          data: countCardData,
          borderColor: 'rgba(78, 115, 223, 1)',
          backgroundColor: 'rgba(78, 115, 223, 0.1)',
          tension: 0.1,
          fill: true
        }, {
          label: '期限卡',
          data: periodCardData,
          borderColor: 'rgba(28, 200, 138, 1)',
          backgroundColor: 'rgba(28, 200, 138, 0.1)',
          tension: 0.1,
          fill: true
        }, {
          label: '混合卡',
          data: mixedCardData,
          borderColor: 'rgba(246, 194, 62, 1)',
          backgroundColor: 'rgba(246, 194, 62, 0.1)',
          tension: 0.1,
          fill: true
        }, {
          label: '储值卡',
          data: valueCardData,
          borderColor: 'rgba(231, 74, 59, 1)',
          backgroundColor: 'rgba(231, 74, 59, 0.1)',
          tension: 0.1,
          fill: true
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top'
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `${context.dataset.label}: ${context.raw} 张`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0,
              callback: function(value) {
                return value + ' 张';
              }
            }
          }
        }
      }
    });
  }
  
  /**
   * 设置提醒列表
   */
  setupRemindersList() {
    if (!this.stats) return;
    
    const remindersList = document.getElementById('remindersList');
    if (!remindersList) return;
    
    // 清空现有提醒
    remindersList.innerHTML = '';
    
    // 添加即将过期的会员卡提醒
    const expiringCards = this.stats.expiringCards || [];
    expiringCards.forEach(card => {
      const remainingDays = this.calculateRemainingDays(card.expiryDate);
      const li = document.createElement('li');
      li.className = 'list-group-item d-flex justify-content-between align-items-center';
      li.innerHTML = `
        <div>
          <span class="badge bg-danger me-2">${remainingDays}天内到期</span>
          <strong>${card.customer?.childName || '未知客户'}</strong> 的${this.getCardTypeName(card.cardType)}将于 <strong>${formatDate(card.expiryDate)}</strong> 到期
          ${card.cardType === 'count' || card.cardType === 'mixed' ? `，剩余 <strong>${card.count}次</strong>` : ''}
        </div>
        <div>
          <button class="btn btn-sm btn-outline-primary me-1" onclick="window.location.href='customer-detail.html?id=${card.customer?._id}'">
            <i class="bi bi-telephone"></i> 提醒
          </button>
          <button class="btn btn-sm btn-outline-success" onclick="window.location.href='membership-recharge.html?id=${card._id}'">
            <i class="bi bi-arrow-repeat"></i> 续费
          </button>
        </div>
      `;
      remindersList.appendChild(li);
    });
    
    // 添加次数不足的会员卡提醒
    const lowBalanceCards = this.stats.lowBalanceCards || [];
    lowBalanceCards.forEach(card => {
      if (expiringCards.find(c => c._id === card._id)) return; // 避免重复
      
      const li = document.createElement('li');
      li.className = 'list-group-item d-flex justify-content-between align-items-center';
      li.innerHTML = `
        <div>
          <span class="badge bg-warning text-dark me-2">次数不足</span>
          <strong>${card.customer?.childName || '未知客户'}</strong> 的${this.getCardTypeName(card.cardType)}剩余次数不足 <strong>${card.count}次</strong>
        </div>
        <div>
          <button class="btn btn-sm btn-outline-primary me-1" onclick="window.location.href='customer-detail.html?id=${card.customer?._id}'">
            <i class="bi bi-telephone"></i> 提醒
          </button>
          <button class="btn btn-sm btn-outline-success" onclick="window.location.href='membership-recharge.html?id=${card._id}'">
            <i class="bi bi-arrow-repeat"></i> 续费
          </button>
        </div>
      `;
      remindersList.appendChild(li);
    });
    
    // 如果没有提醒，显示一条信息
    if (remindersList.children.length === 0) {
      const li = document.createElement('li');
      li.className = 'list-group-item text-center';
      li.textContent = '暂无需要提醒的会员卡';
      remindersList.appendChild(li);
    }
  }
  
  /**
   * 计算剩余天数
   * @param {string|Date} expiryDate 到期日期
   * @returns {number} 剩余天数
   */
  calculateRemainingDays(expiryDate) {
    if (!expiryDate) return 0;
    
    const expiry = new Date(expiryDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const diffTime = expiry - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  
  /**
   * 获取卡类型名称
   * @param {string} cardType 卡类型
   * @returns {string} 卡类型名称
   */
  getCardTypeName(cardType) {
    const types = {
      'count': '次卡',
      'period': '期限卡',
      'mixed': '混合卡',
      'value': '储值卡'
    };
    return types[cardType] || cardType;
  }
  
  /**
   * 处理会员卡作废
   */
  async handleCancelCard() {
    try {
      const cardId = document.getElementById('confirmCancelBtn').getAttribute('data-card-id');
      const reason = document.getElementById('cancelReason').value;
      const note = document.getElementById('cancelNote').value;
      
      if (!cardId) {
        throw new Error('缺少会员卡ID');
      }
      
      this.showLoading('正在作废会员卡...');
      
      // 调用API更新会员卡状态
      const response = await dataService.updateMembershipStatus(cardId, {
        status: 'cancelled',
        reason: `${reason}${note ? ': ' + note : ''}`
      });
      
      if (!response.success) {
        throw new Error(response.message || '作废会员卡失败');
      }
      
      // 关闭模态窗口
      $('#cancelCardModal').modal('hide');
      
      this.hideLoading();
      showToast('会员卡已成功作废', 'success');
      
      // 重新加载数据
      await this.loadMemberships();
      await this.loadStats();
      this.updateStatsCards();
      this.renderMembershipTable();
      this.setupRemindersList();
      
    } catch (error) {
      console.error('作废会员卡出错:', error);
      this.hideLoading();
      showToast('作废会员卡失败: ' + (error.message || '服务器错误'), 'danger');
    }
  }
  
  /**
   * 显示加载状态
   * @param {string} message 加载提示信息
   */
  showLoading(message = '加载中...') {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
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
  const membershipList = new MembershipList();
  membershipList.init();
});

export default MembershipList; 