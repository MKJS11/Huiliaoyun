/**
 * 服务记录添加模块
 */
import dataService from '../../services/data-service.js';
import { formatDate, showToast, validateForm } from '../../utils/ui-utils.js';

class ServiceAdd {
  constructor() {
    // 初始化属性
    this.customerSelect = null;
    this.membershipSelect = null;
    this.customers = [];
    this.memberships = [];
    this.therapists = [];
    this.serviceItems = [];
    this.selectedCustomerId = null;
    
    // 绑定方法
    this.init = this.init.bind(this);
    this.loadCustomers = this.loadCustomers.bind(this);
    this.loadMemberships = this.loadMemberships.bind(this);
    this.loadTherapists = this.loadTherapists.bind(this);
    this.loadServiceItems = this.loadServiceItems.bind(this);
    this.setupForm = this.setupForm.bind(this);
    this.handleCustomerChange = this.handleCustomerChange.bind(this);
    this.handlePaymentMethodChange = this.handlePaymentMethodChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.validateMembershipBalance = this.validateMembershipBalance.bind(this);
  }
  
  /**
   * 初始化模块
   */
  async init() {
    try {
      this.showLoading('正在加载数据...');
      
      // 加载客户数据
      await this.loadCustomers();
      
      // 加载医师数据
      await this.loadTherapists();
      
      // 加载服务项目数据
      await this.loadServiceItems();
      
      // 设置表单事件
      this.setupForm();
      
      // 设置当前日期时间为默认值
      this.setDefaultDateTime();
      
      this.hideLoading();
    } catch (error) {
      console.error('初始化服务记录添加页面失败:', error);
      this.hideLoading();
      showToast('加载数据失败，请刷新页面重试', 'danger');
    }
  }
  
  /**
   * 加载客户数据
   */
  async loadCustomers() {
    try {
      // 获取所有客户
      const response = await dataService.getAllCustomers();
      this.customers = response;
      
      // 初始化客户选择器
      this.initCustomerSelect();
      
      return this.customers;
    } catch (error) {
      console.error('加载客户数据出错:', error);
      showToast('加载客户数据失败，请重试', 'danger');
      throw error;
    }
  }
  
  /**
   * 初始化客户选择器
   */
  initCustomerSelect() {
    const customerSelect = document.getElementById('customer');
    if (!customerSelect) return;
    
    // 清空现有选项
    customerSelect.innerHTML = '<option value="">请选择客户...</option>';
    
    // 添加客户选项
    this.customers.forEach(customer => {
      if (!customer) return; // 跳过空客户记录
      
      const option = document.createElement('option');
      option.value = customer._id || '';
      
      // 安全处理客户信息显示
      const childName = customer.childName || '未知';
      const childAge = customer.childAge ? `${customer.childAge}岁` : '年龄未知';
      const parentName = customer.parentName || '家长未知';
      
      option.textContent = `${childName} (${childAge}) - ${parentName}`;
      customerSelect.appendChild(option);
    });
    
    // 初始化Tom Select
    this.customerSelect = new TomSelect(customerSelect, {
      create: false,
      sortField: {
        field: 'text',
        direction: 'asc'
      },
      placeholder: '请选择客户...'
    });
    
    // 添加选择事件
    this.customerSelect.on('change', this.handleCustomerChange);
  }
  
  /**
   * 处理客户选择变化
   * @param {string} customerId 客户ID
   */
  async handleCustomerChange(customerId) {
    if (!customerId) {
      this.selectedCustomerId = null;
      
      // 清空会员卡选择器
      if (this.membershipSelect) {
        this.membershipSelect.clear();
        this.membershipSelect.clearOptions();
        this.membershipSelect.addOption({ value: '', text: '无会员卡 / 不使用会员卡' });
        this.membershipSelect.refreshOptions();
      }
      
      return;
    }
    
    this.selectedCustomerId = customerId;
    
    try {
      // 加载该客户的会员卡
      await this.loadMemberships(customerId);
    } catch (error) {
      console.error('加载会员卡数据出错:', error);
      showToast('加载会员卡数据失败，请重试', 'danger');
    }
  }
  
  /**
   * 加载会员卡数据
   * @param {string} customerId 客户ID
   */
  async loadMemberships(customerId) {
    try {
      console.log(`正在加载客户会员卡，客户ID: ${customerId}`);
      
      // 调用API获取客户会员卡
      const response = await dataService.getCustomerMemberships(customerId);
      
      // 处理API响应，确保我们有正确的数组
      if (!response || !response.data) {
        console.warn('会员卡API返回数据为空或格式不正确');
        this.memberships = [];
      } else {
        this.memberships = response.data;
        console.log(`成功加载 ${this.memberships.length} 张会员卡:`, this.memberships);
      }
      
      // 初始化会员卡选择器
      this.initMembershipSelect();
      
      return this.memberships;
    } catch (error) {
      console.error('加载会员卡数据出错:', error);
      showToast('加载会员卡数据失败，请重试', 'danger');
      
      // 确保memberships为空数组
      this.memberships = [];
      
      // 尝试初始化会员卡选择器
      try {
        this.initMembershipSelect();
      } catch (selectError) {
        console.error('初始化会员卡选择器失败:', selectError);
      }
      
      throw error;
    }
  }
  
