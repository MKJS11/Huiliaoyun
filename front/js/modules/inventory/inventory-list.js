import DataService from '../../services/data-service.js';

/**
 * 库存管理模块
 * 处理库存列表、入库、出库等操作
 */
class InventoryList {
  constructor() {
    this.dataService = DataService;
    this.inventoryTable = null;
    this.lowStockTable = null;
    this.transactionTable = null;
    
    this.initEventListeners();
    this.initDatePicker();
    this.initInventoryTable();
    this.initLowStockTable();
    this.initTransactionTable();
    this.loadInventoryStats();
  }
  
  /**
   * 初始化事件监听器
   */
  initEventListeners() {
    // 绑定入库按钮点击事件
    document.addEventListener('click', (event) => {
      if (event.target.classList.contains('stock-in-btn')) {
        const itemId = event.target.dataset.id;
        const itemName = event.target.dataset.name;
        this.showStockInModal(itemId, itemName);
      }
    });
    
    // 绑定出库按钮点击事件
    document.addEventListener('click', (event) => {
      if (event.target.classList.contains('stock-out-btn')) {
        const itemId = event.target.dataset.id;
        const itemName = event.target.dataset.name;
        this.showStockOutModal(itemId, itemName);
      }
    });
    
    // 绑定删除按钮点击事件
    document.addEventListener('click', (event) => {
      if (event.target.classList.contains('delete-item-btn')) {
        const itemId = event.target.dataset.id;
        const itemName = event.target.dataset.name;
        this.confirmDeleteItem(itemId, itemName);
      }
    });
    
    // 保存入库信息按钮点击事件
    document.getElementById('saveStockIn').addEventListener('click', () => {
      this.handleStockIn();
    });
    
    // 保存出库信息按钮点击事件
    document.getElementById('saveStockOut').addEventListener('click', () => {
      this.handleStockOut();
    });
    
    // 搜索按钮点击事件
    document.getElementById('searchBtn').addEventListener('click', () => {
      this.filterInventory();
    });
    
    // 搜索框按回车键触发搜索
    document.getElementById('searchInput').addEventListener('keyup', (event) => {
      if (event.key === 'Enter') {
        this.filterInventory();
      }
    });
    
    // 类别筛选更改事件
    document.getElementById('categoryFilter').addEventListener('change', () => {
      this.filterInventory();
    });
    
    // 低库存筛选切换事件
    document.getElementById('lowStockFilter').addEventListener('change', () => {
      this.filterInventory();
    });
    
    // 重置筛选按钮点击事件
    document.getElementById('resetFilterBtn')?.addEventListener('click', () => {
      this.resetFilters();
    });
    
    // 交易类型筛选按钮事件
    document.querySelector('#inout-tab-pane .btn-group')?.addEventListener('click', (event) => {
      if (event.target.classList.contains('btn')) {
        // 移除所有按钮的active状态
        document.querySelectorAll('#inout-tab-pane .btn-group .btn').forEach(btn => {
          btn.classList.remove('active');
        });
        
        // 给当前点击的按钮添加active状态
        event.target.classList.add('active');
        
        // 根据按钮类型筛选数据
        const type = event.target.textContent.trim();
        this.filterTransactions(type);
      }
    });
    
    // 日期范围应用按钮事件
    document.getElementById('applyDateBtn')?.addEventListener('click', () => {
      this.filterTransactionsByDate();
    });
  }
  
  /**
   * 初始化日期选择器
   */
  initDatePicker() {
    const dateRangePicker = $('#dateRangePicker');
    if (dateRangePicker.length) {
      dateRangePicker.daterangepicker({
        startDate: moment().subtract(30, 'days'),
        endDate: moment(),
        ranges: {
          '今日': [moment(), moment()],
          '昨日': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
          '最近7天': [moment().subtract(6, 'days'), moment()],
          '最近30天': [moment().subtract(29, 'days'), moment()],
          '本月': [moment().startOf('month'), moment().endOf('month')],
          '上月': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
        },
        locale: {
          format: 'YYYY-MM-DD',
          separator: ' - ',
          applyLabel: '确定',
          cancelLabel: '取消',
          fromLabel: '从',
          toLabel: '到',
          customRangeLabel: '自定义',
          weekLabel: '周',
          daysOfWeek: ['日', '一', '二', '三', '四', '五', '六'],
          monthNames: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
          firstDay: 1
        }
      });
    }
  }
  
