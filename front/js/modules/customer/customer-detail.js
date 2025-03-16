/**
 * 客户详情页功能
 */
import dataService from '../../services/data-service.js';

class CustomerDetail {
  constructor() {
    this.customerId = this.getCustomerIdFromUrl();
    this.customerData = null;
    this.customerInfoContainer = document.getElementById('customerInfo');
    this.serviceList = document.getElementById('serviceHistory');
    this.membershipList = document.getElementById('membershipHistory');
    this.deleteModal = document.getElementById('deleteCustomerModal');
    this.deleteBtn = document.getElementById('confirmDeleteBtn');
    
    this.init();
  }
  
  /**
   * 初始化页面
   */
  async init() {
    try {
      console.log('客户详情页初始化中...');
      
      // 确保页面元素存在
      if (!this.customerInfoContainer) {
        console.error('找不到customerInfo容器，尝试重新获取');
        this.customerInfoContainer = document.getElementById('customerInfo');
      }
      
      // 确保容器可见
      if (this.customerInfoContainer) {
        this.customerInfoContainer.style.display = 'block';
        this.customerInfoContainer.style.visibility = 'visible';
      }
      
      // 初始化模态框事件监听
      this.setupModalListeners();
      
      // 显示加载中状态
      this.showLoading('正在准备加载客户数据...');
      
      if (!this.customerId) {
        console.error('未找到客户ID，URL参数id为空');
        this.showError('无效的客户ID，请返回列表页重新选择客户。');
        return;
      }
      
      console.log(`获取到客户ID: ${this.customerId}`);
      
      // 初始化事件监听器
      this.initEventListeners();
      
      // 加载客户数据
      await this.loadCustomerData();
      
      console.log('客户详情页初始化完成');
    } catch (error) {
      console.error('客户详情页初始化失败:', error);
      this.hideLoading();
      this.showError(`页面初始化失败: ${error.message || '未知错误'}`);
    }
  }
  
  /**
   * 设置模态框事件监听器
   */
  setupModalListeners() {
    try {
      const editModal = document.getElementById('editCustomerModal');
      if (!editModal) return;
      
      console.log('设置模态框事件监听');
      
      // 使用jQuery监听Bootstrap模态框事件
      if (typeof $ !== 'undefined') {
        // 当模态框完全隐藏后，确保页面可以滚动
        $(editModal).on('hidden.bs.modal', () => {
          console.log('模态框已关闭（jQuery事件）');
          // 延迟一点点确保模态框真的关闭了
          setTimeout(() => this.forcePageScroll(), 50);
        });
        
        $(editModal).on('shown.bs.modal', () => {
          console.log('模态框已显示（jQuery事件）');
        });
      }
      
      // 添加原生事件监听 
      editModal.addEventListener('hidden.bs.modal', () => {
        console.log('模态框已关闭（原生事件）');
        
        // 移除模态框可能留下的遮罩层
      });
      
      // 监听点击事件，可能在模态框外区域点击关闭
      document.addEventListener('click', (event) => {
        // 如果点击了模态框背景，且模态框处于打开状态
        if (
          event.target.classList.contains('modal-backdrop') &&
          editModal.classList.contains('show')
        ) {
          console.log('检测到点击背景关闭模态框');
          this.closeEditModal();
        }
      });
      
    } catch (error) {
      console.error('设置模态框事件监听器失败:', error);
    }
  }
  
  /**
   * 初始化事件监听器
   */
  initEventListeners() {
    // 删除确认按钮事件
    if (this.deleteBtn) {
      this.deleteBtn.addEventListener('click', this.handleDelete.bind(this));
    }
    
    // 删除模态框打开事件，用于设置删除ID
    const deleteModal = document.getElementById('deleteCustomerModal');
    if (deleteModal) {
      deleteModal.addEventListener('show.bs.modal', () => {
        const nameSpan = deleteModal.querySelector('.customer-name');
        if (nameSpan && this.customerData) {
          nameSpan.textContent = this.customerData.childName || '未命名客户';
        }
      });
    }
    
    // 添加服务按钮点击事件
    const addServiceBtn = document.getElementById('addServiceBtn');
    if (addServiceBtn) {
      addServiceBtn.addEventListener('click', (event) => {
        event.preventDefault();
        
        if (this.customerId) {
          window.location.href = `service-add.html?customer_id=${this.customerId}`;
        } else {
          this.showToast('无法获取客户ID，请刷新页面重试', 'danger');
        }
      });
    }
    
    // 编辑客户信息按钮点击事件
    document.addEventListener('click', (event) => {
      if (event.target.id === 'editCustomerBtn' || event.target.closest('#editCustomerBtn')) {
        this.fillEditForm();
        const editModal = new bootstrap.Modal(document.getElementById('editCustomerModal'));
        editModal.show();
      }
    });
    
    // 保存客户信息按钮点击事件
    const saveCustomerBtn = document.getElementById('saveCustomerBtn');
    if (saveCustomerBtn) {
      saveCustomerBtn.addEventListener('click', this.updateCustomer.bind(this));
    }
    
    // 防止表单默认提交
    const editForm = document.getElementById('editCustomerForm');
    if (editForm) {
      editForm.addEventListener('submit', (event) => {
        event.preventDefault();
        this.updateCustomer();
      });
    }
    
    // 添加取消按钮事件处理
    const cancelEditBtn = document.querySelector('#editCustomerModal .btn-secondary');
    if (cancelEditBtn) {
      cancelEditBtn.addEventListener('click', () => {
        this.closeEditModal();
      });
    }
    
    // 监听模态框关闭按钮
    const closeModalBtn = document.querySelector('#editCustomerModal .btn-close');
    if (closeModalBtn) {
      closeModalBtn.addEventListener('click', () => {
        this.closeEditModal();
      });
    }
    
    // 年龄和出生日期字段联动
    const ageField = document.getElementById('editChildAge');
    const birthDateField = document.getElementById('editChildBirthdate');
    
    if (ageField && birthDateField) {
      // 年龄变化时更新出生日期
      ageField.addEventListener('input', () => {
        if (ageField.value && ageField.value >= 0 && ageField.value <= 50) {
          const age = parseInt(ageField.value);
          const today = new Date();
          const birthYear = today.getFullYear() - age;
          const birthDate = new Date(birthYear, today.getMonth(), today.getDate());
          birthDateField.valueAsDate = birthDate;
        }
      });
      
      // 出生日期变化时更新年龄
      birthDateField.addEventListener('change', () => {
        if (birthDateField.value) {
          const birthDate = new Date(birthDateField.value);
          const today = new Date();
          let age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
          
          ageField.value = age;
        }
      });
    }
    
    // 初始化标签页切换事件
    const tabElements = document.querySelectorAll('button[data-bs-toggle="tab"]');
    tabElements.forEach(tab => {
      tab.addEventListener('shown.bs.tab', (event) => {
        const targetId = event.target.getAttribute('data-bs-target');
        
        // 根据标签页加载对应内容
        if (targetId === '#service') {
          this.loadServiceHistory();
        } else if (targetId === '#consumption') {
          this.loadConsumptionHistory();
        } else if (targetId === '#tongue') {
          this.loadTongueImages();
        }
      });
    });
  }
  
  /**
   * 从URL获取客户ID
   * @returns {string|null} 客户ID或null
   */
  getCustomerIdFromUrl() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const id = urlParams.get('id');
      
