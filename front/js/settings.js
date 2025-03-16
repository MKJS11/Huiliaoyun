// 全局变量
const API_URL = 'http://localhost:5201/api';
let serviceItems = [];
let membershipTypes = [];

// DOM加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
  // 加载服务项目和会员卡类型数据
  loadServiceItems();
  loadMembershipTypes();
  
  // 注册事件监听器
  registerEventListeners();
  
  // 根据卡类型显示/隐藏相关字段
  handleCardTypeVisibility();
});

// 注册事件监听器
function registerEventListeners() {
  // 服务项目保存按钮
  document.getElementById('saveServiceItemBtn').addEventListener('click', saveServiceItem);
  
  // 服务项目更新按钮
  document.getElementById('updateServiceItemBtn').addEventListener('click', updateServiceItem);
  
  // 会员卡类型保存按钮
  document.getElementById('saveCardTypeBtn').addEventListener('click', saveCardType);
  
  // 会员卡类型更新按钮
  document.getElementById('updateCardTypeBtn').addEventListener('click', updateCardType);
  
  // 卡类型选择变化时
  document.getElementById('cardTypeCategory').addEventListener('change', handleCardTypeVisibility);
  document.getElementById('editCardTypeCategory').addEventListener('change', handleEditCardTypeVisibility);
}

// 加载服务项目列表
async function loadServiceItems() {
  try {
    const response = await fetch(`${API_URL}/settings/service-items`);
    const data = await response.json();
    
    if (data.success) {
      serviceItems = data.data;
      renderServiceItems();
    } else {
      showAlert('error', '加载服务项目失败');
    }
  } catch (error) {
    console.error('加载服务项目出错:', error);
    showAlert('error', '加载服务项目失败');
  }
}

// 渲染服务项目列表
function renderServiceItems() {
  const tbody = document.getElementById('serviceItemsList');
  tbody.innerHTML = '';
  
  serviceItems.forEach(item => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.name}</td>
      <td>${item.price.toFixed(2)}</td>
      <td>${item.description || ''}</td>
      <td>
        <button class="btn btn-sm btn-info edit-service-item" data-id="${item._id}">
          <i class="bi bi-pencil"></i>
        </button>
        <button class="btn btn-sm btn-danger delete-service-item" data-id="${item._id}">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  
  // 添加编辑按钮事件
  document.querySelectorAll('.edit-service-item').forEach(btn => {
    btn.addEventListener('click', editServiceItem);
  });
  
  // 添加删除按钮事件
  document.querySelectorAll('.delete-service-item').forEach(btn => {
    btn.addEventListener('click', deleteServiceItem);
  });
}

// 保存服务项目
async function saveServiceItem() {
  const name = document.getElementById('serviceItemName').value;
  const price = document.getElementById('serviceItemPrice').value;
  const description = document.getElementById('serviceItemDescription').value;
  
  if (!name || !price) {
    showAlert('error', '请填写项目名称和价格');
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/settings/service-items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name,
        price: parseFloat(price),
        description
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      const modal = bootstrap.Modal.getInstance(document.getElementById('addServiceItemModal'));
      modal.hide();
      document.getElementById('addServiceItemForm').reset();
      showAlert('success', '添加服务项目成功');
      loadServiceItems();
    } else {
      showAlert('error', data.message || '添加服务项目失败');
    }
  } catch (error) {
    console.error('添加服务项目出错:', error);
    showAlert('error', '添加服务项目失败');
  }
}

// 编辑服务项目
function editServiceItem(e) {
  const id = e.currentTarget.dataset.id;
  const item = serviceItems.find(item => item._id === id);
  
  if (item) {
    document.getElementById('editServiceItemId').value = item._id;
    document.getElementById('editServiceItemName').value = item.name;
    document.getElementById('editServiceItemPrice').value = item.price;
    document.getElementById('editServiceItemDescription').value = item.description || '';
    
    const modal = new bootstrap.Modal(document.getElementById('editServiceItemModal'));
    modal.show();
  }
}

// 更新服务项目
async function updateServiceItem() {
  const id = document.getElementById('editServiceItemId').value;
  const name = document.getElementById('editServiceItemName').value;
  const price = document.getElementById('editServiceItemPrice').value;
  const description = document.getElementById('editServiceItemDescription').value;
  
  if (!name || !price) {
    showAlert('error', '请填写项目名称和价格');
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/settings/service-items/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name,
        price: parseFloat(price),
        description
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      const modal = bootstrap.Modal.getInstance(document.getElementById('editServiceItemModal'));
      modal.hide();
      showAlert('success', '更新服务项目成功');
      loadServiceItems();
    } else {
      showAlert('error', data.message || '更新服务项目失败');
    }
  } catch (error) {
    console.error('更新服务项目出错:', error);
    showAlert('error', '更新服务项目失败');
  }
}

