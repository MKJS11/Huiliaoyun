/**
 * 客户列表页功能
 */
import dataService from '../../services/data-service.js';

class CustomerList {
  constructor() {
    this.customerTable = document.getElementById('customerTable');
    this.tableBody = document.querySelector('#customerTable tbody');
    this.searchInput = document.getElementById('searchCustomer');
    this.filterSelect = document.getElementById('filterMembership');
    this.deleteModal = document.getElementById('deleteCustomerModal');
    this.deleteBtn = document.getElementById('confirmDeleteBtn');
    this.currentCustomerId = null;
    
    this.initEventListeners();
    this.loadCustomers();
  }
  
  /**
   * 初始化事件监听器
   */
  initEventListeners() {
    // 搜索框输入事件
    if (this.searchInput) {
      this.searchInput.addEventListener('input', this.handleSearch.bind(this));
    }
    
    // 会员状态筛选事件
    if (this.filterSelect) {
      this.filterSelect.addEventListener('change', this.handleFilter.bind(this));
    }
    
    // 删除确认按钮事件
    if (this.deleteBtn) {
      this.deleteBtn.addEventListener('click', this.handleDelete.bind(this));
    }
    
    // 删除模态框打开事件，用于获取要删除的客户ID
    if (this.deleteModal) {
      this.deleteModal.addEventListener('show.bs.modal', (event) => {
        const button = event.relatedTarget;
        this.currentCustomerId = button.getAttribute('data-customer-id');
        const customerName = button.getAttribute('data-customer-name');
        
        // 更新模态框中的客户名称
        const nameSpan = this.deleteModal.querySelector('.customer-name');
        if (nameSpan) {
          nameSpan.textContent = customerName;
        }
      });
    }
  }

  /**
   * 处理搜索事件
   */
  async handleSearch() {
    const keyword = this.searchInput.value.trim();
    const customers = await dataService.searchCustomers(keyword);
    
    // 更新搜索结果中客户的会员状态
    await this.updateCustomersMembershipStatus(customers);
    
    this.renderCustomerTable(customers);
  }
  
  /**
   * 处理会员状态筛选
   */
  async handleFilter() {
    const filter = this.filterSelect.value;
    const customers = await dataService.getAllCustomers();
    
    // 更新客户会员状态
    await this.updateCustomersMembershipStatus(customers);
    
    let filteredCustomers = customers;
    if (filter === 'active') {
      filteredCustomers = customers.filter(customer => 
        customer.membershipStatus === 'active');
    } else if (filter === 'expired') {
      filteredCustomers = customers.filter(customer => 
        customer.membershipStatus === 'expired');
    } else if (filter === 'expiring') {
      filteredCustomers = customers.filter(customer => 
        customer.membershipStatus === 'expiring');
    } else if (filter === 'none') {
      filteredCustomers = customers.filter(customer => 
        !customer.membershipStatus || customer.membershipStatus === 'none');
    }
    
    this.renderCustomerTable(filteredCustomers);
  }
  
  /**
   * 处理删除客户事件
   */
  async handleDelete() {
    if (!this.currentCustomerId) return;
    
    try {
      const success = await dataService.deleteCustomer(this.currentCustomerId);
      if (success) {
        // 关闭模态框
        const modal = bootstrap.Modal.getInstance(this.deleteModal);
        modal.hide();
        
        // 重新加载客户列表
        this.loadCustomers();
        
        // 显示成功消息
        this.showToast('客户删除成功！', 'success');
      } else {
        this.showToast('删除失败，未找到该客户。', 'danger');
      }
    } catch (error) {
      console.error('删除客户出错:', error);
      this.showToast('删除客户时出错，请重试。', 'danger');
    }
  }
  
  /**
   * 加载所有客户数据
   */
  async loadCustomers() {
    try {
      const customers = await dataService.getAllCustomers();
      
      // 检查customers是否为空或未定义
      if (!customers || customers.length === 0) {
        // 显示无数据提示
        if (this.tableBody) {
          this.tableBody.innerHTML = '<tr><td colspan="8" class="text-center">暂无客户数据</td></tr>';
        }
        this.showToast('客户列表为空，请先添加客户', 'info');
        return; // 提前返回，不初始化DataTable
      }
      
      // 为每个客户更新会员状态
      await this.updateCustomersMembershipStatus(customers);
      
      // 渲染表格
      this.renderCustomerTable(customers);
      
      // 初始化DataTable (只有在有数据时才初始化)
      if ($.fn.DataTable && !$.fn.DataTable.isDataTable('#customerTable')) {
        $('#customerTable').DataTable({
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
          responsive: true
        });
      }
    } catch (error) {
      console.error('加载客户列表出错:', error);
      this.showToast('加载客户列表出错，请刷新页面重试。', 'danger');
      
      // 在出错时显示友好的错误提示
      if (this.tableBody) {
        this.tableBody.innerHTML = '<tr><td colspan="8" class="text-center text-danger">加载客户数据失败，请刷新页面重试</td></tr>';
      }
    }
  }
  