  /**
   * 初始化库存表格
   */
  initInventoryTable() {
    const table = document.getElementById('inventoryTable');
    if (!table) return;
    
    this.inventoryTable = $(table).DataTable({
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
      order: [[1, 'asc']], // 默认按商品名称排序
      columns: [
        { data: 'name' },
        { data: 'specification' },
        { data: 'category' },
        { data: 'stock', render: (data, type, row) => `${data} ${row.unit}` },
        { data: 'costPrice', render: (data) => `¥${data.toFixed(2)}` },
        { data: 'sellingPrice', render: (data) => `¥${data.toFixed(2)}` },
        { 
          data: null, 
          render: function(data, type, row) {
            return `
              <div class="btn-group btn-group-sm">
                <button class="btn btn-outline-primary stock-in-btn" data-id="${row._id}" data-name="${row.name}">
                  <i class="bi bi-box-arrow-in-down"></i> 入库
                </button>
                <button class="btn btn-outline-warning stock-out-btn" data-id="${row._id}" data-name="${row.name}">
                  <i class="bi bi-box-arrow-up"></i> 出库
                </button>
                <button type="button" class="btn btn-outline-secondary dropdown-toggle dropdown-toggle-split" data-bs-toggle="dropdown" aria-expanded="false">
                  <span class="visually-hidden">更多</span>
                </button>
                <ul class="dropdown-menu">
                  <li><a class="dropdown-item" href="inventory-edit.html?id=${row._id}">编辑信息</a></li>
                  <li><hr class="dropdown-divider"></li>
                  <li><a class="dropdown-item text-danger delete-item-btn" href="#" data-id="${row._id}" data-name="${row.name}">删除商品</a></li>
                </ul>
              </div>
            `;
          }
        }
      ],
      responsive: true,
      dom: '<"row"<"col-sm-12 col-md-6"l><"col-sm-12 col-md-6"f>>t<"row"<"col-sm-12 col-md-5"i><"col-sm-12 col-md-7"p>>',
      initComplete: () => {
        this.loadInventoryItems();
      }
    });
  }
  
  /**
   * 初始化低库存表格
   */
  initLowStockTable() {
    const table = document.getElementById('lowStockTable');
    if (!table) return;
    
    this.lowStockTable = $(table).DataTable({
      paging: false,
      searching: false,
      info: false,
      language: {
        "emptyTable": "没有低库存商品",
        "zeroRecords": "没有匹配结果"
      },
      columns: [
        { data: 'name' },
        { data: 'specification' },
        { 
          data: 'stock', 
          render: (data, type, row) => `<span class="text-danger">${data} ${row.unit}</span>` 
        },
        { data: 'warningThreshold', render: (data, type, row) => `${data} ${row.unit}` },
        { 
          data: null, 
          render: function(data, type, row) {
            const suggestedQuantity = Math.max(row.warningThreshold * 2 - row.stock, 5);
            return `${suggestedQuantity} ${row.unit}`;
          }
        },
        { 
          data: null, 
          render: function(data, type, row) {
            return `
              <button class="btn btn-sm btn-outline-primary stock-in-btn" data-id="${row._id}" data-name="${row.name}">
                <i class="bi bi-box-arrow-in-down"></i> 入库
              </button>
            `;
          }
        }
      ]
    });
    
    this.loadLowStockItems();
  }
  
