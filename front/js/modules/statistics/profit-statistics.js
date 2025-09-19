import DataService from '../../services/data-service.js';

/**
 * 利润统计模块
 * 处理利润相关的统计数据展示
 */
class ProfitStatistics {
  constructor() {
    this.dataService = DataService;
    this.profitTable = null;
    this.profitTrendChart = null;
    this.dateRange = {
      start: moment().startOf('month').format('YYYY-MM-DD'),
      end: moment().endOf('month').format('YYYY-MM-DD')
    };
    
    this.initDatePicker();
    this.initEventListeners();
    this.initProfitTable();
    this.loadProfitData();
    this.initProfitTrendChart();
  }
  
  /**
   * 初始化日期选择器
   */
  initDatePicker() {
    const dateRangePicker = document.getElementById('dateRangePicker');
    if (dateRangePicker) {
      flatpickr(dateRangePicker, {
        mode: 'range',
        dateFormat: 'Y-m-d',
        defaultDate: [this.dateRange.start, this.dateRange.end],
        locale: {
          rangeSeparator: ' 至 '
        },
        onChange: (selectedDates) => {
          if (selectedDates.length === 2) {
            this.dateRange = {
              start: moment(selectedDates[0]).format('YYYY-MM-DD'),
              end: moment(selectedDates[1]).format('YYYY-MM-DD')
            };
          }
        }
      });
    }
  }
  
  /**
   * 初始化事件监听器
   */
  initEventListeners() {
    // 应用日期按钮点击事件
    const applyDateBtn = document.getElementById('applyDateBtn');
    if (applyDateBtn) {
      applyDateBtn.addEventListener('click', () => {
        this.loadProfitData();
      });
    }
    
    // 日期范围快捷按钮
    const dateRangeButtons = document.querySelectorAll('.btn-group .btn-outline-secondary');
    dateRangeButtons.forEach(button => {
      button.addEventListener('click', (event) => {
        // 移除所有按钮的active类
        dateRangeButtons.forEach(btn => btn.classList.remove('active'));
        
        // 添加当前按钮的active类
        event.target.classList.add('active');
        
        // 设置日期范围
        const range = event.target.textContent.trim();
        switch (range) {
          case '本月':
            this.dateRange = {
              start: moment().startOf('month').format('YYYY-MM-DD'),
              end: moment().endOf('month').format('YYYY-MM-DD')
            };
            break;
          case '上月':
            this.dateRange = {
              start: moment().subtract(1, 'month').startOf('month').format('YYYY-MM-DD'),
              end: moment().subtract(1, 'month').endOf('month').format('YYYY-MM-DD')
            };
            break;
          case '本季度':
            this.dateRange = {
              start: moment().startOf('quarter').format('YYYY-MM-DD'),
              end: moment().endOf('quarter').format('YYYY-MM-DD')
            };
            break;
          case '本年':
            this.dateRange = {
              start: moment().startOf('year').format('YYYY-MM-DD'),
              end: moment().endOf('year').format('YYYY-MM-DD')
            };
            break;
        }
        
        // 更新日期选择器
        const dateRangePicker = document.getElementById('dateRangePicker');
        if (dateRangePicker && dateRangePicker._flatpickr) {
          dateRangePicker._flatpickr.setDate([this.dateRange.start, this.dateRange.end]);
        }
        
        // 重新加载数据
        this.loadProfitData();
      });
    });
    
    // 只显示有利润的商品开关
    const showOnlyProfitable = document.getElementById('showOnlyProfitable');
    if (showOnlyProfitable) {
      showOnlyProfitable.addEventListener('change', () => {
        if (this.profitTable) {
          this.profitTable.draw();
        }
      });
    }
  }
  