  /**
   * 更新客户的会员卡状态
   * @param {Array} customers 客户数组
   */
  async updateCustomersMembershipStatus(customers) {
    if (!customers || customers.length === 0) return;
    
    try {
      // 为每个客户并行获取会员卡信息并更新状态
      const updatePromises = customers.map(async (customer) => {
        try {
          // 获取客户会员卡
          const customerId = customer._id || customer.id;
          const response = await dataService.getCustomerMemberships(customerId);
          
          // 处理不同的响应格式，获取会员卡数组
          let memberships = [];
          if (Array.isArray(response)) {
            memberships = response;
          } else if (response.data && Array.isArray(response.data)) {
            memberships = response.data;
          } else if (response.memberships && Array.isArray(response.memberships)) {
            memberships = response.memberships;
          }
          
          // 如果没有会员卡，将状态设为none
          if (memberships.length === 0) {
            customer.membershipStatus = 'none';
            return;
          }
          
          // 检查会员卡状态
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
                  expiredFound = true;
                } else if (expiryDate < expiringThreshold) {
                  // 即将过期
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
          if (activeFound) {
            customer.membershipStatus = 'active';
          } else if (expiringFound) {
            customer.membershipStatus = 'expiring';
          } else if (expiredFound) {
            customer.membershipStatus = 'expired';
          } else {
            customer.membershipStatus = 'none';
          }
        } catch (error) {
          console.error(`获取客户(ID: ${customer._id || customer.id})的会员卡信息失败:`, error);
          // 如果获取会员卡失败，保持原有状态
        }
      });
      
      // 等待所有客户的会员卡信息更新完成
      await Promise.all(updatePromises);
    } catch (error) {
      console.error('更新客户会员卡状态失败:', error);
    }
  }
  
  /**
   * 渲染客户表格
   * @param {Array} customers 客户数组
   */
  renderCustomerTable(customers) {
    if (!this.tableBody) return;
    
    // 清空表格内容
    this.tableBody.innerHTML = '';
    
    // 确保customers是有效的数组
    if (!customers || !Array.isArray(customers) || customers.length === 0) {
      const noDataRow = document.createElement('tr');
      noDataRow.innerHTML = '<td colspan="8" class="text-center">暂无客户数据</td>';
      this.tableBody.appendChild(noDataRow);
      console.log('客户列表为空，显示无数据行');
      return;
    }
    
    // 遍历客户数据，创建表格行
    customers.forEach(customer => {
      try {
        // 检查客户对象是否有效
        if (!customer || typeof customer !== 'object') {
          console.warn('跳过无效的客户记录:', customer);
          return;
        }
        
        const row = document.createElement('tr');
        
        // 确保获取正确的客户ID格式
        const customerId = customer._id || customer.id || '';
        if (!customerId) {
          console.warn('客户记录缺少ID:', customer);
        }
        
        // 生成年龄显示
        let age = '未知';
        if (customer.childAge) {
          age = `${customer.childAge}岁`;
        } else if (customer.childBirthdate) {
          age = this.calculateAge(customer.childBirthdate);
        }
        
        // 生成会员状态标签
        let statusBadge = '<span class="badge bg-secondary">无会员</span>';
        if (customer.membershipStatus === 'active') {
          statusBadge = '<span class="badge bg-success">有效</span>';
        } else if (customer.membershipStatus === 'expired') {
          statusBadge = '<span class="badge bg-danger">已过期</span>';
        } else if (customer.membershipStatus === 'expiring') {
          statusBadge = '<span class="badge bg-warning text-dark">即将到期</span>';
        }
        
        const childName = customer.childName || '未命名';
        const parentName = customer.parentName || '未知';
        const phone = customer.phone || '未知';
        const createdAt = customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : '未知日期';
        const gender = customer.childGender === 'male' ? '男' : (customer.childGender === 'female' ? '女' : '未知');
        
        row.innerHTML = `
          <td><a href="customer-detail.html?id=${customerId}">${childName}</a></td>
          <td>${age}</td>
          <td>${gender}</td>
          <td>${parentName}</td>
          <td>${phone}</td>
          <td>${createdAt}</td>
          <td>${statusBadge}</td>
          <td>
            <div class="btn-group btn-group-sm">
              <a href="customer-detail.html?id=${customerId}" class="btn btn-outline-primary">查看</a>
              <a href="service-add.html?customer_id=${customerId}" class="btn btn-outline-success">服务</a>
              <button type="button" class="btn btn-outline-secondary dropdown-toggle dropdown-toggle-split" data-bs-toggle="dropdown" aria-expanded="false">
                <span class="visually-hidden">更多</span>
              </button>
              <ul class="dropdown-menu">
                <li><a class="dropdown-item" href="customer-edit.html?id=${customerId}">编辑信息</a></li>
                <li><a class="dropdown-item" href="membership-add.html?customer_id=${customerId}">办理会员</a></li>
                <li><hr class="dropdown-divider"></li>
                <li><a class="dropdown-item text-danger" href="#" data-bs-toggle="modal" data-bs-target="#deleteCustomerModal" data-customer-id="${customerId}" data-customer-name="${childName}">删除客户</a></li>
              </ul>
            </div>
          </td>
        `;
        
        this.tableBody.appendChild(row);
      } catch (error) {
        console.error('创建客户行时出错:', error, customer);
      }
    });
    
    // 检查是否成功添加了任何行
    if (this.tableBody.children.length === 0) {
      const noDataRow = document.createElement('tr');
      noDataRow.innerHTML = '<td colspan="8" class="text-center">客户数据处理出错，请刷新页面重试</td>';
      this.tableBody.appendChild(noDataRow);
    }
  }
  
  /**
   * 计算年龄
   * @param {string} birthdate 出生日期字符串
   * @returns {string} 年龄，如 "5岁"
   */
  calculateAge(birthdate) {
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
}

// 初始化客户列表页面
document.addEventListener('DOMContentLoaded', () => {
  new CustomerList();
});

export default CustomerList; 