  /**
   * 初始化交易记录表格
   */
  initTransactionTable() {
    const table = document.getElementById('inoutTable');
    if (!table) return;
    
    // 清空表格中的静态数据，避免与动态数据结构冲突
    const tbody = table.querySelector('tbody');
    if (tbody) {
      tbody.innerHTML = '';
    }
    
    this.transactionTable = $(table).DataTable({
      order: [[0, 'desc']], // 默认按日期倒序
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
      columns: [
        { 
          data: 'transactionDate', 
          render: (data) => new Date(data).toLocaleString('zh-CN') 
        },
        { 
          data: 'type',
          render: (data) => {
            const typeClass = data === '入库' ? 'success' : (data === '出库' ? 'warning' : 'secondary');
            return `<span class="badge bg-${typeClass}">${data}</span>`;
          }
        },
        { 
          data: 'inventory.name', // 使用点表示法直接访问嵌套属性
          defaultContent: '未知商品' // 提供默认值，避免空值错误
        },
        { 
          data: 'inventory.specification', 
          defaultContent: '-' // 提供默认值，避免空值错误
        },
        { 
          data: 'quantity', 
          render: (data, type, row) => {
            const unit = row.inventory && row.inventory.unit ? row.inventory.unit : '个';
            return `${data} ${unit}`;
          }
        },
        { 
          data: 'unitPrice', 
          render: (data) => `¥${Number(data).toFixed(2)}` 
        },
        { 
          data: 'totalPrice', 
          render: (data) => `¥${Number(data).toFixed(2)}` 
        },
        { 
          data: 'operator',
          defaultContent: '-' 
        },
        { 
          data: 'notes', 
          defaultContent: '-' 
        }
      ],
      responsive: true
    });
    
    this.loadTransactions();
  }
  
  /**
   * 加载库存商品列表
   */
  async loadInventoryItems() {
    try {
      this.showLoading();
      
      const filters = this.getInventoryFilters();
      const result = await this.dataService.getInventoryItems(filters);
      
      this.inventoryTable.clear();
      if (result.data && result.data.length > 0) {
        this.inventoryTable.rows.add(result.data).draw();
      } else {
        // 没有数据时显示提示
        this.hideLoading();
        document.getElementById('inventoryEmptyMessage').classList.remove('d-none');
      }
      
      this.hideLoading();
    } catch (error) {
      console.error('加载库存商品失败:', error);
      this.showToast('加载库存商品失败', error.message, 'error');
      this.hideLoading();
    }
  }
  
  /**
   * 加载低库存商品
   */
  async loadLowStockItems() {
    try {
      const params = { lowStock: true };
      const result = await this.dataService.getInventoryItems(params);
      
      this.lowStockTable.clear();
      if (result.data && result.data.length > 0) {
        this.lowStockTable.rows.add(result.data).draw();
        document.getElementById('lowStockAlert').classList.remove('d-none');
      } else {
        document.getElementById('lowStockAlert').classList.add('d-none');
      }
    } catch (error) {
      console.error('加载低库存商品失败:', error);
    }
  }
  
  /**
   * 加载交易记录
   */
  async loadTransactions() {
    try {
      // 显示加载中
      this.showLoading();
      
      const result = await this.dataService.getInventoryTransactions({ limit: 20 });
      
      if (!this.transactionTable) {
        console.error('交易记录表格未初始化');
        this.hideLoading();
        return;
      }
      
      this.transactionTable.clear();
      
      if (result.data && result.data.length > 0) {
        // 处理数据，确保数据格式一致
        const processedData = result.data.map(item => {
          // 确保所有必需的字段都存在
          return {
            ...item,
            // 确保 inventory 字段存在
            inventory: item.inventory || { name: '未知商品', specification: '-', unit: '个' },
            // 处理可能的数值格式问题
            unitPrice: Number(item.unitPrice || 0),
            totalPrice: Number(item.totalPrice || 0),
            quantity: Number(item.quantity || 0)
          };
        });
        
        // 添加到表格并重绘
        this.transactionTable.rows.add(processedData).draw();
        console.log(`成功加载 ${processedData.length} 条交易记录`);
      } else {
        console.log('没有找到交易记录');
      }
      
      this.hideLoading();
    } catch (error) {
      console.error('加载交易记录失败:', error);
      this.showToast('加载失败', '无法获取交易记录', 'error');
      this.hideLoading();
    }
  }
  
