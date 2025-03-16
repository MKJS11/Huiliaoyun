/**
 * 服务记录详情模块
 */
import dataService from '../../services/data-service.js';
import { formatDate, showToast, formatCurrency } from '../../utils/ui-utils.js';

class ServiceDetail {
  constructor() {
    // 初始化属性
    this.serviceId = this.getServiceIdFromUrl();
    this.serviceData = null;
    
    // 绑定方法
    this.init = this.init.bind(this);
    this.loadService = this.loadService.bind(this);
    this.renderServiceDetails = this.renderServiceDetails.bind(this);
    this.setupEventListeners = this.setupEventListeners.bind(this);
    this.formatPaymentMethod = this.formatPaymentMethod.bind(this);
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
        sessionStorage.setItem('serviceDetailError', '无效的操作：缺少服务记录ID');
        
        // 重定向到服务列表页面
        window.location.href = 'service.html';
        return;
      }
      
      this.showLoading('正在加载服务记录详情...');
      
      // 设置事件监听器
      this.setupEventListeners();
      
      // 加载服务记录数据
      await this.loadService();
      
      // 渲染服务记录详情
      this.renderServiceDetails();
      
      this.hideLoading();
    } catch (error) {
      console.error('初始化服务记录详情页面失败:', error);
      this.hideLoading();
      showToast('加载服务记录详情失败', 'danger');
    }
  }
  
  /**
   * 设置事件监听器
   */
  setupEventListeners() {
    // 编辑按钮点击事件
    const editBtn = document.getElementById('editServiceBtn');
    if (editBtn) {
      editBtn.href = `service-edit.html?id=${this.serviceId}`;
    }
  }
  
  /**
   * 加载服务记录数据
   */
  async loadService() {
    try {
      console.log(`正在加载服务记录详情，ID: ${this.serviceId}`);
      
      // 调用API获取服务记录详情
      const response = await dataService.getServiceById(this.serviceId);
      
      // 检查响应
      if (!response || !response.success) {
        throw new Error('获取服务记录详情失败');
      }
      
      this.serviceData = response.data;
      console.log('服务记录详情数据:', this.serviceData);
      
      return this.serviceData;
    } catch (error) {
      console.error('加载服务记录详情出错:', error);
      showToast('加载服务记录详情失败', 'danger');
      throw error;
    }
  }
  
  /**
   * 渲染服务记录详情
   */
  renderServiceDetails() {
    if (!this.serviceData) {
      console.error('没有服务记录数据可供渲染');
      return;
    }
    
    // 客户信息
    if (this.serviceData.customer) {
      document.getElementById('childNameDisplay').textContent = this.serviceData.customer.childName || '--';
      document.getElementById('childAgeDisplay').textContent = this.serviceData.customer.childAge ? `${this.serviceData.customer.childAge}岁` : '--';
      document.getElementById('childGenderDisplay').textContent = this.serviceData.customer.childGender === 'male' ? '男' : 
                                                                  this.serviceData.customer.childGender === 'female' ? '女' : '--';
      document.getElementById('parentNameDisplay').textContent = this.serviceData.customer.parentName || '--';
      document.getElementById('phoneDisplay').textContent = this.serviceData.customer.phone || '--';
    } else {
      // 如果没有客户信息，显示默认值
      const customerFields = ['childNameDisplay', 'childAgeDisplay', 'childGenderDisplay', 'parentNameDisplay', 'phoneDisplay'];
      customerFields.forEach(field => {
        const element = document.getElementById(field);
        if (element) element.textContent = '无客户信息';
      });
    }
    
    // 服务信息
    document.getElementById('serviceTypeDisplay').textContent = this.serviceData.serviceType || '--';
    document.getElementById('serviceDateDisplay').textContent = this.serviceData.serviceDate ? formatDate(new Date(this.serviceData.serviceDate), 'yyyy-MM-dd HH:mm') : '--';
    document.getElementById('therapistDisplay').textContent = this.serviceData.therapist || '--';
    document.getElementById('serviceFeeDisplay').textContent = this.serviceData.serviceFee !== undefined ? formatCurrency(this.serviceData.serviceFee) : '--';
    document.getElementById('paymentMethodDisplay').textContent = this.formatPaymentMethod(this.serviceData.paymentMethod);
    
    // 会员卡信息（如果是会员卡支付）
    if (this.serviceData.paymentMethod === 'membership' && this.serviceData.membership) {
      document.getElementById('membershipInfoGroup').style.display = 'block';
      document.getElementById('membershipDisplay').textContent = this.serviceData.membership.cardNumber || '--';
    } else {
      document.getElementById('membershipInfoGroup').style.display = 'none';
    }
    
    // 诊疗信息
    document.getElementById('symptomsDisplay').textContent = this.serviceData.symptoms || '--';
    document.getElementById('diagnosisDisplay').textContent = this.serviceData.diagnosis || '--';
    document.getElementById('treatmentDisplay').textContent = this.serviceData.treatment || '--';
    document.getElementById('notesDisplay').textContent = this.serviceData.notes || '--';
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
    
    return methodMap[method] || method || '--';
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
}

// 初始化模块
document.addEventListener('DOMContentLoaded', () => {
  const serviceDetail = new ServiceDetail();
  serviceDetail.init();
});

export default ServiceDetail; 