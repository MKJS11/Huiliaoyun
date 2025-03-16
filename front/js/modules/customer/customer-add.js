/**
 * 客户添加页面功能
 */
import dataService from '../../services/data-service.js';

class CustomerAdd {
  constructor() {
    this.form = document.getElementById('customerForm');
    this.submitBtn = document.getElementById('submitBtn');
    this.resetBtn = document.getElementById('resetBtn');
    this.loadingSpinner = document.querySelector('.spinner-border');
    
    this.initEventListeners();
    this.initFormValidation();
    this.initDateFields();
  }
  
  /**
   * 初始化事件监听器
   */
  initEventListeners() {
    if (this.form) {
      this.form.addEventListener('submit', this.handleSubmit.bind(this));
    }
    
    if (this.resetBtn) {
      this.resetBtn.addEventListener('click', this.handleReset.bind(this));
    }
    
    // 为年龄和生日字段添加联动
    const ageField = document.getElementById('childAge');
    const birthDateField = document.getElementById('childBirthdate');
    
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
  }
  
  /**
   * 初始化表单验证
   */
  initFormValidation() {
    if (!this.form) return;
    
    // 获取所有必填字段
    const requiredFields = this.form.querySelectorAll('[required]');
    
    // 为每个必填字段添加失去焦点验证
    requiredFields.forEach(field => {
      field.addEventListener('blur', () => {
        this.validateField(field);
      });
      
      // 对于文本输入，添加输入事件以清除错误
      if (field.tagName === 'INPUT' && field.type !== 'checkbox' && field.type !== 'radio') {
        field.addEventListener('input', () => {
          if (field.value.trim()) {
            field.classList.remove('is-invalid');
            const feedbackElement = field.nextElementSibling;
            if (feedbackElement && feedbackElement.classList.contains('invalid-feedback')) {
              feedbackElement.textContent = '';
            }
          }
        });
      }
    });
  }
  
  /**
   * 验证单个字段
   * @param {HTMLElement} field 表单字段元素
   * @returns {boolean} 验证是否通过
   */
  validateField(field) {
    if (!field.hasAttribute('required')) return true;
    
    let isValid = true;
    let errorMessage = '';
    
    // 根据字段类型验证
    if (field.tagName === 'INPUT' && field.type === 'checkbox') {
      // 复选框验证
      isValid = field.checked;
      errorMessage = '请勾选此项';
    } else if (field.tagName === 'SELECT') {
      // 下拉列表验证
      isValid = field.value !== '';
      errorMessage = '请选择一项';
    } else {
      // 文本输入验证
      isValid = field.value.trim() !== '';
      errorMessage = '此字段不能为空';
      
      // 特殊类型的验证
      if (isValid && field.type === 'tel') {
        // 电话号码验证
        const phonePattern = /^\d{11}$/;
        isValid = phonePattern.test(field.value.trim());
        errorMessage = '请输入有效的11位手机号码';
      } else if (isValid && field.type === 'email') {
        // 邮箱验证
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        isValid = emailPattern.test(field.value.trim());
        errorMessage = '请输入有效的电子邮箱地址';
      } else if (isValid && field.type === 'date' && field.id === 'childBirthdate') {
        // 出生日期验证（确保年龄不超过50岁）
        if (field.value) {
          const birthDate = new Date(field.value);
          const today = new Date();
          const minDate = new Date(today.getFullYear() - 50, today.getMonth(), today.getDate());
          
          if (birthDate < minDate) {
            isValid = false;
            errorMessage = '年龄不能超过50岁';
          }
        }
      }
    }
    
    // 更新UI显示
    if (!isValid) {
      field.classList.add('is-invalid');
      
      // 查找或创建错误反馈元素
      let feedbackElement = field.nextElementSibling;
      if (!feedbackElement || !feedbackElement.classList.contains('invalid-feedback')) {
        feedbackElement = document.createElement('div');
        feedbackElement.className = 'invalid-feedback';
        field.insertAdjacentElement('afterend', feedbackElement);
      }
      
      feedbackElement.textContent = errorMessage;
    } else {
      field.classList.remove('is-invalid');
      const feedbackElement = field.nextElementSibling;
      if (feedbackElement && feedbackElement.classList.contains('invalid-feedback')) {
        feedbackElement.textContent = '';
      }
    }
    
    return isValid;
  }
  