  /**
   * 加载库存统计信息
   */
  async loadInventoryStats() {
    try {
      const stats = await this.dataService.getInventoryStats();
      
      // 更新统计信息显示
      document.getElementById('totalItems').textContent = stats.totalItems || 0;
      document.getElementById('totalValue').textContent = `¥${(stats.totalValue || 0).toFixed(2)}`;
      document.getElementById('monthlyInCount').textContent = `${stats.monthlyInCount || 0}次`;
      document.getElementById('lowStockCount').textContent = `${stats.lowStockCount || 0}种`;
      
      // 如果有低库存商品，显示警告
      if (stats.lowStockCount > 0) {
        document.getElementById('lowStockAlert').classList.remove('d-none');
      } else {
        document.getElementById('lowStockAlert').classList.add('d-none');
      }
    } catch (error) {
      console.error('获取库存统计失败:', error);
    }
  }
  
  /**
   * 显示入库模态框
   */
  showStockInModal(itemId, itemName) {
    const modal = document.getElementById('stockInModal');
    const form = document.getElementById('stockInForm');
    
    if (!modal || !form) {
      console.error('入库模态框或表单未找到');
      return;
    }
    
    // 清空表单，防止上次数据残留
    form.reset();
    
    // 设置商品信息
    form.elements['productNameIn'].value = itemName;
    form.elements['productIdIn'].value = itemId;
    
    // 设置初始值和焦点
    form.elements['stockInQuantity'].value = '1';
    setTimeout(() => form.elements['stockInQuantity'].focus(), 500);
    
    // 显示模态框
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
  }
  
  /**
   * 显示出库模态框
   */
  showStockOutModal(itemId, itemName) {
    const modal = document.getElementById('stockOutModal');
    const form = document.getElementById('stockOutForm');
    
    if (!modal || !form) {
      console.error('出库模态框或表单未找到');
      return;
    }
    
    // 清空表单，防止上次数据残留
    form.reset();
    
    // 设置商品信息
    form.elements['productNameOut'].value = itemName;
    form.elements['productIdOut'].value = itemId;
    
    // 设置初始值和焦点
    form.elements['stockOutQuantity'].value = '1';
    form.elements['stockOutReason'].value = '销售';
    setTimeout(() => form.elements['stockOutQuantity'].focus(), 500);
    
    // 显示模态框
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
  }
  
  /**
   * 确认删除商品
   */
  confirmDeleteItem(itemId, itemName) {
    if (confirm(`确定要删除商品"${itemName}"吗？此操作不可撤销。`)) {
      this.deleteInventoryItem(itemId);
    }
  }
  
  /**
   * 处理入库操作
   */
  async handleStockIn() {
    try {
      const form = document.getElementById('stockInForm');
      const itemId = form.elements['productIdIn'].value;
      const quantity = Number(form.elements['stockInQuantity'].value);
      const unitPrice = Number(form.elements['stockInPrice'].value);
      const supplier = form.elements['stockInSupplier'].value;
      const notes = form.elements['stockInNotes']?.value || '';
      
      // 表单验证
      if (!itemId) {
        this.showToast('入库失败', '商品ID无效', 'error');
        return;
      }
      
      if (!quantity || quantity <= 0 || isNaN(quantity)) {
        this.showToast('入库失败', '请输入有效的入库数量', 'error');
        return;
      }
      
      if (!unitPrice || unitPrice < 0 || isNaN(unitPrice)) {
        this.showToast('入库失败', '请输入有效的入库单价', 'error');
        return;
      }
      
      this.showLoading();
      
      // 准备请求数据
      const stockInData = {
        quantity,
        unitPrice,
        supplier,
        notes,
        operator: '管理员' // 实际系统中应该使用当前登录用户名
      };
      
      console.log('开始入库操作:', stockInData);
      
      // 调用API进行入库操作
      const result = await this.dataService.stockIn(itemId, stockInData);
      
      // 关闭模态框
      const modal = bootstrap.Modal.getInstance(document.getElementById('stockInModal'));
      modal.hide();
      
      // 重新加载数据
      this.refreshData();
      
      // 清空表单，为下次操作做准备
      form.reset();
      
      this.showToast('入库成功', `商品入库操作已完成，新增库存 ${quantity} ${result.item.unit}`, 'success');
      this.hideLoading();
    } catch (error) {
      console.error('入库操作失败:', error);
      this.showToast('入库失败', error.message || '服务器错误，请稍后重试', 'error');
      this.hideLoading();
    }
  }
  