  /**
   * 初始化会员卡选择器
   */
  initMembershipSelect() {
    const membershipSelect = document.getElementById('membership');
    if (!membershipSelect) return;
    
    // 销毁现有选择器
    if (this.membershipSelect) {
      this.membershipSelect.destroy();
    }
    
    // 清空现有选项
    membershipSelect.innerHTML = '<option value="">无会员卡 / 不使用会员卡</option>';
    
    // 添加会员卡选项
    this.memberships.forEach(membership => {
      // 只显示状态为active的会员卡
      if (membership.status !== 'active') {
        console.log(`跳过非活动状态的会员卡: ${membership.cardNumber} (状态: ${membership.status})`);
        return;
      }
      
      // 检查会员卡是否过期
      const expiryDate = new Date(membership.expiryDate);
      const now = new Date();
      if (expiryDate < now) {
        console.log(`跳过已过期的会员卡: ${membership.cardNumber} (过期时间: ${expiryDate.toLocaleDateString()})`);
        return;
      }
      
      const option = document.createElement('option');
      option.value = membership._id;
      
      // 根据卡类型显示不同信息
      let balanceInfo = '';
      if (membership.cardType === 'value' || membership.cardType === 'mixed') {
        balanceInfo = ` (余额: ¥${membership.balance})`;
      } else if (membership.cardType === 'count') {
        balanceInfo = ` (剩余次数: ${membership.count}次)`;
      } else if (membership.cardType === 'period') {
        const remainingDays = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
        balanceInfo = ` (剩余天数: ${remainingDays}天)`;
      }
      
      option.textContent = `${membership.cardNumber}${balanceInfo}`;
      
      // 保存余额信息到属性
      option.setAttribute('data-balance', membership.balance || 0);
      option.setAttribute('data-card-type', membership.cardType || '');
      option.setAttribute('data-count', membership.count || 0);
      
      membershipSelect.appendChild(option);
    });
    
    // 初始化Tom Select
    this.membershipSelect = new TomSelect(membershipSelect, {
      create: false,
      placeholder: '请选择会员卡...'
    });
    
    // 添加选择事件，更新余额显示
    this.membershipSelect.on('change', (membershipId) => {
      if (!membershipId) return;
      
      // 查找选中的选项
      const option = membershipSelect.querySelector(`option[value="${membershipId}"]`);
      if (!option) return;
      
      const balance = parseFloat(option.getAttribute('data-balance') || 0);
      const cardType = option.getAttribute('data-card-type');
      const count = parseInt(option.getAttribute('data-count') || 0);
      
      // 检查服务费用与会员卡余额
      this.validateMembershipBalance();
    });
  }
  
  /**
   * 验证会员卡余额是否足够支付服务费用
   */
  validateMembershipBalance() {
    const paymentMethod = document.getElementById('paymentMethod').value;
    if (paymentMethod !== 'membership') return true;
    
    const membershipSelect = document.getElementById('membership');
    if (!membershipSelect || !membershipSelect.value) {
      showToast('请选择会员卡', 'warning');
      return false;
    }
    
    const option = membershipSelect.querySelector(`option[value="${membershipSelect.value}"]`);
    if (!option) return false;
    
    const balance = parseFloat(option.getAttribute('data-balance') || 0);
    const cardType = option.getAttribute('data-card-type');
    const serviceFeeInput = document.getElementById('serviceFee');
    const serviceFee = parseFloat(serviceFeeInput?.value || 0);
    
    // 如果是储值卡或混合卡，检查余额是否足够
    if ((cardType === 'value' || cardType === 'mixed') && balance < serviceFee) {
      showToast(`会员卡余额不足，当前余额 ¥${balance}，需要 ¥${serviceFee}`, 'warning');
      return false;
    }
    
    return true;
  }
  
  /**
   * 设置表单事件
   */
  setupForm() {
    // 获取表单元素
    const form = document.getElementById('addServiceForm');
    if (!form) return;
    
    // 添加表单提交事件
    form.addEventListener('submit', this.handleSubmit);
    
    // 添加支付方式变化事件
    const paymentMethodSelect = document.getElementById('paymentMethod');
    if (paymentMethodSelect) {
      paymentMethodSelect.addEventListener('change', this.handlePaymentMethodChange);
    }
    
    // 添加服务费用变化事件
    const serviceFeeInput = document.getElementById('serviceFee');
    if (serviceFeeInput) {
      serviceFeeInput.addEventListener('input', this.validateMembershipBalance);
      // 设置服务费用默认值
      serviceFeeInput.value = '120';
    }
    
    // 设置服务类型默认值
    const serviceTypeSelect = document.getElementById('serviceType');
    if (serviceTypeSelect && serviceTypeSelect.options.length > 1) {
      serviceTypeSelect.value = '小儿推拿';
    }
  }
  
