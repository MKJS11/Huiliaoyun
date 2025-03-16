/**
 * 会员卡办理模块
 */
import dataService from '../../services/data-service.js';
import { showToast, validateForm } from '../../utils/ui-utils.js';

class MembershipAdd {
  constructor() {
    // 初始化属性
    this.customers = [];
    this.selectedCustomerId = null;
    this.customerData = null;
    this.cardType = null;
    this.flatpickr = null;
    this.membershipTypes = []; // 存储系统设置的会员卡类型
    this.selectedMembershipType = null; // 当前选择的会员卡类型
    this.useManualSettings = false; // 是否使用手动设置
    
    // 绑定方法
    this.init = this.init.bind(this);
    this.loadCustomers = this.loadCustomers.bind(this);
    this.loadMembershipTypes = this.loadMembershipTypes.bind(this);
    this.setupEventListeners = this.setupEventListeners.bind(this);
    this.handleCustomerSelect = this.handleCustomerSelect.bind(this);
    this.handleCardTypeChange = this.handleCardTypeChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.updateExpiryDate = this.updateExpiryDate.bind(this);
    this.updateBonusAmount = this.updateBonusAmount.bind(this);
    this.calculateBonus = this.calculateBonus.bind(this);
    this.initDatePickers = this.initDatePickers.bind(this);
    this.handleMembershipTypeSelect = this.handleMembershipTypeSelect.bind(this);
    this.toggleManualSettings = this.toggleManualSettings.bind(this);
    this.updatePriceFields = this.updatePriceFields.bind(this);
  }
  
  /**
   * 初始化模块
   */
  async init() {
    try {
      this.showLoading('正在加载数据...');
      
      // 加载客户列表
      await this.loadCustomers();
      
      // 加载会员卡类型
      await this.loadMembershipTypes();
      
      // 初始化日期选择器
      this.initDatePickers();
      
      // 设置事件监听
      this.setupEventListeners();
      
      // 确保赠送金额字段可编辑
      const bonusAmountInput = document.getElementById('bonusAmount');
      if (bonusAmountInput) {
        bonusAmountInput.readOnly = false;
        bonusAmountInput.disabled = false;
      }
      
      this.hideLoading();
    } catch (error) {
      console.error('初始化会员卡办理页面失败:', error);
      this.hideLoading();
      showToast('加载数据失败，请刷新页面重试', 'danger');
    }
  }
  
  /**
   * 加载客户列表
   */
  async loadCustomers() {
    try {
      const response = await dataService.getAllCustomers();
      
      if (!response.success && !Array.isArray(response)) {
        throw new Error(response.message || '获取客户列表失败');
      }
      
      this.customers = Array.isArray(response) ? response : (response.data || []);
      console.log(`已加载 ${this.customers.length} 个客户:`, this.customers);
      
      // 初始化客户选择器
      this.initCustomerSelect();
      
      return this.customers;
    } catch (error) {
      console.error('加载客户列表出错:', error);
      showToast('加载客户列表失败: ' + (error.message || '服务器错误'), 'danger');
      return [];
    }
  }
  
  /**
   * 初始化客户选择器
   */
  initCustomerSelect() {
    const customerSelect = document.getElementById('customerSelect');
    if (!customerSelect) return;
    
    // 清空现有选项
    while (customerSelect.options.length > 1) {
      customerSelect.remove(1);
    }
    
    // 添加客户选项
    this.customers.forEach(customer => {
      const option = document.createElement('option');
      option.value = customer._id;
      
      let childName = customer.childName || '未知姓名';
      let childInfo = '';
      
      if (customer.childAge) {
        childInfo += `${customer.childAge}岁`;
      }
      
      if (customer.childGender) {
        childInfo += `，${customer.childGender === 'male' ? '男' : '女'}`;
      }
      
      option.textContent = childInfo ? `${childName} (${childInfo})` : childName;
      customerSelect.appendChild(option);
    });
  }
  
  /**
   * 初始化日期选择器
   */
  initDatePickers() {
    // 有效期结束日期
    if (flatpickr && document.getElementById('expiryDate')) {
      this.flatpickr = flatpickr(document.getElementById('expiryDate'), {
        dateFormat: 'Y-m-d',
        minDate: 'today',
        locale: {
          firstDayOfWeek: 1,
          weekdays: {
            shorthand: ['日', '一', '二', '三', '四', '五', '六'],
            longhand: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
          },
          months: {
            shorthand: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
            longhand: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
          },
          rangeSeparator: ' 至 ',
          weekAbbreviation: '周',
          scrollTitle: '滚动切换',
          toggleTitle: '点击切换 12/24 小时时制'
        }
      });
    }
  }
  