      console.log('从URL获取的客户ID:', id);
      
      // 去除可能存在的破折号或其他非法字符
      const cleanId = id ? id.replace(/[^a-zA-Z0-9]/g, '') : null;
      
      if (cleanId !== id) {
        console.warn('客户ID可能包含非法字符，已清理:', id, '->', cleanId);
      }
      
      if (!cleanId) {
        console.error('URL中未找到有效的客户ID参数');
        return null;
      }
      
      return cleanId;
    } catch (error) {
      console.error('获取URL参数出错:', error);
      return null;
    }
  }
  
  /**
   * 加载客户数据
   */
  async loadCustomerData() {
    try {
      this.showLoading('正在加载客户信息...');
      
      console.log('开始加载客户数据，ID:', this.customerId);
      
      if (!this.customerId) {
        throw new Error('客户ID无效，无法加载数据');
      }
      
      // 获取客户数据
      this.customerData = await dataService.getCustomerById(this.customerId);
      
      console.log('获取到的客户数据:', this.customerData);
      
      if (!this.customerData) {
        throw new Error('未找到该客户信息，可能已被删除或ID无效');
      }
      
      // 更新页面标题
      document.title = `${this.customerData.childName || '未命名客户'} - 客户详情`;
      
      // 渲染客户信息
      this.renderCustomerInfo();
      
      // 加载服务记录
      this.loadServiceHistory();
      
      // 加载会员卡和消费记录
      await this.loadConsumptionHistory();
      
      // 隐藏加载提示
      this.hideLoading();
      
    } catch (error) {
      console.error('加载客户数据出错:', error);
      
      // 显示更详细的错误信息
      if (error.message) {
        this.showError(`加载客户数据失败: ${error.message}`);
      } else {
        this.showError('加载客户数据时发生错误，请检查网络连接或刷新页面重试。');
      }
      
      // 打印更详细的调试信息
      console.error('客户ID:', this.customerId);
      console.error('API URL:', dataService.apiUrl);
      console.error('错误详情:', error.stack || error);
      
      this.hideLoading();
    }
  }
  
  /**
   * 渲染客户基本信息
   */
  renderCustomerInfo() {
    try {
      console.log('开始渲染客户信息:', this.customerData);
      
      // 确保数据和容器都存在
      if (!this.customerData) {
        throw new Error('客户数据不存在，无法渲染');
      }
      
      if (!this.customerInfoContainer) {
        console.error('客户信息容器元素不存在');
        this.customerInfoContainer = document.getElementById('customerInfo');
        
        if (!this.customerInfoContainer) {
          throw new Error('无法找到customerInfo元素');
        }
      }
      
      // 强制确保容器可见
      this.customerInfoContainer.style.display = 'block';
      this.customerInfoContainer.style.visibility = 'visible';
      this.customerInfoContainer.style.opacity = '1';
      
      // 清空容器内容再重新添加
      this.customerInfoContainer.innerHTML = '';
      
      // 构建客户信息HTML
      console.log('正在构建客户信息HTML');
      const customer = this.customerData;
      
      // 创建一个新的div来存放内容
      const container = document.createElement('div');
      container.className = 'card mb-4';
      
      // 设置HTML内容
      container.innerHTML = `
        <div class="card-header d-flex justify-content-between align-items-center">
          <h5 class="mb-0">基本信息</h5>
          <button class="btn btn-sm btn-primary" id="editCustomerBtn">
            <i class="bi bi-pencil-square me-1"></i> 编辑信息
          </button>
        </div>
        <div class="card-body">
          <div class="row">
            <div class="col-md-6">
              <h6 class="border-bottom pb-2 mb-3">孩子信息</h6>
              <dl class="row">
                <dt class="col-sm-4">姓名</dt>
                <dd class="col-sm-8">${customer.childName || '未填写'}</dd>
                
                <dt class="col-sm-4">性别</dt>
                <dd class="col-sm-8">${customer.childGender === 'male' ? '男' : customer.childGender === 'female' ? '女' : '未知'}</dd>
                
                <dt class="col-sm-4">出生日期</dt>
                <dd class="col-sm-8">${customer.childBirthdate ? new Date(customer.childBirthdate).toLocaleDateString('zh-CN') : '未填写'}</dd>
                
                <dt class="col-sm-4">年龄</dt>
                <dd class="col-sm-8">${customer.childBirthdate ? this.calculateAgeDetailed(customer.childBirthdate) : (customer.childAge ? customer.childAge + '岁' : '未知')}</dd>
              </dl>
            </div>
            
            <div class="col-md-6">
              <h6 class="border-bottom pb-2 mb-3">家长信息</h6>
              <dl class="row">
                <dt class="col-sm-4">姓名</dt>
                <dd class="col-sm-8">${customer.parentName || '未填写'}</dd>
                
                <dt class="col-sm-4">与孩子关系</dt>
                <dd class="col-sm-8">${this.getRelationshipText(customer.relationship)}</dd>
                
                <dt class="col-sm-4">联系电话</dt>
                <dd class="col-sm-8">${customer.phone || '未填写'}</dd>
                
                <dt class="col-sm-4">电子邮箱</dt>
                <dd class="col-sm-8">${customer.email || '未填写'}</dd>
                
                <dt class="col-sm-4">家庭住址</dt>
                <dd class="col-sm-8">${customer.address || '未填写'}</dd>
              </dl>
            </div>
          </div>
          
          <div class="row mt-4">
            <div class="col-md-12">
              <h6 class="border-bottom pb-2 mb-3">健康信息</h6>
              <div class="row">
                <div class="col-md-6">
                  <dl class="row">
                    <dt class="col-sm-4">体质类型</dt>
                    <dd class="col-sm-8">${customer.constitution || '未填写'}</dd>
                    
                    <dt class="col-sm-4">主要症状</dt>
                    <dd class="col-sm-8">${customer.mainSymptoms || '未填写'}</dd>
                  </dl>
                </div>
                <div class="col-md-6">
                  <dl class="row">
                    <dt class="col-sm-4">过敏史</dt>
                    <dd class="col-sm-8">${customer.allergyHistory || '无'}</dd>
                    
                    <dt class="col-sm-4">家族病史</dt>
                    <dd class="col-sm-8">${customer.familyHistory || '无'}</dd>
                    
                    <dt class="col-sm-4">既往病史</dt>
                    <dd class="col-sm-8">${customer.medicalHistory || '无'}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          <div class="row mt-4">
            <div class="col-md-12">
              <h6 class="border-bottom pb-2 mb-3">其他信息</h6>
              <dl class="row">
                <dt class="col-sm-2">会员状态</dt>
                <dd class="col-sm-4">${this.getMembershipStatusBadge(customer.membershipStatus)}</dd>
                
                <dt class="col-sm-2">获客来源</dt>
                <dd class="col-sm-4">${this.getSourceText(customer.source)}</dd>
                
                <dt class="col-sm-2">创建时间</dt>
                <dd class="col-sm-4">${new Date(customer.createdAt).toLocaleString('zh-CN')}</dd>
                
                <dt class="col-sm-2">备注信息</dt>
                <dd class="col-sm-10">${customer.notes || '无'}</dd>
              </dl>
            </div>
          </div>
        </div>
      `;
      
      // 将内容添加到页面中
      this.customerInfoContainer.appendChild(container);
      console.log('正在更新DOM');
      
      // 添加编辑按钮事件监听
      const editBtn = document.getElementById('editCustomerBtn');
      if (editBtn) {
        editBtn.addEventListener('click', () => {
          this.fillEditForm();
          new bootstrap.Modal(document.getElementById('editCustomerModal')).show();
        });
      }
      
      console.log('客户信息渲染完成');
    } catch (error) {
      console.error('渲染客户信息出错:', error);
      this.showError(`无法显示客户信息: ${error.message}`);
    }
  }
  
  /**
   * 获取关系文本描述
   */
  getRelationshipText(relationship) {
    const relationMap = {
      'mother': '母亲',
      'father': '父亲',
      'grandparent': '祖父母',
      'other': '其他'
    };
    return relationMap[relationship] || '未填写';
  }
  
  /**
   * 获取来源文本描述
   */
  getSourceText(source) {
    const sourceMap = {
      'referral': '转介绍',
      'advertisement': '广告',
      'social': '社交媒体',
      'walk_in': '自然进店',
      'event': '活动获客',
      'other': '其他'
    };
    return sourceMap[source] || '未填写';
  }
  
  /**
   * 加载服务记录
   */
  async loadServiceHistory() {
    const serviceTab = document.getElementById('service');
    if (!serviceTab) return;
    
    try {
      // 显示加载中状态
      serviceTab.innerHTML = `
        <div class="text-center py-4" id="serviceLoading">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">加载中...</span>
          </div>
          <p class="mt-2">正在加载服务记录...</p>
        </div>
      `;
      
      // 获取该客户的所有服务记录
      const services = await this.getCustomerServices();
      console.log('获取到的服务记录:', services);
      
      // 移除加载中状态
      const loadingElem = document.getElementById('serviceLoading');
      if (loadingElem) loadingElem.remove();
      
      if (!services || services.length === 0) {
        serviceTab.innerHTML = `
          <div class="alert alert-info">
            <i class="bi bi-info-circle me-2"></i> 该客户暂无服务记录
          </div>
          <a href="service-add.html?customer_id=${this.customerId}" class="btn btn-primary">
            <i class="bi bi-plus-circle me-2"></i> 添加服务记录
          </a>
        `;
        return;
      }
      
      // 按日期倒序排列
      services.sort((a, b) => {
        // 尝试获取serviceDate，如果不存在则尝试date或createdAt
        const dateA = a.serviceDate || a.date || a.createdAt || '';
        const dateB = b.serviceDate || b.date || b.createdAt || '';
        return new Date(dateB) - new Date(dateA);
      });
      
      // 渲染服务记录时间轴
      let timelineHtml = `
        <div class="timeline">
          <h5 class="mb-3">服务记录历史</h5>
      `;
      
      services.forEach(service => {
        // 确保有服务日期，否则使用备用字段
        const serviceDate = service.serviceDate || service.date || service.createdAt || new Date().toISOString();
        // 提取医师名称（可能是字符串或对象）
        const therapist = typeof service.therapist === 'object' ? 
          (service.therapist.name || service.therapist.fullName || '未记录') : 
          (service.therapistName || service.therapist || '未记录');
        // 确保有服务ID（可能是id或_id）
        const serviceId = service.id || service._id || '';
        
        timelineHtml += `
          <div class="timeline-item">
            <div class="timeline-date">
              <span>${new Date(serviceDate).toLocaleDateString()}</span>
            </div>
            <div class="timeline-content">
              <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                  <h6 class="mb-0">${this.getFormattedServiceName(service) || '推拿服务'}</h6>
                  <small>${service.duration || '45'} 分钟</small>
                </div>
                <div class="card-body">
                  <p><strong>主要症状：</strong>${service.symptoms || '未记录'}</p>
                  <p><strong>推拿手法：</strong>${service.techniques || '未记录'}</p>
                  <p><strong>服务评价：</strong>
                    <span class="text-${this.getEvaluationColor(service.evaluation)}">
                      ${service.evaluation || '未评价'}
                    </span>
                  </p>
                  <p><strong>备注：</strong>${service.notes || '无'}</p>
                </div>
                <div class="card-footer text-muted">
                  <small>服务人员：${therapist}</small>
                  <div class="mt-2">
                    <a href="service-detail.html?id=${serviceId}" class="btn btn-sm btn-outline-primary">查看详情</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;
      });
      
      timelineHtml += `
        </div>
        <div class="mt-4">
          <a href="service-add.html?customer_id=${this.customerId}" class="btn btn-primary">
            <i class="bi bi-plus-circle me-2"></i> 添加服务记录
          </a>
          <button id="refreshServiceBtn" class="btn btn-outline-secondary ms-2">
            <i class="bi bi-arrow-clockwise me-1"></i> 刷新记录
          </button>
        </div>
      `;
      
      serviceTab.innerHTML = timelineHtml;
      
      // 绑定刷新按钮事件
      const refreshBtn = document.getElementById('refreshServiceBtn');
      if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
          this.loadServiceHistory();
        });
      }
      
    } catch (error) {
      console.error('加载服务记录出错:', error);
      serviceTab.innerHTML = `
        <div class="alert alert-danger">
          <i class="bi bi-exclamation-triangle me-2"></i> 加载服务记录失败，请刷新重试
        </div>
        <button id="retryLoadServiceBtn" class="btn btn-primary">
          <i class="bi bi-arrow-clockwise me-1"></i> 重试加载
        </button>
      `;
      
      // 绑定重试按钮事件
      const retryBtn = document.getElementById('retryLoadServiceBtn');
      if (retryBtn) {
        retryBtn.addEventListener('click', () => {
          this.loadServiceHistory();
        });
      }
    }
  }
  
  /**
   * 获取客户的服务记录
   * @returns {Promise<Array>} 服务记录数组
   */
  async getCustomerServices() {
    try {
      console.log(`尝试从API获取客户(ID: ${this.customerId})的服务记录`);
      const response = await dataService.getCustomerServices(this.customerId);
      console.log('API返回的服务记录原始数据:', response);
      
      // 检查API返回的数据结构
      if (!response) {
        console.error('API返回的数据为空');
        return [];
      }
      
      // 尝试从不同的位置提取数据数组
      let records = [];
      
      if (Array.isArray(response)) {
        // 直接返回了数组
        records = response;
      } else if (response.data && Array.isArray(response.data)) {
        // 标准API格式：{ data: [...] }
        records = response.data;
      } else if (response.services && Array.isArray(response.services)) {
        // 可能的替代格式：{ services: [...] }
        records = response.services;
      } else if (response.records && Array.isArray(response.records)) {
        // 可能的替代格式：{ records: [...] }
        records = response.records;
      } else {
        console.error('无法解析API返回的数据结构:', response);
        return [];
      }
      
      // 对数据进行处理，确保格式统一
      const processedRecords = records.map(record => {
        // 创建一个新对象，避免修改原始数据
        const processedRecord = { ...record };
        
        // 处理服务日期
        if (!processedRecord.serviceDate && (processedRecord.date || processedRecord.createdAt)) {
          processedRecord.serviceDate = processedRecord.date || processedRecord.createdAt;
        }
        
        // 提取嵌套对象中的属性
        if (processedRecord.therapist && typeof processedRecord.therapist === 'object') {
          processedRecord.therapistName = processedRecord.therapist.name || 
                                         processedRecord.therapist.fullName || 
                                         '未命名医师';
        }
        
        if (processedRecord.service && typeof processedRecord.service === 'object') {
          processedRecord.serviceType = processedRecord.service.name || 
                                       processedRecord.service.title || 
                                       '未命名服务';
        }
        
        return processedRecord;
      });
      
      console.log('处理后的服务记录数据:', processedRecords);
      return processedRecords;
    } catch (error) {
      console.error('从API获取服务记录失败:', error);
      // 直接返回空数组，不再从localStorage获取
      return [];
    }
  }
  
  /**
   * 获取格式化的服务项目名称
   * @param {Object} record 服务记录对象
   * @returns {string} 格式化后的服务项目名称
   */
  getFormattedServiceName(record) {
    // 常见的服务类型ID到名称的映射
    const serviceTypeMap = {
      '小儿推拿': '小儿推拿',
      '小儿推拿+艾灸': '小儿推拿+艾灸',
      '小儿推拿+刮痧': '小儿推拿+刮痧',
      '艾灸调理': '艾灸调理',
      '刮痧': '刮痧',
      '拔罐': '拔罐',
      '针灸': '针灸',
      '其他': '其他'
    };

    // 尝试从不同位置获取服务名称
    let serviceName = '';
    
    // 优先使用serviceType字段(可能直接是服务类型名称)
    if (record.serviceType && typeof record.serviceType === 'string') {
      return record.serviceType; // 直接返回，这已经是服务名称
    }
    
    // 情况1: 如果服务是一个对象，优先使用其name或title属性
    if (record.service && typeof record.service === 'object') {
      serviceName = record.service.name || record.service.title || record.service.serviceName;
    }
    
    // 情况2: 如果serviceItem是对象且有name属性（数据库中存储的服务项目对象）
    if (!serviceName && record.serviceItem && typeof record.serviceItem === 'object') {
      serviceName = record.serviceItem.name || record.serviceItem.title;
    }
    
    // 情况3: 如果有多个服务项目(serviceItems数组)
    if (!serviceName && record.serviceItems && Array.isArray(record.serviceItems)) {
      serviceName = record.serviceItems
        .map(item => {
          // 如果是对象，取其name属性；如果是字符串ID，保持原样
          if (typeof item === 'object' && item !== null) {
            return item.name || item.title || '未知项目';
          } else if (typeof item === 'string') {
            return item; // 将在后续的getFormattedServiceName中进一步处理
          }
          return '未知项目';
        })
        .join(', ');
    }
    
    // 情况4: 如果serviceType是对象且有name或title属性
    if (!serviceName && record.serviceType && typeof record.serviceType === 'object') {
      serviceName = record.serviceType.name || record.serviceType.title;
    }
    
    // 情况5: 如果有专门的serviceName字段
    if (!serviceName && record.serviceName) {
      serviceName = record.serviceName;
    }
    
    // 情况6: 如果serviceType是字符串ID但不是服务名称，尝试从映射中获取
    if (!serviceName && record.serviceType && typeof record.serviceType === 'string') {
      serviceName = serviceTypeMap[record.serviceType] || record.serviceType;
    }
    
    // 情况7: 最后的后备选项
    if (!serviceName) {
      serviceName = record.type || record.category || '未知服务';
    }
    
    return serviceName;
  }
  
  /**
   * 加载会员卡和消费记录信息
   */
  async loadConsumptionHistory() {
    try {
      console.log('开始加载会员卡和消费记录信息...');
      
      // 获取DOM元素
      const membershipTable = document.getElementById('membershipTable');
      const membershipLoading = document.getElementById('membershipLoading');
      const noMembership = document.getElementById('noMembership');
      
      const consumptionTable = document.getElementById('consumptionTable');
      const consumptionLoading = document.getElementById('consumptionLoading');
      const noConsumption = document.getElementById('noConsumption');
      
      if (!membershipTable || !consumptionTable) {
        console.error('找不到会员卡或消费记录表格元素');
        return;
      }
      
      // 显示加载状态
      if (membershipLoading) membershipLoading.classList.remove('d-none');
      if (consumptionLoading) consumptionLoading.classList.remove('d-none');
      
      // 隐藏表格和无数据提示
      membershipTable.classList.add('d-none');
      if (noMembership) noMembership.classList.add('d-none');
      
      consumptionTable.classList.add('d-none');
      if (noConsumption) noConsumption.classList.add('d-none');
      
      // 通过API获取会员卡记录
      let memberships = [];
      try {
        console.log('获取会员卡数据...');
        memberships = await this.getCustomerMemberships();
        console.log('获取到会员卡数据:', memberships);
      } catch (error) {
        console.error('获取会员卡数据失败:', error);
        this.showToast('获取会员卡数据失败', 'error');
      }
      
      // 隐藏加载状态
      if (membershipLoading) membershipLoading.classList.add('d-none');
      if (consumptionLoading) consumptionLoading.classList.add('d-none');
      
      // 处理会员卡数据
      if (memberships.length === 0) {
        // 显示无会员卡提示
        if (noMembership) noMembership.classList.remove('d-none');
        
        // 设置办理会员卡按钮链接
        const addMembershipBtn = document.getElementById('addMembershipBtn');
        if (addMembershipBtn) {
          addMembershipBtn.href = `membership-add.html?customer_id=${this.customerId}`;
        }
        
        // 更新客户会员状态为'none'
        if (this.customerData) {
          this.customerData.membershipStatus = 'none';
          // 重新渲染客户信息，以更新会员状态显示
          this.renderCustomerInfo();
        }
      } else {
        // 显示会员卡表格
        membershipTable.classList.remove('d-none');
        
        // 清空表格内容
        const tbody = membershipTable.querySelector('tbody');
        if (tbody) {
          tbody.innerHTML = '';
          
          // 按日期倒序排列
          memberships.sort((a, b) => new Date(b.purchaseDate || b.issueDate || b.createdAt) - new Date(a.purchaseDate || a.issueDate || a.createdAt));
          
          // 检查会员卡状态，并更新客户会员状态
          let activeFound = false;
          let expiringFound = false;
          let expiredFound = false;
          
          const now = new Date();
          const expiringThreshold = new Date();
          expiringThreshold.setDate(now.getDate() + 15); // 15天内过期视为即将过期
          
          memberships.forEach(membership => {
            if (membership.status === 'active') {
              // 检查是否即将过期
              if (membership.expiryDate) {
                const expiryDate = new Date(membership.expiryDate);
                if (expiryDate < now) {
                  // 已经过期
                  membership.status = 'expired';
                  expiredFound = true;
                } else if (expiryDate < expiringThreshold) {
                  // 即将过期
                  membership.status = 'expiring';
                  expiringFound = true;
                } else {
                  activeFound = true;
                }
              } else {
                activeFound = true;
              }
            } else if (membership.status === 'expired') {
              expiredFound = true;
            }
          });
          
          // 更新客户会员状态
          if (this.customerData) {
            if (activeFound) {
              this.customerData.membershipStatus = 'active';
            } else if (expiringFound) {
              this.customerData.membershipStatus = 'expiring';
            } else if (expiredFound) {
              this.customerData.membershipStatus = 'expired';
            } else {
              this.customerData.membershipStatus = 'none';
            }
            
            // 重新渲染客户信息，以更新会员状态显示
            this.renderCustomerInfo();
          }
          
          // 填充会员卡数据
          memberships.forEach(membership => {
            const row = document.createElement('tr');
            
            // 设置卡状态的样式
            const statusBadge = this.getMembershipStatusBadge(membership.status);
            
            // 格式化日期
            const purchaseDate = new Date(membership.purchaseDate || membership.issueDate || membership.createdAt).toLocaleDateString('zh-CN');
            const expiryDate = membership.expiryDate ? new Date(membership.expiryDate).toLocaleDateString('zh-CN') : '无期限';
            
            row.innerHTML = `
              <td>${membership.cardNumber || '未分配'}</td>
              <td>${this.getCardTypeText(membership.cardType)}</td>
              <td>¥${membership.balance ? parseFloat(membership.balance).toFixed(2) : '0.00'}</td>
              <td>${statusBadge}</td>
              <td>${purchaseDate}</td>
              <td>${expiryDate}</td>
              <td>
                <div class="btn-group btn-group-sm">
                  <button type="button" class="btn btn-outline-primary view-membership-btn" data-id="${membership._id}">
                    详情
                  </button>
                  <button type="button" class="btn btn-outline-success recharge-btn" data-id="${membership._id}" 
                    ${membership.status === 'expired' || membership.status === 'void' ? 'disabled' : ''}>
                    充值
                  </button>
                  <button type="button" class="btn btn-outline-danger void-btn" data-id="${membership._id}"
                    ${membership.status === 'expired' || membership.status === 'void' ? 'disabled' : ''}>
                    作废
                  </button>
                </div>
              </td>
            `;
            
            tbody.appendChild(row);
          });
        }
      }
      
      // 处理消费记录数据
      try {
        // 从API获取消费记录
        console.log('获取消费记录数据...');
        const consumptionRecords = await this.getCustomerConsumptions();
        console.log('获取到消费记录数据:', consumptionRecords);
        
        if (!consumptionRecords || consumptionRecords.length === 0) {
          console.log('没有消费记录数据');
          // 显示无消费记录提示
          if (noConsumption) noConsumption.classList.remove('d-none');
        } else {
          // 显示消费记录表格
          consumptionTable.classList.remove('d-none');
          
          // 清空表格内容
          const tbody = consumptionTable.querySelector('tbody');
          if (tbody) {
            tbody.innerHTML = '';
            
            // 按日期倒序排列 (使用serviceDate而不是date字段)
            consumptionRecords.sort((a, b) => {
              const dateA = a.serviceDate || a.date || a.createdAt || '';
              const dateB = b.serviceDate || b.date || b.createdAt || '';
              return new Date(dateB) - new Date(dateA);
            });
            
            // 填充消费记录数据
            consumptionRecords.forEach(record => {
              try {
                const row = document.createElement('tr');
                
                // 确定日期字段 (可能是serviceDate, date或createdAt)
                const dateValue = record.serviceDate || record.date || record.createdAt;
                
                // 格式化日期，提供错误处理
                let consumptionDate = '未知日期';
                try {
                  if (dateValue) {
                    consumptionDate = new Date(dateValue).toLocaleString('zh-CN');
                    // 检查日期是否有效
                    if (consumptionDate === 'Invalid Date') {
                      consumptionDate = dateValue.toString();
                    }
                  }
                } catch (dateError) {
                  console.error('日期格式化错误:', dateError, dateValue);
                  consumptionDate = dateValue ? dateValue.toString() : '未知日期';
                }
                
                // 安全地获取数字字段
                let amount = 0;
                try {
                  amount = record.serviceFee || record.amount || record.fee || 0;
                  if (typeof amount === 'string') {
                    amount = parseFloat(amount) || 0;
                  }
                } catch (numberError) {
                  console.error('金额解析错误:', numberError, record);
                }
                
                // 获取服务名称，确保显示用户设置的服务项目名称
                let serviceName = this.getFormattedServiceName(record);
                
                console.log('消费记录数据:', record, '显示的服务名称:', serviceName);
                
                // 获取支付方式并转换为中文
                let paymentMethodText = '未知';
                switch(record.paymentMethod) {
                  case 'cash':
                    paymentMethodText = '现金';
                    break;
                  case 'wechat':
                    paymentMethodText = '微信';
                    break;
                  case 'alipay':
                    paymentMethodText = '支付宝';
                    break;
                  case 'card':
                    paymentMethodText = '银行卡';
                    break;
                  case 'membership':
                    paymentMethodText = '会员卡';
                    break;
                  case 'pos':
                    paymentMethodText = 'POS机';
                    break;
                  case 'free':
                    paymentMethodText = '免费';
                    break;
                  case 'insurance':
                    paymentMethodText = '医保';
                    break;
                  case 'other':
                    paymentMethodText = '其他';
                    break;
                  default:
                    // 如果是直接中文值，则直接使用
                    if (record.paymentMethod && ['现金', '微信', '支付宝', '银行卡', '会员卡', 'POS机', '免费', '医保', '其他'].includes(record.paymentMethod)) {
                      paymentMethodText = record.paymentMethod;
                    } else {
                      paymentMethodText = record.paymentMethod || '未知';
                    }
                }
                
                // 获取医师名称
                const therapistName = record.therapistName || 
                                     (record.therapist && (record.therapist.name || record.therapist.fullName)) || 
                                     '未分配';
                
                row.innerHTML = `
                  <td>${consumptionDate}</td>
                  <td>${serviceName}</td>
                  <td>¥${amount.toFixed(2)}</td>
                  <td>${paymentMethodText}</td>
                  <td>${therapistName}</td>
                  <td>
                    <button type="button" class="btn btn-sm btn-outline-primary view-consumption-btn" data-id="${record._id || ''}">
                      详情
                    </button>
                  </td>
                `;
                
                tbody.appendChild(row);
              } catch (rowError) {
                console.error('处理消费记录行时出错:', rowError, record);
                // 继续处理下一条记录，不中断循环
              }
            });
          }
        }
      } catch (error) {
        console.error('获取消费记录失败:', error);
        this.showToast('获取消费记录失败', 'error');
        if (noConsumption) noConsumption.classList.remove('d-none');
      }
      
      // 绑定事件监听器
      this.bindConsumptionTabEvents();
      
      console.log('会员卡和消费记录加载完成');
    } catch (error) {
      console.error('加载会员卡和消费记录出错:', error);
      this.showToast('加载会员数据失败，请刷新页面重试', 'error');
    }
  }
  
  /**
   * 绑定消费标签页中的事件
   */
  bindConsumptionTabEvents() {
    // 绑定会员卡按钮事件
    document.querySelectorAll('.view-membership-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const membershipId = e.target.dataset.id;
        window.location.href = `membership-detail.html?id=${membershipId}`;
      });
    });
    
    // 绑定充值按钮事件
    document.querySelectorAll('.recharge-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const membershipId = e.target.dataset.id;
        window.location.href = `membership-recharge.html?id=${membershipId}`;
      });
    });
    
    // 绑定作废按钮事件
    document.querySelectorAll('.void-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const membershipId = e.target.dataset.id;
        if (confirm('确定要作废此会员卡吗？此操作无法撤销。')) {
          this.voidMembership(membershipId);
        }
      });
    });
    
    // 绑定刷新按钮事件
    const refreshBtn = document.getElementById('refreshConsumptionBtn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.loadConsumptionHistory();
      });
    }
  }
  
  /**
   * 作废会员卡
   * @param {string} membershipId 会员卡ID
   */
  async voidMembership(membershipId) {
    try {
      this.showLoading('正在作废会员卡...');
      
      await dataService.updateMembershipStatus(membershipId, { status: 'void' });
      
      this.hideLoading();
      this.showToast('会员卡已作废', 'success');
      
      // 重新加载会员卡数据
      this.loadConsumptionHistory();
    } catch (error) {
      console.error('作废会员卡失败:', error);
      this.hideLoading();
      this.showToast('作废会员卡失败: ' + error.message, 'error');
    }
  }
  
  /**
   * 获取客户的会员卡记录
   * @returns {Promise<Array>} 会员卡记录数组
   */
  async getCustomerMemberships() {
    try {
      console.log(`尝试从API获取客户(ID: ${this.customerId})的会员卡数据`);
      const response = await dataService.getCustomerMemberships(this.customerId);
      console.log('API返回的会员卡数据:', response);
      
      // 处理不同的响应格式
      if (!response) {
        return [];
      }
      
      // 尝试从不同的位置提取数据数组
      if (Array.isArray(response)) {
        return response;
      } else if (response.data && Array.isArray(response.data)) {
        return response.data;
      } else if (response.memberships && Array.isArray(response.memberships)) {
        return response.memberships;
      } else {
        console.error('无法解析API返回的会员卡数据结构:', response);
        return [];
      }
    } catch (error) {
      console.error('从API获取会员卡数据失败:', error);
      // 直接返回空数组，不再从localStorage获取
      return [];
    }
  }
  
  /**
   * 获取客户的消费记录
   * @returns {Promise<Array>} 消费记录数组
   */
  async getCustomerConsumptions() {
    try {
      console.log(`尝试从API获取客户(ID: ${this.customerId})的消费记录`);
      const response = await dataService.getCustomerConsumptions(this.customerId);
      console.log('API返回的消费记录原始数据:', response);
      
      // 检查API返回的数据结构
      if (!response) {
        console.error('API返回的数据为空');
        return [];
      }
      
      // 尝试从不同的位置提取数据数组
      let records = [];
      
      if (Array.isArray(response)) {
        // 直接返回了数组
        records = response;
      } else if (response.data && Array.isArray(response.data)) {
        // 标准API格式：{ data: [...] }
        records = response.data;
      } else if (response.services && Array.isArray(response.services)) {
        // 可能的替代格式：{ services: [...] }
        records = response.services;
      } else if (response.records && Array.isArray(response.records)) {
        // 可能的替代格式：{ records: [...] }
        records = response.records;
      } else {
        console.error('无法解析API返回的数据结构:', response);
        return [];
      }
      
      // 对数据进行处理，确保格式统一
      const processedRecords = records.map(record => {
        // 创建一个新对象，避免修改原始数据
        const processedRecord = { ...record };
        
        // 处理服务日期
        if (!processedRecord.serviceDate && (processedRecord.date || processedRecord.createdAt)) {
          processedRecord.serviceDate = processedRecord.date || processedRecord.createdAt;
        }
        
        // 确保serviceType字段保留，它可能已经包含服务类型名称
        // 不需要做额外处理，因为我们已经复制了整个record对象
        
        // 处理服务项目，尝试从serviceItems中获取完整的服务项目信息
        if (processedRecord.serviceItems && Array.isArray(processedRecord.serviceItems)) {
          // 如果有多个服务项目，将它们的名称合并显示
          processedRecord.serviceName = processedRecord.serviceItems
            .map(item => {
              // 如果是对象，取其name属性；如果是字符串ID，保持原样
              if (typeof item === 'object' && item !== null) {
                return item.name || item.title || '未知项目';
              } else if (typeof item === 'string') {
                return item; // 将在后续的getFormattedServiceName中进一步处理
              }
              return '未知项目';
            })
            .join(', ');
        }
        
        return processedRecord;
      });
      
      return processedRecords;
    } catch (error) {
      console.error('获取消费记录失败:', error);
      throw error;
    }
  }
  
  /**
   * 加载舌苔对比图
   */
  loadTongueImages() {
    const tongueTab = document.getElementById('tongue');
    if (!tongueTab) return;
    
    // 这里只是一个示例界面，实际上需要从服务记录中获取照片
    tongueTab.innerHTML = `
      <div class="alert alert-info mb-4">
        <i class="bi bi-info-circle me-2"></i> 舌苔对比图功能需要在服务时上传舌苔照片
      </div>
      
      <div class="row">
        <div class="col-md-12 mb-4">
          <div class="card">
            <div class="card-header">
              <h5 class="card-title mb-0">舌苔照片时间轴</h5>
            </div>
            <div class="card-body">
              <div class="d-flex justify-content-center align-items-center" style="height: 200px;">
                <p class="text-muted">暂无舌苔照片记录</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="mt-4">
        <a href="service-add.html?customer_id=${this.customerId}" class="btn btn-primary">
          <i class="bi bi-plus-circle me-2"></i> 添加服务（可上传舌苔照片）
        </a>
      </div>
    `;
  }
  
  /**
   * 处理删除操作
   */
  async handleDelete() {
    try {
      this.showLoading('正在删除客户信息...');
      
      await dataService.deleteCustomer(this.customerId);
      
      // 隐藏加载状态
      this.hideLoading();
      
      // 显示成功消息
      this.showToast('客户删除成功！即将返回客户列表...', 'success');
      
      // 关闭删除确认框
      const deleteModalInstance = bootstrap.Modal.getInstance(this.deleteModal);
      if (deleteModalInstance) {
        deleteModalInstance.hide();
      }
      
      // 延迟跳转到客户列表页
      setTimeout(() => {
        window.location.href = 'customer.html';
      }, 2000);
    } catch (error) {
      console.error('删除客户出错:', error);
      this.hideLoading();
      
      // 显示详细错误信息
      if (error.message) {
        this.showToast(`删除客户失败: ${error.message}`, 'danger');
      } else {
        this.showToast('服务器连接失败，请检查网络连接后重试', 'danger');
      }
    }
  }
  
  /**
   * 计算年龄
   * @param {string} birthdate 出生日期字符串
   * @returns {string} 年龄，如 "5岁"
   */
  calculateAge(birthdate) {
    if (!birthdate) return '未知';
    
    const birth = new Date(birthdate);
    const now = new Date();
    
    let years = now.getFullYear() - birth.getFullYear();
    const months = now.getMonth() - birth.getMonth();
    
    if (months < 0 || (months === 0 && now.getDate() < birth.getDate())) {
      years--;
    }
    
    return years + '岁';
  }
  
  /**
   * 计算详细年龄（年月）
   * @param {string} birthdate 出生日期字符串
   * @returns {string} 详细年龄，如 "5岁3个月"
   */
  calculateAgeDetailed(birthdate) {
    if (!birthdate) return '未知';
    
    const birth = new Date(birthdate);
    const now = new Date();
    
    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();
    
    if (months < 0) {
      years--;
      months += 12;
    }
    
    if (years < 1) {
      return months + '个月';
    }
    
    return years + '岁' + (months > 0 ? months + '个月' : '');
  }
  
  /**
   * 获取会员状态徽章HTML
   * @param {string} status 状态字符串
   * @returns {string} 徽章HTML
   */
  getMembershipStatusBadge(status) {
    switch (status) {
      case 'active':
        return '<span class="badge bg-success">有效</span>';
      case 'expired':
        return '<span class="badge bg-danger">已过期</span>';
      case 'expiring':
        return '<span class="badge bg-warning text-dark">即将到期</span>';
      default:
        return '<span class="badge bg-secondary">无会员</span>';
    }
  }
  
  /**
   * 获取评价对应的颜色
   * @param {string} evaluation 评价字符串
   * @returns {string} Bootstrap颜色类
   */
  getEvaluationColor(evaluation) {
    if (!evaluation) return 'secondary';
    
    if (evaluation.includes('优') || evaluation.includes('好')) {
      return 'success';
    } else if (evaluation.includes('一般')) {
      return 'warning';
    } else if (evaluation.includes('差') || evaluation.includes('不')) {
      return 'danger';
    } else {
      return 'primary';
    }
  }
  
  /**
   * 显示加载中提示
   */
  showLoading(message = '加载中...') {
    try {
      const loadingIndicator = document.getElementById('loadingIndicator');
      const loadingText = document.getElementById('loadingText');
      
      if (!loadingIndicator || !loadingText) {
        console.error('找不到加载指示器元素');
        return;
      }
      
      // 设置消息
      loadingText.textContent = message;
      
      // 移除d-none类显示加载提示
      loadingIndicator.classList.remove('d-none');
      
      // 确保错误消息隐藏
      const errorMessage = document.getElementById('errorMessage');
      if (errorMessage) {
        errorMessage.classList.add('d-none');
      }
      
      console.log('显示加载提示:', message);
    } catch (error) {
      console.error('显示加载提示出错:', error);
    }
  }
  
  /**
   * 隐藏加载中提示
   */
  hideLoading() {
    try {
      const loadingIndicator = document.getElementById('loadingIndicator');
      
      if (!loadingIndicator) {
        console.error('找不到加载指示器元素');
        return;
      }
      
      // 添加d-none类隐藏加载提示
      loadingIndicator.classList.add('d-none');
      console.log('隐藏加载提示');
      
      // 确保customerInfo容器可见
      if (this.customerInfoContainer) {
        this.customerInfoContainer.style.display = 'block';
        this.customerInfoContainer.style.visibility = 'visible';
      }
    } catch (error) {
      console.error('隐藏加载提示出错:', error);
    }
  }
  
  /**
   * 显示错误信息
   */
  showError(message) {
    try {
      // 隐藏加载提示
      this.hideLoading();
      
      const errorDiv = document.getElementById('errorMessage');
      const errorText = document.getElementById('errorText');
      
      if (!errorDiv || !errorText) {
        console.error('找不到错误信息元素');
        return;
      }
      
      // 设置错误消息
      errorText.textContent = message;
      
      // 显示错误提示
      errorDiv.classList.remove('d-none');
      
      console.log('显示错误信息:', message);
    } catch (error) {
      console.error('显示错误信息出错:', error);
    }
  }
  
  /**
   * 显示提示消息
   * @param {string} message 消息内容
   * @param {string} type 消息类型 (success, danger, warning, info)
   */
  showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;
    
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type} border-0`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    toast.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">
          ${message}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    `;
    
    toastContainer.appendChild(toast);
    
    const bsToast = new bootstrap.Toast(toast, {
      autohide: true,
      delay: 3000
    });
    
    bsToast.show();
    
    // 自动移除
    toast.addEventListener('hidden.bs.toast', () => {
      toast.remove();
    });
  }
  
  /**
   * 关闭编辑模态框
   */
  closeEditModal() {
    try {
      console.log('开始关闭模态框并恢复页面滚动');
      
      // 1. 获取模态框元素
      const modalElement = document.getElementById('editCustomerModal');
      
      // 2. 强制移除所有背景遮罩
      document.querySelectorAll('.modal-backdrop').forEach(el => {
        el.parentNode.removeChild(el);
      });
      
      // 3. 清理body上的所有模态框相关样式和类
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      
      // 4. 尝试记录和发现可能阻止滚动的其他元素
      document.querySelectorAll('div[style*="overflow: hidden"]').forEach(el => {
        console.log('发现可能阻止滚动的元素:', el);
        el.style.overflow = '';
      });
      
      // 5. 强制触发window的resize事件，帮助浏览器重新计算布局
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 100);
      
      // 6. 使用多种方式尝试关闭模态框
      if (modalElement) {
        // 6.1 使用jQuery (最可靠的方法)
        if (typeof $ !== 'undefined') {
          $(modalElement).modal('hide');
        }
        
        // 6.2 使用Bootstrap API
        if (typeof bootstrap !== 'undefined') {
          const modalInstance = bootstrap.Modal.getInstance(modalElement);
          if (modalInstance) {
            modalInstance.hide();
          }
        }
        
        // 6.3 直接修改DOM (最后的方法)
        modalElement.classList.remove('show');
        modalElement.style.display = 'none';
        modalElement.setAttribute('aria-hidden', 'true');
        modalElement.removeAttribute('aria-modal');
      }
      
      // 7. 强制设置页面可以滚动
      this.forcePageScroll();
      
      console.log('模态框关闭完成');
    } catch (error) {
      console.error('关闭模态框出错:', error);
      // 即使出错也要尝试恢复滚动
      this.forcePageScroll();
    }
  }
  
  /**
   * 强制恢复页面滚动
   */
  forcePageScroll() {
    try {
      console.log('强制恢复页面滚动能力');
      
      // 1. 重置关键样式
      document.body.style.overflow = 'auto';
      document.body.style.position = 'static';
      document.documentElement.style.overflow = 'auto';
      
      // 2. 移除可能影响滚动的类
      document.body.classList.remove('modal-open', 'overflow-hidden', 'fixed-top', 'fixed-bottom');
      
      // 3. 移除所有遮罩层
      document.querySelectorAll('.modal-backdrop, .offcanvas-backdrop').forEach(backdrop => {
        backdrop.remove();
      });
      
      // 4. 检查是否有其他模态框当前显示，如果没有则恢复滚动
      const anyVisibleModal = document.querySelector('.modal.show');
      if (!anyVisibleModal) {
        // 强制设置滚动属性
        const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
        document.body.style.paddingRight = '0px';
        document.body.style.overflow = 'auto';
      }
      
      // 5. 添加一个短暂的超时，允许DOM更新
      setTimeout(() => {
        // 双重保险：再次尝试启用滚动
        document.body.style.overflow = 'auto';
        window.dispatchEvent(new Event('resize'));
      }, 300);
      
    } catch (error) {
      console.error('强制恢复滚动出错:', error);
      // 最后的绝招：刷新窗口
      // 注释掉 - 这是最后的选择，先不使用
      // window.location.reload();
    }
  }
  
  /**
   * 填充编辑表单
   */
  fillEditForm() {
    try {
      if (!this.customerData) {
        console.error('没有客户数据可用于填充表单');
        this.showToast('无法加载客户数据进行编辑', 'danger');
        return;
      }
      
      console.log('开始填充编辑表单，数据:', this.customerData);
      
      // 获取表单元素
      const form = document.getElementById('editCustomerForm');
      if (!form) {
        console.error('未找到编辑表单元素');
        return;
      }
      
      // 清空表单字段，避免数据混合
      form.reset();
      
      // 填充基本信息
      const childNameField = document.getElementById('editChildName');
      if (childNameField) {
        childNameField.value = this.customerData.childName || '';
      }
      
      // 性别选择
      const maleRadio = document.getElementById('editGenderMale');
      const femaleRadio = document.getElementById('editGenderFemale');
      
      if (maleRadio && femaleRadio) {
        if (this.customerData.childGender === 'male') {
          maleRadio.checked = true;
        } else if (this.customerData.childGender === 'female') {
          femaleRadio.checked = true;
        } else {
          // 默认不选择任何性别
          maleRadio.checked = false;
          femaleRadio.checked = false;
        }
      }
      
      // 出生日期和年龄
      const birthDateField = document.getElementById('editChildBirthdate');
      const ageField = document.getElementById('editChildAge');
      
      if (birthDateField && this.customerData.childBirthdate) {
        try {
          // 尝试将日期字符串格式化为yyyy-MM-dd格式
          const birthdate = new Date(this.customerData.childBirthdate);
          const year = birthdate.getFullYear();
          const month = String(birthdate.getMonth() + 1).padStart(2, '0');
          const day = String(birthdate.getDate()).padStart(2, '0');
          birthDateField.value = `${year}-${month}-${day}`;
        } catch (error) {
          console.error('格式化出生日期出错:', error);
          birthDateField.value = '';
        }
      } else if (birthDateField) {
        birthDateField.value = '';
      }
      
      if (ageField && this.customerData.childAge) {
        ageField.value = this.customerData.childAge;
      } else if (ageField && this.customerData.childBirthdate) {
        ageField.value = this.calculateAge(this.customerData.childBirthdate);
      } else if (ageField) {
        ageField.value = '';
      }
      
      // 填充家长信息
      this.setFieldValue('editParentName', this.customerData.parentName);
      
      // 关系选择
      const relationshipSelect = document.getElementById('editRelationship');
      if (relationshipSelect) {
        relationshipSelect.value = this.customerData.relationship || '';
      }
      
      this.setFieldValue('editPhone', this.customerData.phone);
      this.setFieldValue('editEmail', this.customerData.email);
      this.setFieldValue('editAddress', this.customerData.address);
      
      // 体质和健康信息
      const constitutionSelect = document.getElementById('editConstitution');
      if (constitutionSelect) {
        constitutionSelect.value = this.customerData.constitution || '';
      }
      
      const sourceSelect = document.getElementById('editSource');
      if (sourceSelect) {
        sourceSelect.value = this.customerData.source || '';
      }
      
      this.setFieldValue('editMainSymptoms', this.customerData.mainSymptoms);
      this.setFieldValue('editAllergyHistory', this.customerData.allergyHistory);
      this.setFieldValue('editFamilyHistory', this.customerData.familyHistory);
      this.setFieldValue('editMedicalHistory', this.customerData.medicalHistory);
      this.setFieldValue('editNotes', this.customerData.notes);
      
      console.log('编辑表单填充完成');
    } catch (error) {
      console.error('填充编辑表单出错:', error);
      this.showToast('填充表单时发生错误，请重试', 'danger');
    }
  }
  
  /**
   * 设置表单字段值，带有null检查
   * @param {string} fieldId 字段ID
   * @param {string|null} value 字段值
   */
  setFieldValue(fieldId, value) {
    const field = document.getElementById(fieldId);
    if (field) {
      field.value = value || '';
    }
  }
  
  /**
   * 更新客户信息
   */
  async updateCustomer() {
    try {
      this.showLoading('正在更新客户信息...');
      
      if (!this.customerData) {
        console.error('没有客户数据可用于更新');
        this.showToast('无法加载客户数据进行更新', 'danger');
        return;
      }
      
      console.log('开始更新客户信息，原始数据:', this.customerData);
      
      // 获取表单数据
      const form = document.getElementById('editCustomerForm');
      if (!form) {
        console.error('未找到编辑表单元素');
        return;
      }
      
      // 收集表单数据
      let updatedData = {
        childName: form.elements.childName?.value || '',
        childGender: form.elements.childGender?.value || 'unknown',
        parentName: form.elements.parentName?.value || '',
        relationship: form.elements.relationship?.value || '',
        phone: form.elements.phone?.value || '',
        address: form.elements.address?.value || '',
        email: form.elements.email?.value || '',
        constitution: form.elements.constitution?.value || '',
        mainSymptoms: form.elements.mainSymptoms?.value || '',
        allergyHistory: form.elements.allergyHistory?.value || '',
        familyHistory: form.elements.familyHistory?.value || '',
        medicalHistory: form.elements.medicalHistory?.value || '',
        notes: form.elements.notes?.value || '',
        source: form.elements.source?.value || ''
      };
      
      // 处理日期字段
      if (form.elements.childBirthdate?.value) {
        try {
          // 确保日期格式正确 (ISO 8601)
          const birthdate = new Date(form.elements.childBirthdate.value);
          if (!isNaN(birthdate.getTime())) {
            updatedData.childBirthdate = birthdate.toISOString();
          }
        } catch (error) {
          console.error('日期格式转换错误:', error);
          // 如果日期格式错误，不包括该字段
        }
      }
      
      // 处理年龄字段 (转换为数字)
      if (form.elements.childAge?.value) {
        const age = parseInt(form.elements.childAge.value);
        if (!isNaN(age)) {
          updatedData.childAge = age;
        }
      }
      
      // 只有当表单中存在membershipStatus字段时才添加它
      if (form.elements.membershipStatus) {
        updatedData.membershipStatus = form.elements.membershipStatus.value;
      } else {
        // 保留原有的会员状态
        updatedData.membershipStatus = this.customerData.membershipStatus || 'none';
      }
      
      // 确保我们保留原始文档中必要的字段
      updatedData = {
        ...updatedData,
        synced: this.customerData.synced !== undefined ? this.customerData.synced : true
      };
      
      console.log('更新数据:', updatedData);
      
      // 更新客户数据
      const updatedCustomer = await dataService.updateCustomer(this.customerId, updatedData);
      
      // 更新本地客户数据
      if (updatedCustomer) {
        this.customerData = updatedCustomer;
      }
      
      // 隐藏加载状态
      this.hideLoading();
      
      // 先关闭模态框，再显示成功消息
      this.closeEditModal();
      
      // 强制恢复滚动
      this.forcePageScroll();
      
      // 显示成功消息
      this.showToast('客户信息更新成功！', 'success');
      
      // 延迟一点再重新加载客户信息，确保模态框正确关闭
      setTimeout(async () => {
        // 重新加载客户信息
        await this.loadCustomerData();
      }, 300);
      
    } catch (error) {
      console.error('更新客户信息出错:', error);
      this.hideLoading();
      
      // 显示详细错误信息
      if (error.message) {
        this.showToast(`更新客户信息失败: ${error.message}`, 'danger');
      } else {
        this.showToast('服务器连接失败，请检查网络连接后重试', 'danger');
      }
    }
  }
  
  /**
   * 获取会员卡类型的中文名称
   * @param {string} cardType 卡类型英文
   * @returns {string} 卡类型中文名称
   */
  getCardTypeText(cardType) {
    const cardTypeMap = {
      'value': '储值卡',
      'count': '次数卡',
      'period': '期限卡',
      'mixed': '混合卡',
      'discount': '折扣卡'
    };
    return cardTypeMap[cardType] || cardType || '未知类型';
  }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  new CustomerDetail();
});

export default CustomerDetail;