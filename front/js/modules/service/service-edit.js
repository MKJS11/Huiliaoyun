/**
 * 服务记录编辑模块
 */
import dataService from '../../services/data-service.js';
import { formatDate, showToast, validateForm } from '../../utils/ui-utils.js';

class ServiceEdit {
  constructor() {
    // 初始化属性
    this.serviceId = this.getServiceIdFromUrl();
    this.serviceData = null;
    this.customerSelect = null;
    this.membershipSelect = null;
    this.customers = [];
    this.memberships = [];
    this.therapists = [];
    this.selectedCustomerId = null;
    this.originalPaymentMethod = null;
    this.originalMembershipId = null;
    this.originalServiceFee = 0;
    
    // 绑定方法
    this.init = this.init.bind(this);
    this.loadService = this.loadService.bind(this);
    this.loadCustomers = this.loadCustomers.bind(this);
    this.loadMemberships = this.loadMemberships.bind(this);
    this.loadTherapists = this.loadTherapists.bind(this);
    this.setupEventListeners = this.setupEventListeners.bind(this);
    this.fillForm = this.fillForm.bind(this);
    this.handlePaymentMethodChange = this.handlePaymentMethodChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }
  
  /**
   * 从URL获取服务记录ID
   * @returns {string|null} 服务记录ID或null
   */
  getServiceIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
  }
  
  /**
   * 初始化模块
   */
  async init() {
    try {
      // 检查是否提供了服务记录ID
      if (!this.serviceId) {
        console.error('URL中缺少id参数');
        
        // 设置会话存储，用于在列表页面显示提示
        sessionStorage.setItem('serviceEditError', '无效的操作：缺少服务记录ID');
        
        // 重定向到服务列表页面
        window.location.href = 'service.html';
        return;
      }
      
      this.showLoading('正在加载服务记录...');
      
      // 加载服务记录数据
      const serviceData = await this.loadService();
      if (!serviceData) {
        this.hideLoading();
        return;
      }
      
      // 加载客户数据
      await this.loadCustomers();
      
      // 加载医师数据
      await this.loadTherapists();
      
      // 设置表单事件
      this.setupEventListeners();
      
      // 填充表单
      this.fillForm();
      
      this.hideLoading();
    } catch (error) {
      console.error('初始化服务记录编辑页面失败:', error);
      this.hideLoading();
      showToast('加载数据失败，请刷新页面重试', 'danger');
    }
  }
  
  /**
   * 加载服务记录数据
   */
  async loadService() {
    try {
      console.log(`正在加载服务记录，ID: ${this.serviceId}`);
      
      // 调用API获取服务记录详情
      const response = await dataService.getServiceById(this.serviceId);
      
      // 检查响应格式
      if (!response) {
        console.error('API返回空数据');
        showToast('获取服务记录详情失败：API返回空数据', 'danger');
        return null;
      }
      
      // 处理不同的响应格式
      let serviceData;
      if (response.success === false) {
        console.error('API返回错误:', response.message || '未知错误');
        showToast(`获取服务记录详情失败: ${response.message || '未知错误'}`, 'danger');
        return null;
      } else if (response.success === true && response.data) {
        // 标准格式：{ success: true, data: {...} }
        serviceData = response.data;
      } else if (response._id) {
        // 直接返回了服务记录对象
        serviceData = response;
      } else {
        console.error('无法识别的API响应格式:', response);
        showToast('获取服务记录详情失败：数据格式错误', 'danger');
        return null;
      }
      
      this.serviceData = serviceData;
      console.log('服务记录数据:', this.serviceData);
      
      // 验证关键字段
      if (!this.serviceData.customer || !this.serviceData.customer._id) {
        console.error('服务记录缺少客户信息');
        showToast('服务记录数据不完整：缺少客户信息', 'warning');
        // 继续处理，允许用户手动选择客户
      } else {
        // 保存客户ID
        this.selectedCustomerId = this.serviceData.customer._id;
      }
      
      // 保存原始支付方式和会员卡信息，用于后续更新
      this.originalPaymentMethod = this.serviceData.paymentMethod;
      this.originalMembershipId = this.serviceData.membership ? this.serviceData.membership._id : null;
      this.originalServiceFee = this.serviceData.serviceFee || 0;
      
      // 如果是会员卡支付，加载会员卡信息
      if (this.serviceData.paymentMethod === 'membership' && this.selectedCustomerId) {
        await this.loadMemberships(this.selectedCustomerId);
      }
      
      return this.serviceData;
    } catch (error) {
      console.error('加载服务记录出错:', error);
      showToast('加载服务记录失败：' + (error.message || '网络错误'), 'danger');
      return null;
    }
  }
  
  /**
   * 加载客户数据
   */
  async loadCustomers() {
    try {
      console.log('正在加载客户列表...');
      
      // 调用API获取客户列表
      const response = await dataService.getAllCustomers();
      
      // 检查响应结构并正确处理不同的返回格式
      if (!response) {
        console.warn('客户列表返回数据为空');
        this.customers = [];
        showToast('客户数据为空，可能影响编辑功能', 'warning');
      } else if (Array.isArray(response)) {
        // 直接返回了数组
        console.log('API直接返回了客户数组');
        this.customers = response;
      } else if (response.data && Array.isArray(response.data)) {
        // 标准格式：{data: [...]}
        this.customers = response.data;
      } else if (typeof response === 'object' && Object.keys(response).length > 0) {
        // 检查是否是数组类对象（如Arguments, NodeList等）
        if (response.length !== undefined && typeof response !== 'string') {
          console.log('API返回了类数组对象，尝试转换');
          this.customers = Array.from(response);
        } else {
          console.warn('客户列表返回了意外的对象格式:', response);
          this.customers = [];
          showToast('客户数据格式不正确，可能影响编辑功能', 'warning');
        }
      } else {
        console.warn('客户列表返回数据格式无法识别:', response);
        this.customers = [];
        showToast('客户数据格式不正确，可能影响编辑功能', 'warning');
      }
      
      console.log(`已加载 ${this.customers.length} 个客户:`, this.customers);
      
      // 初始化客户选择器
      this.initCustomerSelect();
      
      return this.customers;
    } catch (error) {
      console.error('加载客户列表出错:', error);
      
      // 确保customers为空数组而不是undefined
      this.customers = [];
      
      showToast('加载客户列表失败，请检查网络连接', 'danger');
      
      // 尝试初始化客户选择器
      try {
        this.initCustomerSelect();
      } catch (selectError) {
        console.error('初始化客户选择器失败:', selectError);
      }
      
      // 不再抛出错误，允许页面继续加载
      return this.customers;
    }
  }
  
  /**
   * 初始化客户选择器
   */
  initCustomerSelect() {
    const customerElement = document.getElementById('customer');
    if (!customerElement) {
      console.warn('找不到客户选择元素(#customer)');
      return;
    }
    
    // 清空现有选项
    while (customerElement.options.length > 1) {
      customerElement.remove(1);
    }
    
    // 确保客户列表存在且是数组
    if (!this.customers || !Array.isArray(this.customers)) {
      console.warn('客户列表无效，初始化为空数组');
      this.customers = [];
      
      // 如果没有客户数据，添加一个提示选项
      const emptyOption = document.createElement('option');
      emptyOption.value = "";
      emptyOption.textContent = "-- 暂无客户数据 --";
      emptyOption.disabled = true;
      customerElement.appendChild(emptyOption);
      
      // 禁用选择器并显示警告
      customerElement.disabled = true;
      showToast('无法获取客户数据，请刷新页面或联系管理员', 'warning');
      return;
    }
    
    // 如果客户列表为空，添加提示
    if (this.customers.length === 0) {
      const emptyOption = document.createElement('option');
      emptyOption.value = "";
      emptyOption.textContent = "-- 没有可用的客户 --";
      emptyOption.disabled = true;
      customerElement.appendChild(emptyOption);
    } else {
      // 添加客户选项
      this.customers.forEach(customer => {
        try {
          // 确保customer对象有效
          if (!customer || typeof customer !== 'object') {
            console.warn('跳过无效的客户记录:', customer);
            return;
          }
          
          const option = document.createElement('option');
          option.value = customer._id || '';
          
          // 安全地构建显示名称
          let displayName = '未知客户';
          if (customer.childName) {
            displayName = customer.childName;
            
            // 添加年龄信息（如果有）
            if (customer.childAge) {
              displayName += ` (${customer.childAge}岁`;
              
              // 添加性别信息（如果有）
              if (customer.childGender) {
                displayName += customer.childGender === 'male' ? '男' : '女';
              }
              
              displayName += ')';
            }
          }
          
          option.textContent = displayName;
          
          // 安全地设置customer数据属性
          try {
            option.setAttribute('data-customer', JSON.stringify(customer));
          } catch (jsonError) {
            console.warn('无法序列化客户数据:', jsonError);
            option.setAttribute('data-customer', '{}');
          }
          
          customerElement.appendChild(option);
        } catch (optionError) {
          console.error('创建客户选项时出错:', optionError);
        }
      });
    }
  }
  
  /**
   * 加载会员卡数据
   * @param {string} customerId 客户ID
   */
  async loadMemberships(customerId) {
    if (!customerId) {
      console.warn('无法加载会员卡：客户ID为空');
      // 初始化为空数组
      this.memberships = [];
      // 尝试初始化会员卡选择器
      try { this.initMembershipSelect(); } catch (e) { console.error('初始化空会员卡选择器失败:', e); }
      return this.memberships;
    }
    
    try {
      console.log(`正在加载客户会员卡，客户ID: ${customerId}`);
      
      // 调用API获取会员卡列表
      const response = await dataService.getCustomerMemberships(customerId);
      
      // 处理不同的响应格式
      if (!response) {
        console.warn('会员卡列表返回数据为空');
        this.memberships = [];
      } else if (Array.isArray(response)) {
        // API直接返回了会员卡数组
        console.log('API直接返回了会员卡数组');
        this.memberships = response;
      } else if (response.data && Array.isArray(response.data)) {
        // 标准格式：{data: [...]}
        this.memberships = response.data;
      } else if (typeof response === 'object' && Object.keys(response).length > 0) {
        // 检查是否是数组类对象
        if (response.length !== undefined && typeof response !== 'string') {
          console.log('API返回了类数组对象，尝试转换');
          this.memberships = Array.from(response);
        } else {
          console.warn('会员卡列表返回了意外的对象格式:', response);
          this.memberships = [];
        }
      } else {
        console.warn('会员卡列表返回数据格式无法识别:', response);
        this.memberships = [];
      }
      
      // 过滤掉无效的会员卡记录
      this.memberships = this.memberships.filter(card => card && typeof card === 'object');
      console.log(`已加载 ${this.memberships.length} 张会员卡:`, this.memberships);
      
      // 初始化会员卡选择器
      this.initMembershipSelect();
      
      return this.memberships;
    } catch (error) {
      console.error('加载会员卡列表出错:', error);
      
      // 确保memberships为空数组而不是undefined
      this.memberships = [];
      
      showToast('加载会员卡列表失败，请检查网络连接', 'warning');
      
      // 尝试初始化会员卡选择器
      try {
        this.initMembershipSelect();
      } catch (selectError) {
        console.error('初始化会员卡选择器失败:', selectError);
      }
      
      // 不再抛出错误，允许页面继续加载
      return this.memberships;
    }
  }
  
  /**
   * 初始化会员卡选择器
   */
  initMembershipSelect() {
    const membershipElement = document.getElementById('membership');
    if (!membershipElement) {
      console.warn('找不到会员卡选择元素(#membership)');
      return;
    }
    
    // 清空现有选项
    while (membershipElement.options.length > 1) {
      membershipElement.remove(1);
    }
    
    // 确保会员卡列表存在且是数组
    if (!this.memberships || !Array.isArray(this.memberships)) {
      console.warn('会员卡列表无效，初始化为空数组');
      this.memberships = [];
    }
    
    // 如果会员卡列表为空，添加提示
    if (this.memberships.length === 0) {
      const emptyOption = document.createElement('option');
      emptyOption.value = "";
      emptyOption.textContent = "-- 没有可用的会员卡 --";
      emptyOption.disabled = true;
      membershipElement.appendChild(emptyOption);
      
      // 清空余额显示
      const balanceInput = document.getElementById('membershipBalance');
      if (balanceInput) {
        balanceInput.value = '';
      }
    } else {
      // 添加会员卡选项
      this.memberships.forEach(membership => {
        try {
          // 确保membership对象有效
          if (!membership || typeof membership !== 'object') {
            console.warn('跳过无效的会员卡记录:', membership);
            return;
          }
          
          const option = document.createElement('option');
          option.value = membership._id || '';
          
          // 安全地构建显示文本
          let displayText = '未知会员卡';
          if (membership.cardNumber) {
            displayText = membership.cardNumber;
            
            // 添加余额信息（如果有）
            if (typeof membership.balance === 'number') {
              displayText += ` (余额: ¥${membership.balance.toFixed(2)})`;
            }
          }
          
          option.textContent = displayText;
          
          // 安全地设置balance属性
          if (typeof membership.balance === 'number') {
            option.setAttribute('data-balance', membership.balance);
          } else {
            option.setAttribute('data-balance', '0');
          }
          
          membershipElement.appendChild(option);
        } catch (optionError) {
          console.error('创建会员卡选项时出错:', optionError);
        }
      });
    }
    
    // 监听会员卡选择变化
    membershipElement.addEventListener('change', (e) => {
      try {
        const selectedOption = e.target.options[e.target.selectedIndex];
        if (!selectedOption) return;
        
        const balance = selectedOption.getAttribute('data-balance');
        const balanceInput = document.getElementById('membershipBalance');
        
        if (balanceInput) {
          balanceInput.value = balance ? parseFloat(balance).toFixed(2) : '';
        }
      } catch (changeError) {
        console.error('处理会员卡选择变化时出错:', changeError);
      }
    });
  }
  
  /**
   * 设置事件监听器
   */
  setupEventListeners() {
    // 支付方式变化事件
    document.getElementById('paymentMethod').addEventListener('change', this.handlePaymentMethodChange);
    
    // 表单提交事件
    document.getElementById('serviceForm').addEventListener('submit', this.handleSubmit);
    
    // 取消按钮点击事件
    document.getElementById('cancelBtn').addEventListener('click', () => {
      window.location.href = 'service.html';
    });
    
    // 查看详情按钮链接
    const viewBtn = document.getElementById('viewServiceBtn');
    if (viewBtn) {
      viewBtn.href = `service-detail.html?id=${this.serviceId}`;
    }
  }
  
  /**
   * 填充表单
   */
  fillForm() {
    try {
      if (!this.serviceData) {
        console.error('没有服务记录数据可填充');
        showToast('无法获取服务记录数据', 'danger');
        return;
      }
      
      console.log('开始填充表单数据:', this.serviceData);
      
      // 设置隐藏的服务记录ID字段
      const serviceIdField = document.getElementById('serviceId');
      if (serviceIdField) {
        serviceIdField.value = this.serviceId || '';
      }
      
      // 选择客户
      const customerSelect = document.getElementById('customer');
      if (customerSelect && this.serviceData.customer && this.serviceData.customer._id) {
        try {
          customerSelect.value = this.serviceData.customer._id;
          
          // 检查是否成功设置了选项
          if (customerSelect.value !== this.serviceData.customer._id) {
            console.warn(`无法选择客户ID ${this.serviceData.customer._id}，可能不在列表中`);
            showToast('客户数据不完整，请重新选择客户', 'warning');
          }
        } catch (selectError) {
          console.error('设置客户选项时出错:', selectError);
        }
      } else {
        console.warn('服务记录中缺少客户信息或ID');
      }
      
      // 填充服务类型
      const serviceTypeSelect = document.getElementById('serviceType');
      if (serviceTypeSelect && this.serviceData.serviceType) {
        try {
          serviceTypeSelect.value = this.serviceData.serviceType;
        } catch (typeError) {
          console.error('设置服务类型时出错:', typeError);
        }
      }
      
      // 填充服务日期时间
      const serviceDate = document.getElementById('serviceDate');
      if (serviceDate && this.serviceData.serviceDate) {
        try {
          // 格式化日期时间为HTML datetime-local格式 (YYYY-MM-DDTHH:MM)
          const date = new Date(this.serviceData.serviceDate);
          if (!isNaN(date.getTime())) {
            const formattedDate = date.toISOString().slice(0, 16);
            serviceDate.value = formattedDate;
          } else {
            console.warn('无效的服务日期:', this.serviceData.serviceDate);
            serviceDate.value = new Date().toISOString().slice(0, 16); // 设置为当前时间
          }
        } catch (dateError) {
          console.error('设置服务日期时出错:', dateError);
          // 失败时设置为当前时间
          serviceDate.value = new Date().toISOString().slice(0, 16);
        }
      }
      
      // 填充医师
      const therapistSelect = document.getElementById('therapist');
      if (therapistSelect && this.serviceData.therapist) {
        try {
          therapistSelect.value = this.serviceData.therapist;
        } catch (therapistError) {
          console.error('设置医师时出错:', therapistError);
        }
      }
      
      // 填充服务费用
      const serviceFee = document.getElementById('serviceFee');
      if (serviceFee) {
        if (typeof this.serviceData.serviceFee === 'number') {
          serviceFee.value = this.serviceData.serviceFee;
          
          // 记录原始服务费用，供计算会员卡消费使用
          this.originalServiceFee = this.serviceData.serviceFee;
        } else {
          console.warn('服务费用不是数字:', this.serviceData.serviceFee);
          serviceFee.value = 0; // 默认为0
          this.originalServiceFee = 0;
        }
      }
      
      // 填充支付方式
      const paymentMethod = document.getElementById('paymentMethod');
      if (paymentMethod && this.serviceData.paymentMethod) {
        try {
          paymentMethod.value = this.serviceData.paymentMethod;
          
          // 记录原始支付方式
          this.originalPaymentMethod = this.serviceData.paymentMethod;
          
          // 如果是会员卡支付，显示会员卡选择部分
          if (this.serviceData.paymentMethod === 'membership') {
            const membershipSection = document.getElementById('membershipSection');
            if (membershipSection) {
              membershipSection.style.display = 'flex';
            }
            
            // 记录原始会员卡ID
            if (this.serviceData.membership && this.serviceData.membership._id) {
              this.originalMembershipId = this.serviceData.membership._id;
            }
            
            // 选择会员卡
            const membershipSelect = document.getElementById('membership');
            if (membershipSelect && this.serviceData.membership && this.serviceData.membership._id) {
              // 延迟设置值，确保下拉框已经初始化完成
              setTimeout(() => {
                try {
                  membershipSelect.value = this.serviceData.membership._id;
                  
                  // 检查是否成功设置了选项
                  if (membershipSelect.value !== this.serviceData.membership._id) {
                    console.warn(`无法选择会员卡ID ${this.serviceData.membership._id}，可能不在列表中`);
                    showToast('无法找到原会员卡，请重新选择', 'warning');
                  }
                  
                  // 显示会员卡余额
                  const balanceInput = document.getElementById('membershipBalance');
                  if (balanceInput && this.serviceData.membership.balance !== undefined) {
                    const balance = this.serviceData.membership.balance;
                    balanceInput.value = typeof balance === 'number' ? balance.toFixed(2) : '0.00';
                  }
                } catch (membershipError) {
                  console.error('设置会员卡选项时出错:', membershipError);
                }
              }, 500);
            } else {
              console.warn('会员卡支付但缺少会员卡信息或ID');
            }
          }
        } catch (paymentError) {
          console.error('设置支付方式时出错:', paymentError);
        }
      }
      
      // 填充症状描述
      const symptoms = document.getElementById('symptoms');
      if (symptoms) {
        symptoms.value = this.serviceData.symptoms || '';
      }
      
      // 填充诊断结果
      const diagnosis = document.getElementById('diagnosis');
      if (diagnosis) {
        diagnosis.value = this.serviceData.diagnosis || '';
      }
      
      // 填充推拿治疗
      const treatment = document.getElementById('treatment');
      if (treatment) {
        treatment.value = this.serviceData.treatment || '';
      }
      
      // 填充备注说明
      const notes = document.getElementById('notes');
      if (notes) {
        notes.value = this.serviceData.notes || '';
      }
      
      console.log('表单数据填充完成');
    } catch (error) {
      console.error('填充表单时出错:', error);
      showToast('填充表单失败，请检查网络连接', 'danger');
    }
  }
  
  /**
   * 处理支付方式变化
   * @param {Event} event 事件对象
   */
  handlePaymentMethodChange(event) {
    const paymentMethod = event.target.value;
    const membershipSection = document.getElementById('membershipSection');
    
    // 如果选择会员卡支付，显示会员卡选择部分
    if (paymentMethod === 'membership') {
      membershipSection.style.display = 'flex';
      
      // 如果尚未加载会员卡，加载会员卡
      if (this.memberships.length === 0 && this.selectedCustomerId) {
        this.loadMemberships(this.selectedCustomerId);
      }
    } else {
      membershipSection.style.display = 'none';
    }
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
    
    // 获取表单数据
    const formData = new FormData(event.target);
    let serviceData = Object.fromEntries(formData.entries());
    
    // 处理服务类型，确保使用服务项目的名称而不是ID
    if (serviceData.serviceType) {
      const serviceTypeId = serviceData.serviceType;
      
      // 尝试查找服务项目对象
      try {
        const serviceItems = await dataService.getAllServiceItems();
        if (serviceItems && serviceItems.data) {
          const selectedItem = serviceItems.data.find(item => item._id === serviceTypeId);
          if (selectedItem && selectedItem.name) {
            console.log(`将服务类型ID "${serviceTypeId}" 转换为名称 "${selectedItem.name}"`);
            serviceData.serviceType = selectedItem.name;
          }
        }
      } catch (error) {
        console.error('获取服务项目失败，将使用原始serviceType值:', error);
      }
    }
    
    // 转换数据类型
    serviceData.serviceFee = parseFloat(serviceData.serviceFee);
    
    // 验证如果使用会员卡支付，必须选择会员卡
    if (serviceData.paymentMethod === 'membership' && !serviceData.membership) {
      showToast('使用会员卡支付时必须选择会员卡', 'warning');
      document.getElementById('membership').focus();
      return;
    }
    
    // 如果不是会员卡支付，移除会员卡字段，避免空字符串引起的ObjectId转换错误
    if (serviceData.paymentMethod !== 'membership') {
      console.log('非会员卡支付，移除membership字段');
      delete serviceData.membership;
    }
    
    // 移除所有空字符串字段
    for (const key in serviceData) {
      if (serviceData[key] === '') {
        console.log(`字段 ${key} 为空，从提交数据中移除`);
        delete serviceData[key];
      }
    }
    
    // 如果是会员卡支付，验证余额是否足够（仅当更改支付方式或金额时）
    if (serviceData.paymentMethod === 'membership' && 
        (this.originalPaymentMethod !== 'membership' || 
         serviceData.membership !== this.originalMembershipId || 
         serviceData.serviceFee > this.originalServiceFee)) {
      
      const membershipSelect = document.getElementById('membership');
      const selectedOption = membershipSelect.options[membershipSelect.selectedIndex];
      const balance = parseFloat(selectedOption.getAttribute('data-balance') || 0);
      
      // 如果是原来的会员卡，需要考虑原始金额的退还
      let effectiveBalance = balance;
      if (serviceData.membership === this.originalMembershipId && this.originalPaymentMethod === 'membership') {
        effectiveBalance += this.originalServiceFee;
      }
      
      if (effectiveBalance < serviceData.serviceFee) {
        showToast('会员卡余额不足', 'warning');
        return;
      }
    }
    
    console.log('提交服务记录数据:', serviceData);
    
    try {
      this.showLoading('正在保存服务记录...');
      
      // 调用API更新服务记录
      const response = await dataService.updateService(this.serviceId, serviceData);
      
      this.hideLoading();
      showToast('服务记录更新成功', 'success');
      
      // 跳转到服务记录列表页
      setTimeout(() => {
        window.location.href = 'service.html';
      }, 1500);
    } catch (error) {
      console.error('更新服务记录出错:', error);
      this.hideLoading();
      showToast(`更新服务记录失败: ${error.message || '未知错误'}`, 'danger');
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
    // 隐藏loading元素
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
      loadingElement.style.display = 'none';
    }
  }

  /**
   * 加载医师数据
   */
  async loadTherapists() {
    try {
      const response = await dataService.getAllTherapists();
      
      if (response.success) {
        this.therapists = response.data || [];
        
        // 获取医师选择框
        const therapistSelect = document.getElementById('therapist');
        if (!therapistSelect) return;
        
        // 清空现有选项，只保留默认选项
        therapistSelect.innerHTML = '<option value="">请选择推拿师...</option>';
        
        // 添加医师选项
        this.therapists.forEach(therapist => {
          // 只添加活跃状态的医师
          if (therapist.isActive !== false) {
            const option = document.createElement('option');
            option.value = therapist._id;
            option.textContent = therapist.name + (therapist.title ? ` (${therapist.title})` : '');
            therapistSelect.appendChild(option);
          }
        });
        
        // 如果当前服务记录有医师，设置选中状态
        if (this.service && this.service.therapist) {
          therapistSelect.value = typeof this.service.therapist === 'object' ? 
            this.service.therapist._id : this.service.therapist;
        }
      } else {
        console.error('获取医师列表失败:', response.message);
      }
    } catch (error) {
      console.error('加载医师数据失败:', error);
    }
  }
}

// 初始化模块
document.addEventListener('DOMContentLoaded', () => {
  const serviceEdit = new ServiceEdit();
  serviceEdit.init();
});

export default ServiceEdit; 