  /**
   * 初始化利润表格
   */
  initProfitTable() {
    const table = document.getElementById('profitTable');
    if (!table) return;
    
    $.fn.dataTable.ext.search.push((settings, data, dataIndex, rowData) => {
      const showOnlyProfitable = document.getElementById('showOnlyProfitable').checked;
      if (!showOnlyProfitable) return true;
      
      // 总利润在索引6
      const profit = parseFloat(data[6].replace('¥', '').replace(',', ''));
      return profit > 0;
    });
    
    this.profitTable = $(table).DataTable({
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
        }
      },
      order: [[6, 'desc']], // 默认按利润降序排序
      columns: [
        { data: 'name' },
        { data: 'soldQuantity' },
        { data: 'costPrice', render: (data) => `¥${parseFloat(data).toFixed(2)}` },
        { data: 'avgSellingPrice', render: (data) => `¥${parseFloat(data).toFixed(2)}` },
        { data: 'totalRevenue', render: (data) => `¥${parseFloat(data).toFixed(2)}` },
        { data: 'totalCost', render: (data) => `¥${parseFloat(data).toFixed(2)}` },
        { 
          data: 'totalProfit', 
          render: (data) => {
            const profit = parseFloat(data);
            const className = profit > 0 ? 'text-success' : 'text-danger';
            return `<span class="${className}">¥${profit.toFixed(2)}</span>`;
          }
        },
        { 
          data: 'profitRate', 
          render: (data) => {
            const rate = parseFloat(data) * 100;
            const className = rate > 0 ? 'text-success' : 'text-danger';
            return `<span class="${className}">${rate.toFixed(2)}%</span>`;
          }
        }
      ],
      responsive: true
    });
  }
  
  /**
   * 初始化利润趋势图
   */
  initProfitTrendChart() {
    const chartCanvas = document.getElementById('profitTrendChart');
    if (!chartCanvas) return;
    
    const ctx = chartCanvas.getContext('2d');
    this.profitTrendChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: '收入',
            data: [],
            backgroundColor: 'rgba(78, 115, 223, 0.05)',
            borderColor: 'rgba(78, 115, 223, 1)',
            pointBackgroundColor: 'rgba(78, 115, 223, 1)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(78, 115, 223, 1)',
            fill: false
          },
          {
            label: '成本',
            data: [],
            backgroundColor: 'rgba(246, 194, 62, 0.05)',
            borderColor: 'rgba(246, 194, 62, 1)',
            pointBackgroundColor: 'rgba(246, 194, 62, 1)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(246, 194, 62, 1)',
            fill: false
          },
          {
            label: '利润',
            data: [],
            backgroundColor: 'rgba(54, 185, 204, 0.05)',
            borderColor: 'rgba(54, 185, 204, 1)',
            pointBackgroundColor: 'rgba(54, 185, 204, 1)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(54, 185, 204, 1)',
            fill: false
          }
        ]
      },
      options: {
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top'
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                label += '¥' + context.parsed.y.toFixed(2);
                return label;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            }
          },
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return '¥' + value.toFixed(0);
              }
            }
          }
        }
      }
    });
  }
  
  /**
   * 更新利润趋势图数据
   * @param {Array} data 趋势数据
   */
  updateProfitTrendChart(data) {
    if (!this.profitTrendChart || !data || !data.length) return;
    
    const labels = data.map(item => item.date);
    const revenues = data.map(item => item.revenue);
    const costs = data.map(item => item.cost);
    const profits = data.map(item => item.profit);
    
    this.profitTrendChart.data.labels = labels;
    this.profitTrendChart.data.datasets[0].data = revenues;
    this.profitTrendChart.data.datasets[1].data = costs;
    this.profitTrendChart.data.datasets[2].data = profits;
    
    this.profitTrendChart.update();
  }
  
  /**
   * 加载利润数据
   */
  async loadProfitData() {
    try {
      this.showLoading();
      
      // 假设API提供了获取利润统计数据的接口
      const params = {
        startDate: this.dateRange.start,
        endDate: this.dateRange.end
      };
      
      // 这里应当调用后端API获取数据
      // const profitData = await this.dataService.getProfitStatistics(params);
      
      // 由于还没有实现该API，这里使用模拟数据
      const profitData = this.getMockProfitData();
      
      // 更新概览数据
      this.updateProfitOverview(profitData.overview);
      
      // 更新利润表格
      this.updateProfitTable(profitData.items);
      
      // 更新利润趋势图
      this.updateProfitTrendChart(profitData.trends);
      
    } catch (error) {
      console.error('加载利润数据失败:', error);
    } finally {
      this.hideLoading();
    }
  }
  
  /**
   * 更新利润概览
   * @param {Object} overview 概览数据
   */
  updateProfitOverview(overview) {
    if (!overview) return;
    
    document.getElementById('totalRevenue').textContent = `¥${overview.totalRevenue.toFixed(2)}`;
    document.getElementById('totalCost').textContent = `¥${overview.totalCost.toFixed(2)}`;
    document.getElementById('totalProfit').textContent = `¥${overview.totalProfit.toFixed(2)}`;
    document.getElementById('avgProfitRate').textContent = `${(overview.avgProfitRate * 100).toFixed(2)}%`;
  }
  
  /**
   * 更新利润表格
   * @param {Array} items 利润数据项
   */
  updateProfitTable(items) {
    if (!this.profitTable || !items) return;
    
    this.profitTable.clear();
    this.profitTable.rows.add(items);
    this.profitTable.draw();
  }
  
  /**
   * 获取模拟的利润数据
   * @returns {Object} 模拟数据
   */
  getMockProfitData() {
    // 生成日期范围内的每一天
    const start = moment(this.dateRange.start);
    const end = moment(this.dateRange.end);
    const days = [];
    
    let current = start.clone();
    while (current.isSameOrBefore(end)) {
      days.push(current.format('YYYY-MM-DD'));
      current.add(1, 'days');
    }
    
    // 生成模拟的趋势数据
    const trends = days.map(date => {
      const revenue = Math.floor(Math.random() * 5000) + 1000;
      const cost = Math.floor(revenue * (Math.random() * 0.6 + 0.3));
      return {
        date,
        revenue,
        cost,
        profit: revenue - cost
      };
    });
    
    // 生成模拟的商品利润数据
    const items = [
      {
        name: '推拿油',
        soldQuantity: 45,
        costPrice: 25,
        avgSellingPrice: 45,
        totalRevenue: 45 * 45,
        totalCost: 45 * 25,
        totalProfit: 45 * (45 - 25),
        profitRate: (45 - 25) / 45
      },
      {
        name: '艾条',
        soldQuantity: 30,
        costPrice: 15,
        avgSellingPrice: 30,
        totalRevenue: 30 * 30,
        totalCost: 30 * 15,
        totalProfit: 30 * (30 - 15),
        profitRate: (30 - 15) / 30
      },
      {
        name: '刮痧板',
        soldQuantity: 20,
        costPrice: 20,
        avgSellingPrice: 35,
        totalRevenue: 20 * 35,
        totalCost: 20 * 20,
        totalProfit: 20 * (35 - 20),
        profitRate: (35 - 20) / 35
      },
      {
        name: '清热贴',
        soldQuantity: 50,
        costPrice: 10,
        avgSellingPrice: 20,
        totalRevenue: 50 * 20,
        totalCost: 50 * 10,
        totalProfit: 50 * (20 - 10),
        profitRate: (20 - 10) / 20
      },
      {
        name: '足浴盆',
        soldQuantity: 5,
        costPrice: 60,
        avgSellingPrice: 85,
        totalRevenue: 5 * 85,
        totalCost: 5 * 60,
        totalProfit: 5 * (85 - 60),
        profitRate: (85 - 60) / 85
      }
    ];
    
    // 计算总收入、总成本和总利润
    const totalRevenue = items.reduce((sum, item) => sum + item.totalRevenue, 0);
    const totalCost = items.reduce((sum, item) => sum + item.totalCost, 0);
    const totalProfit = totalRevenue - totalCost;
    
    return {
      overview: {
        totalRevenue,
        totalCost,
        totalProfit,
        avgProfitRate: totalProfit / totalRevenue
      },
      items,
      trends
    };
  }
  
  /**
   * 显示加载状态
   */
  showLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
      loading.style.display = 'flex';
    }
  }
  
  /**
   * 隐藏加载状态
   */
  hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
      loading.style.display = 'none';
    }
  }
}

// 初始化利润统计模块
const profitStatistics = new ProfitStatistics();
export default profitStatistics; 