  /**
   * 处理出库操作
   */
  async handleStockOut() {
    try {
      const form = document.getElementById('stockOutForm');
      if (!form) {
        console.error('出库表单未找到');
        return;
      }
      
      const itemId = form.elements['productIdOut'].value;
      const quantity = Number(form.elements['stockOutQuantity'].value);
      const reason = form.elements['stockOutReason'].value;
      const notes = form.elements['stockOutNotes'].value;
      
      // 表单验证
      if (!itemId) {
        this.showToast('出库失败', '商品ID无效', 'error');
        return;
      }
      
      if (!quantity || quantity <= 0 || isNaN(quantity)) {
        this.showToast('出库失败', '请输入有效的出库数量', 'error');
        return;
      }
      
      this.showLoading();
      
      // 先获取当前商品的库存信息，前端检查库存是否充足
      try {
        const itemInfo = await this.dataService.getInventoryItemById(itemId);
        if (itemInfo.stock < quantity) {
          this.hideLoading();
          this.showToast('出库失败', `库存不足，当前库存${itemInfo.stock}${itemInfo.unit}，无法出库${quantity}${itemInfo.unit}`, 'error');
          return;
        }
      } catch (err) {
        console.warn('获取商品信息失败，将由后端验证库存:', err);
      }
      
      // 准备请求数据
      const stockOutData = {
        quantity,
        reason,
        notes: notes || '',
        operator: '管理员' // 实际系统中应该使用当前登录用户名
      };
      
      console.log('开始出库操作:', stockOutData);
      
      // 调用API进行出库操作
      const result = await this.dataService.stockOut(itemId, stockOutData);
      
      // 关闭模态框
      const modal = bootstrap.Modal.getInstance(document.getElementById('stockOutModal'));
      if (modal) modal.hide();
      
      // 清空表单，为下次操作做准备
      form.reset();
      
      // 重新加载数据
      this.refreshData();
      
      this.showToast('出库成功', `商品出库操作已完成，减少库存 ${quantity} ${result.item.unit}`, 'success');
      this.hideLoading();
    } catch (error) {
      console.error('出库操作失败:', error);
      
      // 针对特定错误类型显示友好提示
      if (error.message && error.message.includes('库存不足')) {
        this.showToast('出库失败', '库存不足，无法完成出库操作', 'error');
      } else {
        this.showToast('出库失败', error.message || '服务器错误，请稍后重试', 'error');
      }
      
      this.hideLoading();
    }
  }
  
  /**
   * 删除库存商品
   */
  async deleteInventoryItem(itemId) {
    try {
      this.showLoading();
      
      await this.dataService.deleteInventoryItem(itemId);
      
      // 重新加载数据
      this.refreshData();
      
      this.showToast('删除成功', '商品已成功删除', 'success');
      this.hideLoading();
    } catch (error) {
      console.error('删除商品失败:', error);
      this.showToast('删除失败', error.message, 'error');
      this.hideLoading();
    }
  }
  
  /**
   * 过滤库存商品
   */
  filterInventory() {
    this.loadInventoryItems();
  }
  
  /**
   * 获取库存过滤条件
   */
  getInventoryFilters() {
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const lowStockFilter = document.getElementById('lowStockFilter');
    
    const filters = {};
    
    if (searchInput && searchInput.value.trim()) {
      filters.name = searchInput.value.trim();
    }
    
    if (categoryFilter && categoryFilter.value) {
      filters.category = categoryFilter.value;
    }
    
    if (lowStockFilter && lowStockFilter.checked) {
      filters.lowStock = true;
    }
    
    return filters;
  }
  
  /**
   * 重置所有筛选条件
   */
  resetFilters() {
    // 重置搜索框
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = '';
    
    // 重置类别筛选
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) categoryFilter.value = '';
    
    // 重置低库存筛选
    const lowStockFilter = document.getElementById('lowStockFilter');
    if (lowStockFilter) lowStockFilter.checked = false;
    
    // 重新加载数据
    this.loadInventoryItems();
    