// 删除服务项目
async function deleteServiceItem(e) {
  if (!confirm('确定要删除这个服务项目吗？')) {
    return;
  }
  
  const id = e.currentTarget.dataset.id;
  
  try {
    const response = await fetch(`${API_URL}/settings/service-items/${id}`, {
      method: 'DELETE'
    });
    
    const data = await response.json();
    
    if (data.success) {
      showAlert('success', '删除服务项目成功');
      loadServiceItems();
    } else {
      showAlert('error', data.message || '删除服务项目失败');
    }
  } catch (error) {
    console.error('删除服务项目出错:', error);
    showAlert('error', '删除服务项目失败');
  }
}

// 加载会员卡类型列表
async function loadMembershipTypes() {
  try {
    const response = await fetch(`${API_URL}/settings/membership-types`);
    const data = await response.json();
    
    if (data.success) {
      membershipTypes = data.data;
      renderMembershipTypes();
    } else {
      showAlert('error', '加载会员卡类型失败');
    }
  } catch (error) {
    console.error('加载会员卡类型出错:', error);
    showAlert('error', '加载会员卡类型失败');
  }
}

// 渲染会员卡类型列表
function renderMembershipTypes() {
  const tbody = document.getElementById('cardTypesList');
  tbody.innerHTML = '';
  
  membershipTypes.forEach(type => {
    const tr = document.createElement('tr');
    
    // 转换卡类型显示
    let categoryText = '';
    switch (type.category) {
      case 'value':
        categoryText = '储值卡';
        break;
      case 'count':
        categoryText = '次卡';
        break;
      case 'period':
        categoryText = '期限卡';
        break;
      case 'mixed':
        categoryText = '混合卡';
        break;
      default:
        categoryText = '未知';
    }
    
    tr.innerHTML = `
      <td>${type.name}</td>
      <td>${categoryText}</td>
      <td>${type.price.toFixed(2)}</td>
      <td>${type.serviceCount}</td>
      <td>${type.validityDays}</td>
      <td>
        <button class="btn btn-sm btn-info edit-card-type" data-id="${type._id}">
          <i class="bi bi-pencil"></i>
        </button>
        <button class="btn btn-sm btn-danger delete-card-type" data-id="${type._id}">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  
  // 添加编辑按钮事件
  document.querySelectorAll('.edit-card-type').forEach(btn => {
    btn.addEventListener('click', editCardType);
  });
  
  // 添加删除按钮事件
  document.querySelectorAll('.delete-card-type').forEach(btn => {
    btn.addEventListener('click', deleteCardType);
  });
}

// 根据卡类型显示/隐藏相关字段
function handleCardTypeVisibility() {
  const cardType = document.getElementById('cardTypeCategory').value;
  const valueAmountGroup = document.getElementById('valueAmountGroup');
  const serviceCountGroup = document.getElementById('serviceCountGroup');
  
  if (cardType === 'value' || cardType === 'mixed') {
    valueAmountGroup.style.display = 'block';
  } else {
    valueAmountGroup.style.display = 'none';
  }
  
  if (cardType === 'count' || cardType === 'mixed') {
    serviceCountGroup.style.display = 'block';
  } else {
    serviceCountGroup.style.display = 'none';
  }
}

// 编辑时根据卡类型显示/隐藏相关字段
function handleEditCardTypeVisibility() {
  const cardType = document.getElementById('editCardTypeCategory').value;
  const valueAmountGroup = document.getElementById('editValueAmountGroup');
  const serviceCountGroup = document.getElementById('editServiceCountGroup');
  
  if (cardType === 'value' || cardType === 'mixed') {
    valueAmountGroup.style.display = 'block';
  } else {
    valueAmountGroup.style.display = 'none';
  }
  
  if (cardType === 'count' || cardType === 'mixed') {
    serviceCountGroup.style.display = 'block';
  } else {
    serviceCountGroup.style.display = 'none';
  }
}

// 保存会员卡类型
async function saveCardType() {
  const name = document.getElementById('cardTypeName').value;
  const category = document.getElementById('cardTypeCategory').value;
  const price = document.getElementById('cardTypePrice').value;
  const validityDays = document.getElementById('validityDays').value;
  const description = document.getElementById('cardTypeDescription').value;
  
  // 根据卡类型获取额外字段
  let valueAmount = 0;
  let serviceCount = 0;
  
  if (category === 'value' || category === 'mixed') {
    valueAmount = document.getElementById('valueAmount').value;
  }
  
  if (category === 'count' || category === 'mixed') {
    serviceCount = document.getElementById('serviceCount').value;
  }
  
  if (!name || !category || !price || !validityDays) {
    showAlert('error', '请填写必填项');
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/settings/membership-types`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name,
        category,
        price: parseFloat(price),
        valueAmount: parseFloat(valueAmount) || 0,
        serviceCount: parseInt(serviceCount) || 0,
        validityDays: parseInt(validityDays),
        description
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      const modal = bootstrap.Modal.getInstance(document.getElementById('addCardTypeModal'));
      modal.hide();
      document.getElementById('addCardTypeForm').reset();
      showAlert('success', '添加会员卡类型成功');
      loadMembershipTypes();
    } else {
      showAlert('error', data.message || '添加会员卡类型失败');
    }
  } catch (error) {
    console.error('添加会员卡类型出错:', error);
    showAlert('error', '添加会员卡类型失败');
  }
}

