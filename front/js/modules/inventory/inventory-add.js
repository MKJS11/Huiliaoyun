import DataService from '../../services/data-service.js';

/**
 * 新增商品模块
 * 处理商品添加功能
 */
class InventoryAdd {
  constructor() {
    this.dataService = DataService;
    this.form = document.getElementById('addInventoryForm');
    
    this.initEventListeners();
  }
  
  /**
   * 初始化事件监听器
   */
  initEventListeners() {
    // 表单提交事件
    this.form.addEventListener('submit', (event) => {
      event.preventDefault();
      this.handleSubmit();
    });
    
    // 重置按钮事件
    document.getElementById('resetBtn').addEventListener('click', () => {
      this.form.reset();
    });
  }
  
  /**
   * 处理表单提交
   */
  async handleSubmit() {
    try {
      // 表单验证
      if (!this.form.checkValidity()) {
        this.form.reportValidity();
        return;
      }
      
      // 获取表单数据
      const formData = new FormData(this.form);
      const itemData = {
        name: formData.get('name'),
        category: formData.get('category'),
        specification: formData.get('specification'),
        unit: formData.get('unit'),
        costPrice: Number(formData.get('costPrice')),
        sellingPrice: Number(formData.get('sellingPrice')),
        stock: Number(formData.get('stock')),
        warningThreshold: Number(formData.get('warningThreshold')),
        supplier: formData.get('supplier'),
        description: formData.get('description')
      };
      
      // 显示加载
      this.showLoading();
      
      // 调用API创建商品
      const result = await this.dataService.createInventoryItem(itemData);
      
      // 显示成功消息
      this.showToast('创建成功', '商品已成功添加到库存', 'success');
      
      // 表单重置
      this.form.reset();
      
      // 隐藏加载
      this.hideLoading();
      
      // 跳转到库存列表
      setTimeout(() => {
        window.location.href = 'inventory.html';
      }, 1500);
    } catch (error) {
      console.error('创建商品失败:', error);
      this.showToast('创建失败', error.message, 'error');
      this.hideLoading();
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
}

// 当DOM加载完成后初始化模块
document.addEventListener('DOMContentLoaded', () => {
  new InventoryAdd();
});

export default InventoryAdd; 