  /**
   * 加载系统设置中的会员卡类型
   */
  async loadMembershipTypes() {
    try {
      const apiUrl = 'http://localhost:5201/api';
      const response = await fetch(`${apiUrl}/settings/membership-types`);
      const result = await response.json();
      
      if (result.success) {
        this.membershipTypes = result.data;
        this.initMembershipTypeSelect();
      } else {
        console.error('加载会员卡类型失败:', result.message);
      }
    } catch (error) {
      console.error('加载会员卡类型出错:', error);
    }
  }
  
  /**
   * 初始化会员卡类型选择下拉框
   */
  initMembershipTypeSelect() {
    const cardTypeSelect = document.getElementById('cardType');
    const membershipTypeSelect = document.getElementById('membershipTypeSelect');
    
    if (!membershipTypeSelect) {
      // 创建会员卡类型选择下拉框
      const typeContainer = cardTypeSelect.closest('.mb-3');
      const div = document.createElement('div');
      div.className = 'mb-3';
      div.innerHTML = `
        <label for="membershipTypeSelect" class="form-label">会员卡套餐</label>
        <select class="form-select" id="membershipTypeSelect" name="membershipTypeSelect">
          <option value="" selected disabled>请选择会员卡套餐...</option>
        </select>
      `;
      typeContainer.after(div);
    }
    
    const select = document.getElementById('membershipTypeSelect');
    
    // 先清空现有选项
    while (select.options.length > 1) {
      select.remove(1);
    }
    
    // 添加会员卡类型选项
    this.membershipTypes.forEach(type => {
      const option = document.createElement('option');
      option.value = type._id;
      option.dataset.category = type.category;
      option.dataset.price = type.price;
      option.dataset.valueAmount = type.valueAmount;
      option.dataset.serviceCount = type.serviceCount;
      option.dataset.validityDays = type.validityDays;
      
      // 设置显示文本格式：名称（价格）- 说明
      let optionText = `${type.name}（${type.price}元）`;
      
      if (type.category === 'count') {
        optionText += ` - ${type.serviceCount}次`;
      } else if (type.category === 'value') {
        optionText += ` - 储值${type.valueAmount}元`;
      } else if (type.category === 'mixed') {
        optionText += ` - ${type.serviceCount}次 + 储值${type.valueAmount}元`;
      }
      
      optionText += ` (${type.validityDays}天)`;
      
      option.textContent = optionText;
      select.appendChild(option);
    });
    
    // 确保赠送金额字段可编辑
    const bonusAmountInput = document.getElementById('bonusAmount');
    if (bonusAmountInput) {
      bonusAmountInput.readOnly = false;
      bonusAmountInput.disabled = false;
    }
  }
  
  /**
   * 处理会员卡套餐选择
   */
  handleMembershipTypeSelect(event) {
    const select = event.target;
    const selectedOption = select.options[select.selectedIndex];
    
    if (selectedOption.value) {
      const cardType = selectedOption.dataset.category;
      const price = selectedOption.dataset.price;
      const valueAmount = selectedOption.dataset.valueAmount;
      const serviceCount = selectedOption.dataset.serviceCount;
      const validityDays = selectedOption.dataset.validityDays;
      
      // 保存选择的会员卡类型信息
      this.selectedMembershipType = {
        id: selectedOption.value,
        category: cardType,
        price: price,
        valueAmount: valueAmount,
        serviceCount: serviceCount,
        validityDays: validityDays
      };
      
      // 设置卡类型
      const cardTypeSelect = document.getElementById('cardType');
      if (cardTypeSelect) {
        cardTypeSelect.value = cardType;
        this.cardType = cardType;
      }
      
      // 设置到期日期
      const today = new Date();
      const expiryDate = new Date(today);
      expiryDate.setDate(today.getDate() + parseInt(validityDays));
      
      if (this.flatpickr) {
        this.flatpickr.setDate(expiryDate);
      }
      
      // 更新价格字段
      this.updatePriceFields();
      
      // 确保赠送金额字段可编辑
      const bonusAmountInput = document.getElementById('bonusAmount');
      if (bonusAmountInput) {
        bonusAmountInput.readOnly = false;
        bonusAmountInput.disabled = false;
      }
      
      // 如果启用了手动设置，触发卡类型变更事件
      if (this.useManualSettings && cardTypeSelect) {
        this.handleCardTypeChange({ target: cardTypeSelect });
        
        // 设置相关值
        if (cardType === 'count' || cardType === 'mixed') {
          document.getElementById('cardCount').value = serviceCount;
        }
        
        if (cardType === 'value' || cardType === 'mixed') {
          document.getElementById('initialAmount').value = valueAmount;
        }
      }
    } else {
      this.selectedMembershipType = null;
    }
  }
  