  /**
   * 验证整个表单
   * @returns {boolean} 表单是否验证通过
   */
  validateForm() {
    if (!this.form) return false;
    
    const requiredFields = this.form.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
      if (!this.validateField(field)) {
        isValid = false;
      }
    });
    
    return isValid;
  }
  
  /**
   * 处理表单提交
   * @param {Event} event 表单提交事件
   */
  async handleSubmit(event) {
    event.preventDefault();
    
    if (!this.validateForm()) {
      this.showToast('请完成所有必填项', 'warning');
      return;
    }
    
    // 禁用提交按钮，显示加载状态
    this.setLoading(true);
    
    try {
      const formData = this.getFormData();
      
      // 调用数据服务添加客户
      const customer = await dataService.addCustomer(formData);
      
      // 显示成功消息
      this.showToast('客户添加成功！', 'success');
      
      // 重置表单
      this.form.reset();
      
      // 2秒后跳转到客户详情页
      setTimeout(() => {
        window.location.href = `customer-detail.html?id=${customer._id}`;
      }, 2000);
    } catch (error) {
      console.error('添加客户出错:', error);
      
      // 显示详细错误信息
      if (error.message === '年龄不能超过50岁') {
        // 年龄错误特殊处理
        this.showToast('年龄不能超过50岁，请修改出生日期', 'warning');
        // 切换到第一个标签页，展示孩子信息
        document.getElementById('child-tab').click();
        // 聚焦到出生日期输入框
        const birthDateField = document.getElementById('childBirthdate');
        if (birthDateField) {
          birthDateField.focus();
        }
      } else if (error.message) {
        this.showToast(`添加客户失败: ${error.message}`, 'danger');
      } else {
        this.showToast('服务器连接失败，请检查网络连接后重试', 'danger');
      }
    } finally {
      // 恢复提交按钮，隐藏加载状态
      this.setLoading(false);
    }
  }
  
  /**
   * 从表单获取数据
   * @returns {Object} 表单数据对象
   */
  getFormData() {
    if (!this.form) return {};
    
    // 获取基本信息
    const childName = document.getElementById('childName')?.value.trim() || '';
    const childGender = document.querySelector('input[name="childGender"]:checked')?.value || 'unknown';
    const childBirthdate = document.getElementById('childBirthdate')?.value || null;
    const childAge = document.getElementById('childAge')?.value || null;
    
    // 验证出生日期（确保不超过50岁）
    if (childBirthdate) {
      const birthDate = new Date(childBirthdate);
      const today = new Date();
      const minDate = new Date(today.getFullYear() - 50, today.getMonth(), today.getDate());
      
      if (birthDate < minDate) {
        // 如果超过50岁，显示错误并返回空对象
        const birthDateField = document.getElementById('childBirthdate');
        if (birthDateField) {
          birthDateField.classList.add('is-invalid');
          let feedbackElement = birthDateField.nextElementSibling;
          if (!feedbackElement || !feedbackElement.classList.contains('invalid-feedback')) {
            feedbackElement = document.createElement('div');
            feedbackElement.className = 'invalid-feedback';
            birthDateField.insertAdjacentElement('afterend', feedbackElement);
          }
          feedbackElement.textContent = '年龄不能超过50岁';
        }
        throw new Error('年龄不能超过50岁');
      }
    }
    
    const parentName = document.getElementById('parentName')?.value.trim() || '';
    const relationship = document.getElementById('relationship')?.value || '';
    const phone = document.getElementById('phone')?.value.trim() || '';
    const address = document.getElementById('address')?.value.trim() || '';
    const email = document.getElementById('email')?.value.trim() || '';
    
    // 获取体质信息
    const constitution = document.getElementById('constitution')?.value || '';
    const mainSymptoms = document.getElementById('mainSymptoms')?.value.trim() || '';
    
    // 获取病史信息
    const allergyHistory = document.getElementById('allergyHistory')?.value.trim() || '';
    const familyHistory = document.getElementById('familyHistory')?.value.trim() || '';
    const medicalHistory = document.getElementById('medicalHistory')?.value.trim() || '';
    
    // 获取备注信息
    const notes = document.getElementById('notes')?.value.trim() || '';
    
    // 获取来源信息
    const source = document.getElementById('source')?.value || '';
    
    // 构建客户数据对象
    return {
      childName,
      childGender,
      childBirthdate,
      childAge: parseInt(childAge) || null,
      parentName,
      relationship,
      phone,
      address,
      email,
      constitution,
      mainSymptoms,
      allergyHistory,
      familyHistory,
      medicalHistory,
      notes,
      source,
      membershipStatus: 'none'
    };
  }
  
  /**
   * 设置加载状态
   * @param {boolean} isLoading 是否处于加载状态
   */
  setLoading(isLoading) {
    if (this.submitBtn) {
      this.submitBtn.disabled = isLoading;
      this.submitBtn.innerHTML = isLoading 
        ? '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> 提交中...'
        : '提交';
    }
    
    if (this.resetBtn) {
      this.resetBtn.disabled = isLoading;
    }
  }
  
  /**
   * 处理表单重置
   */
  handleReset() {
    if (!this.form) return;
    
    // 重置表单
    this.form.reset();
    
    // 清除所有验证错误
    const invalidFields = this.form.querySelectorAll('.is-invalid');
    invalidFields.forEach(field => {
      field.classList.remove('is-invalid');
    });
    
    const feedbacks = this.form.querySelectorAll('.invalid-feedback');
    feedbacks.forEach(feedback => {
      feedback.textContent = '';
    });
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
    
    // 显示Toast
    const bsToast = new bootstrap.Toast(toast, {
      autohide: true,
      delay: 3000
    });
    bsToast.show();
  }
  
  /**
   * 初始化日期字段
   */
  initDateFields() {
    const birthDateField = document.getElementById('childBirthdate');
    if (birthDateField) {
      // 设置最小日期（当前日期减去50年）
      const today = new Date();
      const minDate = new Date(today.getFullYear() - 50, today.getMonth(), today.getDate());
      const formattedMinDate = minDate.toISOString().split('T')[0];
      birthDateField.min = formattedMinDate;
      
      // 默认设置为今天（通常用于新生儿）
      const todayFormatted = today.toISOString().split('T')[0];
      birthDateField.max = todayFormatted;
    }
  }
}

// 初始化客户添加页面
document.addEventListener('DOMContentLoaded', () => {
  new CustomerAdd();
}); 