// 编辑会员卡类型
function editCardType(e) {
  const id = e.currentTarget.dataset.id;
  const type = membershipTypes.find(type => type._id === id);
  
  if (type) {
    document.getElementById('editCardTypeId').value = type._id;
    document.getElementById('editCardTypeName').value = type.name;
    document.getElementById('editCardTypeCategory').value = type.category;
    document.getElementById('editCardTypePrice').value = type.price;
    document.getElementById('editValueAmount').value = type.valueAmount || 0;
    document.getElementById('editServiceCount').value = type.serviceCount || 0;
    document.getElementById('editValidityDays').value = type.validityDays;
    document.getElementById('editCardTypeDescription').value = type.description || '';
    
    // 更新显示/隐藏状态
    handleEditCardTypeVisibility();
    
    const modal = new bootstrap.Modal(document.getElementById('editCardTypeModal'));
    modal.show();
  }
}

// 更新会员卡类型
async function updateCardType() {
  const id = document.getElementById('editCardTypeId').value;
  const name = document.getElementById('editCardTypeName').value;
  const category = document.getElementById('editCardTypeCategory').value;
  const price = document.getElementById('editCardTypePrice').value;
  const validityDays = document.getElementById('editValidityDays').value;
  const description = document.getElementById('editCardTypeDescription').value;
  
  // 根据卡类型获取额外字段
  let valueAmount = 0;
  let serviceCount = 0;
  
  if (category === 'value' || category === 'mixed') {
    valueAmount = document.getElementById('editValueAmount').value;
  }
  
  if (category === 'count' || category === 'mixed') {
    serviceCount = document.getElementById('editServiceCount').value;
  }
  
  if (!name || !category || !price || !validityDays) {
    showAlert('error', '请填写必填项');
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/settings/membership-types/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name,
        category,
        price: parseFloat(price),
        valueAmount: parseFloat(valueAmount) || 0,
        serviceCount: parseInt(serviceCount) || 0,
        validityDays: parseInt(validityDays),
        description
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      const modal = bootstrap.Modal.getInstance(document.getElementById('editCardTypeModal'));
      modal.hide();
      showAlert('success', '更新会员卡类型成功');
      loadMembershipTypes();
    } else {
      showAlert('error', data.message || '更新会员卡类型失败');
    }
  } catch (error) {
    console.error('更新会员卡类型出错:', error);
    showAlert('error', '更新会员卡类型失败');
  }
}

// 删除会员卡类型
async function deleteCardType(e) {
  if (!confirm('确定要删除这个会员卡类型吗？')) {
    return;
  }
  
  const id = e.currentTarget.dataset.id;
  
  try {
    const response = await fetch(`${API_URL}/settings/membership-types/${id}`, {
      method: 'DELETE'
    });
    
    const data = await response.json();
    
    if (data.success) {
      showAlert('success', '删除会员卡类型成功');
      loadMembershipTypes();
    } else {
      showAlert('error', data.message || '删除会员卡类型失败');
    }
  } catch (error) {
    console.error('删除会员卡类型出错:', error);
    showAlert('error', '删除会员卡类型失败');
  }
}

// 显示提示消息
function showAlert(type, message) {
  const toastContainer = document.getElementById('toastContainer');
  if (!toastContainer) return;
  
  const toast = document.createElement('div');
  toast.className = `toast align-items-center text-white bg-${type === 'success' ? 'success' : 'danger'} border-0`;
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