    this.showToast('已重置', '已清除所有筛选条件', 'info');
  }
  
  /**
   * 刷新所有数据
   */
  async refreshData() {
    try {
      this.showLoading();
      
      // 按优先级顺序刷新数据
      console.log('开始刷新库存数据...');
      
      // 1. 先刷新库存统计
      await this.loadInventoryStats()
        .catch(err => console.error('刷新库存统计失败:', err));
      
      // 2. 刷新主库存列表
      await this.loadInventoryItems()
        .catch(err => console.error('刷新库存列表失败:', err));
      
      // 3. 刷新低库存提示
      await this.loadLowStockItems()
        .catch(err => console.error('刷新低库存列表失败:', err));
      
      // 4. 刷新交易记录
      await this.loadTransactions()
        .catch(err => console.error('刷新交易记录失败:', err));
      
      console.log('库存数据刷新完成');
      this.hideLoading();
    } catch (error) {
      console.error('刷新数据失败:', error);
      this.hideLoading();
      this.showToast('数据刷新失败', '请刷新页面重试', 'error');
    }
  }
  
  /**
   * 显示加载中指示器
   */
  showLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
      loading.style.display = 'flex';
    }
  }
  
  /**
   * 隐藏加载中指示器
   */
  hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
      loading.style.display = 'none';
    }
  }
  
  /**
   * 显示消息提示
   */
  showToast(title, message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;
    
    const toastId = `toast-${Date.now()}`;
    const typeClass = type === 'error' ? 'bg-danger' : 
                     (type === 'success' ? 'bg-success' : 'bg-info');
    
    const toastHtml = `
      <div id="${toastId}" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
        <div class="toast-header ${typeClass} text-white">
          <strong class="me-auto">${title}</strong>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body">
          ${message}
        </div>
      </div>
    `;
    
    toastContainer.insertAdjacentHTML('beforeend', toastHtml);
    
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, { autohide: true, delay: 5000 });
    toast.show();
    
    // 自动删除已关闭的Toast
    toastElement.addEventListener('hidden.bs.toast', () => {
      toastElement.remove();
    });
  }
  
  /**
   * 根据类型筛选交易记录
   * @param {string} type 交易类型：全部、入库、出库
   */
  filterTransactions(type) {
    if (!this.transactionTable) return;
    
    // 清除当前的搜索/筛选
    this.transactionTable.search('').columns().search('').draw();
    
    // 根据类型筛选
    if (type === '全部') {
      // 不做额外筛选
      this.transactionTable.column(1).search('').draw();
    } else if (type === '入库') {
      this.transactionTable.column(1).search('入库').draw();
    } else if (type === '出库') {
      this.transactionTable.column(1).search('出库').draw();
    }
  }
  
  /**
   * 根据日期范围筛选交易记录
   */
  filterTransactionsByDate() {
    const dateRange = document.getElementById('dateRangePicker').value;
    if (!dateRange || !this.transactionTable) return;
    
    // 这里假设日期格式为 YYYY-MM-DD - YYYY-MM-DD
    const dates = dateRange.split(' - ');
    if (dates.length !== 2) {
      this.showToast('日期格式错误', '请输入正确的日期范围格式：YYYY-MM-DD - YYYY-MM-DD', 'error');
      return;
    }
    
    const startDate = new Date(dates[0]);
    const endDate = new Date(dates[1]);
    
    // 添加一天到结束日期，确保包含结束日期当天
    endDate.setDate(endDate.getDate() + 1);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      this.showToast('日期格式错误', '请输入有效的日期格式', 'error');
      return;
    }
    
    // 使用自定义筛选条件
    $.fn.dataTable.ext.search.push(
      (settings, data, dataIndex) => {
        if (settings.nTable.id !== 'inoutTable') return true; // 只应用于交易记录表格
        
        const dateStr = data[0]; // 假设第一列是日期
        const rowDate = new Date(dateStr);
        
        return rowDate >= startDate && rowDate < endDate;
      }
    );
    
    // 应用筛选并清除自定义筛选函数
    this.transactionTable.draw();
    $.fn.dataTable.ext.search.pop();
  }
}

// 当DOM加载完成后初始化模块
document.addEventListener('DOMContentLoaded', () => {
  new InventoryList();
});

export default InventoryList; 