  /**
   * 设置默认日期时间
   */
  setDefaultDateTime() {
    const serviceDateInput = document.getElementById('serviceDate');
    if (!serviceDateInput) return;
    
    // 获取当前日期时间
    const now = new Date();
    
    // 格式化为datetime-local输入框所需的格式 (YYYY-MM-DDTHH:MM)
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    const formattedDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
    serviceDateInput.value = formattedDateTime;
  }
  
  /**
   * 处理支付方式变化
   * @param {Event} event 事件对象
   */
  handlePaymentMethodChange(event) {
    const paymentMethod = event.target.value;
    const membershipSelect = document.getElementById('membership');
    
    if (paymentMethod === 'membership') {
      // 如果选择会员卡支付，会员卡选择变为必填
      membershipSelect.required = true;
      membershipSelect.parentElement.classList.add('required-field');
      
      // 如果没有选择客户，提示先选择客户
      if (!this.selectedCustomerId) {
        showToast('请先选择客户，再选择会员卡支付', 'warning');
        event.target.value = '';
      } else {
        // 立即验证会员卡余额
        this.validateMembershipBalance();
      }
    } else {
      // 其他支付方式，会员卡选择不是必填
      membershipSelect.required = false;
      membershipSelect.parentElement.classList.remove('required-field');
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
    
    // 检查客户是否已选择
    if (!this.selectedCustomerId) {
      showToast('请选择客户', 'warning');
      return;
    }
    
    // 检查支付方式是否为会员卡，但未选择会员卡
    const paymentMethod = document.getElementById('paymentMethod').value;
    const membershipId = document.getElementById('membership').value;
    
    if (paymentMethod === 'membership') {
      if (!membershipId) {
        showToast('请选择会员卡', 'warning');
        return;
      }
      
      // 验证会员卡余额
      if (!this.validateMembershipBalance()) {
        return;
      }
    }
    
    try {
      this.showLoading('正在保存服务记录...');
      
      // 获取选择的服务类型ID和对应的服务项目
      const serviceTypeId = document.getElementById('serviceType').value;
      
      // 根据选择的服务类型ID查找对应的服务项目
      let serviceTypeName = serviceTypeId; // 默认使用ID作为名称
      
      // 查找选择的服务项目对象
      const selectedServiceItem = this.serviceItems.find(item => item._id === serviceTypeId);
      if (selectedServiceItem && selectedServiceItem.name) {
        // 如果找到服务项目，使用其名称
        serviceTypeName = selectedServiceItem.name;
        console.log(`使用服务项目名称 "${serviceTypeName}" 代替ID "${serviceTypeId}"`);
      } else {
        console.log(`未找到服务项目对象，直接使用值: ${serviceTypeId}`);
      }
      
      // 收集表单数据
      const serviceData = {
        customer: this.selectedCustomerId,
        serviceType: serviceTypeName, // 使用服务项目名称
        serviceFee: parseFloat(document.getElementById('serviceFee').value),
        paymentMethod: paymentMethod
      };
      
      // 处理医师选择
      const therapistSelect = document.getElementById('therapist');
      if (therapistSelect && therapistSelect.value) {
        serviceData.therapist = therapistSelect.value;
        console.log(`选择的医师ID: ${serviceData.therapist}`);
      } else {
        console.log('未选择医师');
      }
      
      // 处理服务日期
      const serviceDateInput = document.getElementById('serviceDate');
      if (serviceDateInput && serviceDateInput.value) {
        try {
          // 将本地日期时间字符串转换为 ISO 字符串格式
          const dateObj = new Date(serviceDateInput.value);
          if (!isNaN(dateObj.getTime())) {
            serviceData.serviceDate = dateObj.toISOString();
          } else {
            console.warn('无效的日期格式:', serviceDateInput.value);
          }
        } catch (err) {
          console.error('日期转换错误:', err);
        }
      }
      
      // 添加可选字段，如果有值的话
      const getOptionalFieldValue = (id) => {
        const el = document.getElementById(id);
        return el && el.value ? el.value.trim() : undefined;
      };
      
      // 添加症状、诊断、治疗等信息
      serviceData.symptoms = getOptionalFieldValue('symptoms');
      serviceData.diagnosis = getOptionalFieldValue('diagnosis');
      serviceData.treatment = getOptionalFieldValue('treatment');
      serviceData.notes = getOptionalFieldValue('notes');
      
      // 如果选择了会员卡，添加会员卡ID
      if (paymentMethod === 'membership' && membershipId) {
        serviceData.membership = membershipId;
      } else {
        // 确保不发送会员卡ID，避免出现空字符串的问题
        delete serviceData.membership;
      }
      
      console.log('准备提交服务记录数据:', serviceData);
      
      // 调用API创建服务记录
      const createdService = await dataService.createService(serviceData);
      
      this.hideLoading();
      
      // 显示成功消息
      showToast('服务记录创建成功！', 'success');
      
      // 延迟跳转到服务记录列表页
      setTimeout(() => {
        window.location.href = 'service.html';
      }, 1500);
      
    } catch (error) {
      console.error('创建服务记录出错:', error);
      this.hideLoading();
      
      // 显示错误消息
      if (error.message) {
        showToast(`创建服务记录失败: ${error.message}`, 'danger');
      } else {
        showToast('创建服务记录失败，请重试', 'danger');
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
      const loadingText = loadingElement.querySelector('div:not(.spinner-border)');
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
      console.log('正在加载医师数据...');
      const response = await dataService.getAllTherapists();
      
      if (response.success) {
        this.therapists = response.data || [];
        console.log(`成功加载 ${this.therapists.length} 名医师:`, this.therapists);
        
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
            console.log(`添加医师选项: ${therapist.name}, ID: ${therapist._id}`);
            therapistSelect.appendChild(option);
          }
        });
      } else {
        console.error('获取医师列表失败:', response.message);
      }
    } catch (error) {
      console.error('加载医师数据失败:', error);
    }
  }
  
  /**
   * 加载服务项目数据
   */
  async loadServiceItems() {
    try {
      console.log('正在加载服务项目数据...');
      
      // 从API获取服务项目
      const result = await dataService.getAllServiceItems();
      
      if (result.success) {
        this.serviceItems = result.data || [];
        console.log(`成功加载 ${this.serviceItems.length} 个服务项目:`, this.serviceItems);
        
        // 获取服务类型选择框
        const serviceTypeSelect = document.getElementById('serviceType');
        if (!serviceTypeSelect) return;
        
        // 清空现有选项，只保留默认选项
        serviceTypeSelect.innerHTML = '<option value="">请选择服务类型...</option>';
        
        // 如果没有自定义服务项目，添加默认选项
        if (this.serviceItems.length === 0) {
          // 不再添加预设项目，而是显示提示信息
          const emptyOption = document.createElement('option');
          emptyOption.value = "";
          emptyOption.textContent = "-- 暂无服务项目，请在系统设置中添加 --";
          emptyOption.disabled = true;
          serviceTypeSelect.appendChild(emptyOption);
          
          console.log('未找到自定义服务项目，显示提示信息');
        } else {
          // 添加自定义服务项目选项
          this.serviceItems.forEach(item => {
            const option = document.createElement('option');
            option.value = item._id;
            option.textContent = item.name;
            
            // 如果有价格信息，添加到选项文本中
            if (item.price) {
              option.textContent += ` (￥${item.price.toFixed(2)})`;
            }
            
            serviceTypeSelect.appendChild(option);
          });
        }
        
        // 添加服务类型变更事件，自动设置价格
        serviceTypeSelect.addEventListener('change', (e) => {
          const selectedId = e.target.value;
          const selectedItem = this.serviceItems.find(item => item._id === selectedId);
          
          // 如果选择了有价格的项目，自动填充价格字段
          if (selectedItem && selectedItem.price) {
            document.getElementById('serviceFee').value = selectedItem.price.toFixed(2);
          }
        });
      } else {
        console.error('获取服务项目列表失败:', result.message);
        
        // 加载失败时使用默认选项
        this.addDefaultServiceTypeOptions();
      }
    } catch (error) {
      console.error('加载服务项目数据失败:', error);
      
      // 加载失败时使用默认选项
      this.addDefaultServiceTypeOptions();
    }
  }
  
  /**
   * 添加默认服务类型选项
   */
  addDefaultServiceTypeOptions() {
    const serviceTypeSelect = document.getElementById('serviceType');
    if (!serviceTypeSelect) return;
    
    // 不再添加预设选项，只添加提示信息
    serviceTypeSelect.innerHTML = `
      <option value="">请选择服务类型...</option>
      <option value="" disabled>-- 无法获取服务项目，请刷新重试 --</option>
    `;
    
    // 显示错误提示
    showToast('获取服务项目失败，请刷新页面或检查网络连接', 'warning');
  }
}

// 初始化模块
document.addEventListener('DOMContentLoaded', () => {
  const serviceAdd = new ServiceAdd();
  serviceAdd.init();
});

export default ServiceAdd; 