  /**
   * 设置事件监听器
   */
  setupEventListeners() {
    // 客户选择变化
    document.getElementById('customerSelect').addEventListener('change', this.handleCustomerSelect);
    
    // 会员卡类型选择
    document.getElementById('membershipTypeSelect').addEventListener('change', this.handleMembershipTypeSelect);
    
    // 手动设置切换
    const showManualSettings = document.getElementById('showManualSettings');
    if (showManualSettings) {
      showManualSettings.addEventListener('change', this.toggleManualSettings);
    }
    
    // 卡类型变化
    document.getElementById('cardType')?.addEventListener('change', this.handleCardTypeChange);
    
    // 表单提交
    document.getElementById('membershipForm').addEventListener('submit', this.handleSubmit);
    
    // 有效期类型变化
    const periodType = document.getElementById('periodType');
    if (periodType) {
      periodType.addEventListener('change', this.updateExpiryDate);
    }
    
    // 有效期数值变化
    const periodValue = document.getElementById('periodValue');
    if (periodValue) {
      periodValue.addEventListener('input', this.updateExpiryDate);
    }
    
    // 充值金额变化 - 移除自动计算赠送金额的逻辑
    // const initialAmount = document.getElementById('initialAmount');
    // if (initialAmount) {
    //   initialAmount.addEventListener('input', this.updateBonusAmount);
    // }
    
    // 次数/金额输入框变化
    const cardCount = document.getElementById('cardCount');
    if (cardCount) {
      cardCount.addEventListener('input', () => {
        const count = parseInt(cardCount.value) || 0;
        const price = parseFloat(document.getElementById('unitPrice').value) || 0;
        document.getElementById('initialAmount').value = (count * price).toFixed(2);
        // 移除自动计算赠送金额
        // this.updateBonusAmount();
      });
    }
    
    // 单价变化
    const unitPrice = document.getElementById('unitPrice');
    if (unitPrice) {
      unitPrice.addEventListener('input', () => {
        const count = parseInt(document.getElementById('cardCount').value) || 0;
        const price = parseFloat(unitPrice.value) || 0;
        document.getElementById('initialAmount').value = (count * price).toFixed(2);
        // 移除自动计算赠送金额
        // this.updateBonusAmount();
      });
    }
    
    // 客户搜索按钮
    const searchCustomerBtn = document.getElementById('searchCustomerBtn');
    if (searchCustomerBtn) {
      searchCustomerBtn.addEventListener('click', () => {
        // TODO: 实现客户搜索功能
        alert('客户搜索功能暂未实现，请从下拉列表选择客户');
      });
    }
    
    // 取消按钮
    const cancelBtn = document.getElementById('cancelBtn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        window.location.href = 'membership.html';
      });
    }
  }
  
  /**
   * 处理客户选择变化
   * @param {Event} event 事件对象
   */
  async handleCustomerSelect(event) {
    const customerId = event.target.value;
    if (!customerId) {
      this.selectedCustomerId = null;
      this.customerData = null;
      
      // 清空客户信息
      document.getElementById('parentName').value = '';
      document.getElementById('contactPhone').value = '';
      return;
    }
    
    try {
      this.showLoading('正在加载客户信息...');
      this.selectedCustomerId = customerId;
      
      // 从已加载的客户列表中查找客户数据
      this.customerData = this.customers.find(c => c._id === customerId);
      
      // 如果没有找到，从API获取完整客户信息
      if (!this.customerData || !this.customerData.parentName) {
        const response = await dataService.getCustomerById(customerId);
        
        if (!response.success && !response._id) {
          throw new Error(response.message || '获取客户详情失败');
        }
        
        this.customerData = response.data || response;
      }
      
      // 填充客户信息
      document.getElementById('parentName').value = this.customerData.parentName || '';
      document.getElementById('contactPhone').value = this.customerData.phone || '';
      
      this.hideLoading();
    } catch (error) {
      console.error('获取客户详情出错:', error);
      this.hideLoading();
      showToast('获取客户详情失败: ' + (error.message || '服务器错误'), 'danger');
    }
  }
  
  /**
   * 处理卡类型变化
   * @param {Event} event 事件对象
   */
  handleCardTypeChange(event) {
    const cardType = event.target.value;
    this.cardType = cardType;
    
    // 隐藏所有卡类型相关字段
    document.querySelectorAll('.card-type-field').forEach(el => {
      el.classList.add('d-none');
    });
    
    // 显示通用字段
    document.querySelectorAll('.card-common-field').forEach(el => {
      el.classList.remove('d-none');
    });
    
    // 根据卡类型显示不同字段
    switch (cardType) {
      case 'count':
        // 次卡：显示次数和单价字段
        document.querySelectorAll('.card-count-field').forEach(el => {
          el.classList.remove('d-none');
        });
        break;
        
      case 'period':
        // 期限卡：显示有效期字段
        document.querySelectorAll('.card-period-field').forEach(el => {
          el.classList.remove('d-none');
        });
        break;
        
      case 'mixed':
        // 混合卡：显示次数和有效期字段
        document.querySelectorAll('.card-count-field, .card-period-field').forEach(el => {
          el.classList.remove('d-none');
        });
        break;
        
      case 'value':
        // 储值卡：显示充值字段
        document.querySelectorAll('.card-value-field').forEach(el => {
          el.classList.remove('d-none');
        });
        break;
    }
    
    // 更新必填字段
    this.updateRequiredFields();
  }
  
  /**
   * 更新必填字段
   */
  updateRequiredFields() {
    // 移除所有必填标记
    document.querySelectorAll('[data-required]').forEach(el => {
      el.removeAttribute('required');
    });
    
    // 根据卡类型设置必填字段
    switch (this.cardType) {
      case 'count':
        document.getElementById('cardCount').setAttribute('required', 'true');
        document.getElementById('unitPrice').setAttribute('required', 'true');
        break;
        
      case 'period':
        document.getElementById('periodValue').setAttribute('required', 'true');
        document.getElementById('periodType').setAttribute('required', 'true');
        break;
        
      case 'mixed':
        document.getElementById('cardCount').setAttribute('required', 'true');
        document.getElementById('unitPrice').setAttribute('required', 'true');
        document.getElementById('periodValue').setAttribute('required', 'true');
        document.getElementById('periodType').setAttribute('required', 'true');
        break;
        
      case 'value':
        document.getElementById('initialAmount').setAttribute('required', 'true');
        break;
    }
    
    // 通用必填字段
    document.getElementById('customerSelect').setAttribute('required', 'true');
    document.getElementById('cardType').setAttribute('required', 'true');
    document.getElementById('expiryDate').setAttribute('required', 'true');
  }
  
  /**
   * 更新到期日期
   */
  updateExpiryDate() {
    const periodType = document.getElementById('periodType');
    const periodValue = document.getElementById('periodValue');
    
    if (!periodType || !periodValue || !this.flatpickr) return;
    
    const type = periodType.value;
    const value = parseInt(periodValue.value) || 0;
    
    if (value <= 0) return;
    
    // 计算到期日期
    const today = new Date();
    let expiryDate = new Date(today);
    
    switch (type) {
      case 'day':
        expiryDate.setDate(today.getDate() + value);
        break;
      case 'week':
        expiryDate.setDate(today.getDate() + value * 7);
        break;
      case 'month':
        expiryDate.setMonth(today.getMonth() + value);
        break;
      case 'year':
        expiryDate.setFullYear(today.getFullYear() + value);
        break;
    }
    
    // 更新日期选择器
    this.flatpickr.setDate(expiryDate);
  }
  
  /**
   * 更新赠送金额 - 此方法保留，但不再自动计算赠送金额
   */
  updateBonusAmount() {
    // 移除自动计算赠送金额的逻辑，赠送金额由用户手动输入
    // const initialAmount = document.getElementById('initialAmount');
    // const bonusAmount = document.getElementById('bonusAmount');
    
    // if (!initialAmount || !bonusAmount) return;
    
    // const amount = parseFloat(initialAmount.value) || 0;
    
    // // 计算赠送金额
    // const bonus = this.calculateBonus(amount);
    // bonusAmount.value = bonus.toFixed(2);
  }
  
  /**
   * 计算赠送金额
   * @param {number} amount 充值金额
   * @returns {number} 赠送金额
   */
  calculateBonus(amount) {
    // 赠送政策：充1000送200，充500送80，充300送40，充100送10
    if (amount >= 1000) {
      return Math.floor(amount / 1000) * 200;
    } else if (amount >= 500) {
      return 80;
    } else if (amount >= 300) {
      return 40;
    } else if (amount >= 100) {
      return 10;
    }
    return 0;
  }
  
  /**
   * 处理表单提交
   * @param {Event} event 事件对象
   */
  async handleSubmit(event) {
    event.preventDefault();
    
    // 验证表单
    if (!validateForm(event.target)) {
      return;
    }
    
    // 验证是否选择了会员卡套餐
    if (!this.selectedMembershipType) {
      showToast('请选择会员卡套餐', 'danger');
      return;
    }
    
    try {
      this.showLoading('正在办理会员卡...');
      
      // 获取表单数据
      const formData = new FormData(event.target);
      const data = Object.fromEntries(formData.entries());
      
      // 准备会员卡数据
      const membershipData = {
        customer: data.customerSelect,
        cardType: this.selectedMembershipType.category,
        membershipTypeId: this.selectedMembershipType.id,
        status: 'active',
        expiryDate: data.expiryDate,
        notes: data.notes || ''
      };
      
      // 根据卡类型设置额外数据
      if (this.selectedMembershipType.category === 'count' || this.selectedMembershipType.category === 'mixed') {
        membershipData.count = parseInt(this.selectedMembershipType.serviceCount);
      }
      
      // 设置充值相关字段
      const initialAmount = parseFloat(data.initialAmount) || parseFloat(this.selectedMembershipType.price);
      const bonusAmount = parseFloat(data.bonusAmount) || 0;
      
      if (initialAmount > 0) {
        membershipData.initialAmount = initialAmount;
        membershipData.bonusAmount = bonusAmount;
        membershipData.paymentMethod = data.paymentMethod || 'cash';
      }
      
      // 设置余额（对储值卡）
      if (this.selectedMembershipType.category === 'value') {
        membershipData.balance = parseFloat(this.selectedMembershipType.valueAmount) + bonusAmount;
      }
      
      console.log('办理会员卡数据:', membershipData);
      
      // 调用API创建会员卡
      const response = await dataService.createMembership(membershipData);
      
      if (!response.success) {
        throw new Error(response.message || '创建会员卡失败');
      }
      
      this.hideLoading();
      showToast('会员卡办理成功', 'success');
      
      // 延迟跳转到会员卡列表页
      setTimeout(() => {
        window.location.href = 'membership.html';
      }, 1500);
      
    } catch (error) {
      console.error('办理会员卡出错:', error);
      this.hideLoading();
      showToast('办理会员卡失败: ' + (error.message || '服务器错误'), 'danger');
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
  
  /**
   * 切换手动设置显示
   */
  toggleManualSettings(event) {
    this.useManualSettings = event.target.checked;
    const container = document.getElementById('manualSettingsContainer');
    
    if (container) {
      container.style.display = this.useManualSettings ? 'block' : 'none';
    }
    
    // 确保赠送金额字段可编辑
    const bonusAmountInput = document.getElementById('bonusAmount');
    if (bonusAmountInput) {
      bonusAmountInput.readOnly = false;
      bonusAmountInput.disabled = false;
    }
    
    // 如果已经选择了会员卡类型，且启用了手动设置，填充字段
    if (this.useManualSettings && this.selectedMembershipType) {
      const cardTypeSelect = document.getElementById('cardType');
      if (cardTypeSelect) {
        cardTypeSelect.value = this.selectedMembershipType.category;
        this.handleCardTypeChange({ target: cardTypeSelect });
        
        // 设置相关值
        if (this.selectedMembershipType.category === 'count' || this.selectedMembershipType.category === 'mixed') {
          document.getElementById('cardCount').value = this.selectedMembershipType.serviceCount;
        }
        
        if (this.selectedMembershipType.category === 'value' || this.selectedMembershipType.category === 'mixed') {
          document.getElementById('initialAmount').value = this.selectedMembershipType.valueAmount;
        }
      }
    }
  }
  
  /**
   * 更新价格相关字段
   */
  updatePriceFields() {
    if (!this.selectedMembershipType) return;
    
    // 更新总价和充值字段
    const initialAmountInput = document.getElementById('initialAmount');
    if (initialAmountInput) {
      initialAmountInput.value = this.selectedMembershipType.price;
      // 不再触发自动计算赠送金额
      // this.updateBonusAmount();
    }
  }
}

// 初始化模块
document.addEventListener('DOMContentLoaded', () => {
  const membershipAdd = new MembershipAdd();
  membershipAdd.init();
});

export default MembershipAdd; 