/**
 * 医师管理模块
 */
import dataService from '../../services/data-service.js';
import { showToast, formatDate, formatCurrency } from '../../utils/ui-utils.js';

class TherapistManager {
  constructor() {
    // 初始化属性
    this.therapists = [];
    this.currentTherapist = null;
    this.deleteTherapistId = null;
    
    // DOM元素
    this.therapistsTable = document.getElementById('therapistsTable');
    this.therapistForm = document.getElementById('therapistForm');
    this.addTherapistButton = document.getElementById('addTherapistButton');
    this.saveTherapistButton = document.getElementById('saveTherapistButton');
    this.confirmDeleteButton = document.getElementById('confirmDeleteButton');
    this.editTherapistDetailButton = document.getElementById('editTherapistDetailButton');
    this.searchInput = document.getElementById('searchInput');
    this.searchButton = document.getElementById('searchButton');
    
    // 绑定方法
    this.init = this.init.bind(this);
    this.loadTherapists = this.loadTherapists.bind(this);
    this.loadTherapistStats = this.loadTherapistStats.bind(this);
    this.renderTherapistList = this.renderTherapistList.bind(this);
    this.showAddTherapistModal = this.showAddTherapistModal.bind(this);
    this.showEditTherapistModal = this.showEditTherapistModal.bind(this);
    this.showDeleteConfirmModal = this.showDeleteConfirmModal.bind(this);
    this.showTherapistDetailModal = this.showTherapistDetailModal.bind(this);
    this.saveTherapist = this.saveTherapist.bind(this);
    this.deleteTherapist = this.deleteTherapist.bind(this);
    this.searchTherapists = this.searchTherapists.bind(this);
    this.setupEventListeners = this.setupEventListeners.bind(this);
  }
  
  /**
   * 初始化模块
   */
  async init() {
    try {
      // 设置事件监听
      this.setupEventListeners();
      
      // 加载医师数据
      await this.loadTherapists();
      
      // 加载医师统计数据
      await this.loadTherapistStats();
      
    } catch (error) {
      console.error('医师管理模块初始化失败:', error);
      showToast('加载医师数据失败，请刷新页面重试', 'danger');
    }
  }
  
  /**
   * 设置事件监听
   */
  setupEventListeners() {
    // 添加医师按钮点击事件
    this.addTherapistButton.addEventListener('click', this.showAddTherapistModal);
    
    // 保存医师按钮点击事件
    this.saveTherapistButton.addEventListener('click', this.saveTherapist);
    
    // 确认删除按钮点击事件
    this.confirmDeleteButton.addEventListener('click', this.deleteTherapist);
    
    // 编辑医师详情按钮点击事件
    this.editTherapistDetailButton.addEventListener('click', () => {
      if (this.currentTherapist) {
        $('#therapistDetailModal').modal('hide');
        this.showEditTherapistModal(this.currentTherapist);
      }
    });
    
    // 搜索按钮点击事件
    this.searchButton.addEventListener('click', this.searchTherapists);
    
    // 搜索输入框回车事件
    this.searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.searchTherapists();
      }
    });
  }
  
  /**
   * 加载医师数据
   */
  async loadTherapists() {
    try {
      const response = await dataService.getAllTherapists();
      this.therapists = response.data || [];
      this.renderTherapistList(this.therapists);
      
      // 更新医师总数
      document.getElementById('totalTherapistsCount').textContent = this.therapists.length;
      
      return this.therapists;
    } catch (error) {
      console.error('获取医师列表失败:', error);
      showToast('获取医师列表失败:' + (error.message || '服务器错误'), 'danger');
      return [];
    }
  }
  
  /**
   * 加载医师统计数据
   */
  async loadTherapistStats() {
    try {
      // 初始化统计值
      let totalMonthlyServices = 0;
      let totalMonthlyRevenue = 0;
      let totalRating = 0;
      let ratedCount = 0;
      
      // 更新医师总数
      document.getElementById('totalTherapistsCount').textContent = this.therapists.length;
      
      // 如果有医师数据，则获取每个医师的统计数据并汇总
      if (this.therapists && this.therapists.length > 0) {
        console.log('开始获取医师统计数据，医师数量:', this.therapists.length);
        
        try {
          // 为每个医师创建一个获取统计数据的Promise
          const statsPromises = this.therapists.map(therapist => {
            // 使用Promise.resolve包装，确保一个医师的请求失败不会影响整体
            return Promise.resolve()
              .then(() => dataService.getTherapistStats(therapist._id))
              .catch(err => {
                console.error(`获取医师(${therapist.name}, ID: ${therapist._id})统计数据失败:`, err);
                // 返回默认的空数据对象
                return { 
                  success: false, 
                  data: { 
                    serviceCount: 0, 
                    revenue: 0, 
                    avgRating: 0 
                  } 
                };
              });
          });
          
          // 等待所有请求完成
          const statsResults = await Promise.all(statsPromises);
          console.log('获取到所有医师统计数据:', statsResults);
          
          // 汇总统计数据
          statsResults.forEach((result, index) => {
            try {
              if (result && result.data) {
                const therapist = this.therapists[index];
                console.log(`处理医师(${therapist?.name || '未知'})统计数据:`, result.data);
                
                // 获取并转换数据，确保类型正确
                const serviceCount = parseInt(result.data.serviceCount) || 0;
                const revenue = parseFloat(result.data.revenue) || 0;
                const avgRating = parseFloat(result.data.avgRating) || 0;
                
                totalMonthlyServices += serviceCount;
                totalMonthlyRevenue += revenue;
                
                if (avgRating > 0) {
                  totalRating += avgRating;
                  ratedCount++;
                }
              }
            } catch (err) {
              console.error('处理医师统计数据时出错:', err);
            }
          });
        } catch (allStatsError) {
          console.error('获取所有医师统计数据失败:', allStatsError);
        }
      }
      
      // 计算平均评分
      const avgRating = ratedCount > 0 ? totalRating / ratedCount : 0;
      
      // 更新统计卡片
      document.getElementById('monthlyServicesCount').textContent = totalMonthlyServices;
      document.getElementById('monthlyRevenue').textContent = formatCurrency(totalMonthlyRevenue);
      document.getElementById('averageRating').textContent = avgRating.toFixed(1);
      
      console.log('医师统计数据汇总完成:', {
        医师总数: this.therapists.length,
        服务总次数: totalMonthlyServices,
        总营收: totalMonthlyRevenue,
        平均评分: avgRating.toFixed(1)
      });
    } catch (error) {
      console.error('加载医师统计数据失败:', error);
      // 显示默认值
      document.getElementById('totalTherapistsCount').textContent = this.therapists.length || 0;
      document.getElementById('monthlyServicesCount').textContent = 0;
      document.getElementById('monthlyRevenue').textContent = '¥0';
      document.getElementById('averageRating').textContent = '0.0';
      
      showToast('加载医师统计数据失败: ' + (error.message || '未知错误'), 'warning');
    }
  }
  
  /**
   * 渲染医师列表
   * @param {Array} therapists 医师数组
   */
  renderTherapistList(therapists) {
    const tableBody = this.therapistsTable.querySelector('tbody');
    tableBody.innerHTML = '';
    
    if (therapists.length === 0) {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td colspan="9" class="text-center py-4">
          <div class="text-muted">暂无医师数据</div>
          <button class="btn btn-sm btn-primary mt-2" id="emptyAddTherapistButton">
            <i class="bi bi-plus-circle me-1"></i> 添加第一位医师
          </button>
        </td>
      `;
      tableBody.appendChild(row);
      
      // 添加空列表添加按钮事件
      document.getElementById('emptyAddTherapistButton').addEventListener('click', this.showAddTherapistModal);
      return;
    }
    
    therapists.forEach((therapist, index) => {
      const row = document.createElement('tr');
      
      // 处理专长显示
      let specialtiesDisplay = '无';
      if (therapist.specialties && therapist.specialties.length > 0) {
        specialtiesDisplay = therapist.specialties.join(', ');
        if (specialtiesDisplay.length > 20) {
          specialtiesDisplay = specialtiesDisplay.substring(0, 20) + '...';
        }
      }
      
      // 处理评分显示
      let ratingDisplay = '无评分';
      if (therapist.avgRating > 0) {
        ratingDisplay = `
          <span class="text-warning">
            ${this.renderStars(therapist.avgRating)}
          </span>
          <small class="text-muted">(${therapist.avgRating.toFixed(1)})</small>
        `;
      }
      
      // 处理状态显示
      const statusClass = therapist.isActive ? 'bg-success' : 'bg-secondary';
      const statusText = therapist.isActive ? '活跃' : '非活跃';
      
      row.innerHTML = `
        <td>${index + 1}</td>
        <td>
          <div class="d-flex align-items-center">
            <img src="${therapist.photoUrl || 'images/default-avatar.png'}" alt="${therapist.name}" class="rounded-circle me-2" width="32" height="32" style="object-fit: cover;">
            <div>${therapist.name}</div>
          </div>
        </td>
        <td>${therapist.title || '未设置'}</td>
        <td>${specialtiesDisplay}</td>
        <td>${therapist.experience || 0}年</td>
        <td>${therapist.phone}</td>
        <td>${ratingDisplay}</td>
        <td><span class="badge ${statusClass}">${statusText}</span></td>
        <td>
          <button class="btn btn-sm btn-outline-primary view-btn" data-id="${therapist._id}">
            <i class="bi bi-eye"></i>
          </button>
          <button class="btn btn-sm btn-outline-warning edit-btn" data-id="${therapist._id}">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${therapist._id}" data-name="${therapist.name}">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      `;
      
      tableBody.appendChild(row);
    });
    
    // 添加按钮事件
    tableBody.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const therapist = this.therapists.find(t => t._id === id);
        if (therapist) {
          this.showTherapistDetailModal(therapist);
        }
      });
    });
    
    tableBody.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const therapist = this.therapists.find(t => t._id === id);
        if (therapist) {
          this.showEditTherapistModal(therapist);
        }
      });
    });
    
    tableBody.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const name = btn.getAttribute('data-name');
        this.showDeleteConfirmModal(id, name);
      });
    });
  }
  
  /**
   * 渲染星级评分
   * @param {Number} rating 评分
   * @returns {String} 星级HTML
   */
  renderStars(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    
    let starsHTML = '';
    
    // 实心星
    for (let i = 0; i < fullStars; i++) {
      starsHTML += '<i class="bi bi-star-fill"></i>';
    }
    
    // 半星
    if (halfStar) {
      starsHTML += '<i class="bi bi-star-half"></i>';
    }
    
    // 空星
    for (let i = 0; i < emptyStars; i++) {
      starsHTML += '<i class="bi bi-star"></i>';
    }
    
    return starsHTML;
  }
  
  /**
   * 显示添加医师模态框
   */
  showAddTherapistModal() {
    // 重置表单
    this.therapistForm.reset();
    
    // 清空隐藏ID字段
    document.getElementById('therapistId').value = '';
    
    // 设置模态框标题
    document.getElementById('therapistModalLabel').textContent = '添加医师';
    
    // 显示模态框
    $('#therapistModal').modal('show');
  }
  
  /**
   * 显示编辑医师模态框
   * @param {Object} therapist 医师对象
   */
  showEditTherapistModal(therapist) {
    // 设置表单值
    document.getElementById('therapistId').value = therapist._id;
    document.getElementById('name').value = therapist.name;
    document.getElementById('gender').value = therapist.gender;
    document.getElementById('phone').value = therapist.phone;
    document.getElementById('title').value = therapist.title || '';
    document.getElementById('specialties').value = therapist.specialties ? therapist.specialties.join(', ') : '';
    document.getElementById('experience').value = therapist.experience || 0;
    document.getElementById('photoUrl').value = therapist.photoUrl || '';
    document.getElementById('description').value = therapist.description || '';
    document.getElementById('isActive').checked = therapist.isActive !== false;
    
    // 设置模态框标题
    document.getElementById('therapistModalLabel').textContent = '编辑医师';
    
    // 显示模态框
    $('#therapistModal').modal('show');
  }
  
  /**
   * 显示医师详情模态框
   * @param {Object} therapist 医师对象
   */
  async showTherapistDetailModal(therapist) {
    this.currentTherapist = therapist;
    console.log(`显示医师(${therapist.name}, ID: ${therapist._id})详情`);
    
    // 设置基本信息
    document.getElementById('detailName').textContent = therapist.name;
    document.getElementById('detailTitle').textContent = therapist.title || '未设置职称';
    document.getElementById('detailPhotoUrl').src = therapist.photoUrl || 'images/default-avatar.png';
    document.getElementById('detailPhotoUrl').onerror = function() {
      this.src = 'images/default-avatar.png'; // 图片加载失败时显示默认头像
    };
    
    // 设置性别
    let genderText = '未知';
    if (therapist.gender === 'male') genderText = '男';
    else if (therapist.gender === 'female') genderText = '女';
    else if (therapist.gender === 'other') genderText = '其他';
    document.getElementById('detailGender').textContent = genderText;
    
    // 设置其他信息
    document.getElementById('detailPhone').textContent = therapist.phone || '未设置';
    document.getElementById('detailExperience').textContent = (therapist.experience || 0) + '年';
    document.getElementById('detailSpecialties').textContent = therapist.specialties && therapist.specialties.length > 0 
      ? therapist.specialties.join('，') 
      : '未设置专长';
    document.getElementById('detailDescription').textContent = therapist.description || '暂无简介';
    
    // 设置状态
    const detailStatus = document.getElementById('detailStatus');
    if (therapist.isActive !== false) {
      detailStatus.textContent = '活跃';
      detailStatus.className = 'badge bg-success ms-1';
    } else {
      detailStatus.textContent = '非活跃';
      detailStatus.className = 'badge bg-secondary ms-1';
    }
    
    // 设置评分
    const detailRating = document.getElementById('detailRating');
    if (therapist.avgRating > 0) {
      detailRating.innerHTML = `<i class="bi bi-star-fill"></i> ${therapist.avgRating.toFixed(1)}`;
      detailRating.className = 'badge bg-warning text-dark';
    } else {
      detailRating.innerHTML = '<i class="bi bi-star"></i> 无评分';
      detailRating.className = 'badge bg-light text-dark';
    }
    
    // 显示模态框
    $('#therapistDetailModal').modal('show');
    
    // 显示统计数据加载状态
    document.getElementById('detailMonthlyServices').innerHTML = '<i class="spinner-border spinner-border-sm"></i>';
    document.getElementById('detailMonthlyRevenue').innerHTML = '<i class="spinner-border spinner-border-sm"></i>';
    document.getElementById('detailWorkHours').innerHTML = '<i class="spinner-border spinner-border-sm"></i>';
    document.getElementById('detailAvgRating').innerHTML = '<i class="spinner-border spinner-border-sm"></i>';
    
    try {
      // 从API获取医师统计数据
      console.log(`正在获取医师(${therapist.name}, ID: ${therapist._id})详细统计数据`);
      const response = await dataService.getTherapistStats(therapist._id);
      console.log('获取到医师详情统计数据:', response);
      
      // 提取统计数据
      const stats = response.data || {
        serviceCount: 0,
        revenue: 0,
        workHours: 0,
        avgRating: 0
      };
      
      // 获取正确的数据字段并设置默认值
      const serviceCount = parseInt(stats.serviceCount) || 0;
      const revenue = parseFloat(stats.revenue) || 0;
      const workHours = parseFloat(stats.workHours || stats.totalHours || 0);
      const avgRating = parseFloat(stats.avgRating) || 0;
      
      // 更新统计数据
      document.getElementById('detailMonthlyServices').textContent = serviceCount + '次';
      document.getElementById('detailMonthlyRevenue').textContent = formatCurrency(revenue);
      document.getElementById('detailWorkHours').textContent = workHours + '小时';
      document.getElementById('detailAvgRating').textContent = avgRating.toFixed(1) + ' / 5';
      
      console.log('医师详情统计数据加载成功:', {
        服务次数: serviceCount,
        营收: revenue,
        工作时长: workHours,
        评分: avgRating
      });
    } catch (error) {
      console.error(`获取医师(${therapist.name})统计数据失败:`, error);
      
      // 显示错误状态
      document.getElementById('detailMonthlyServices').innerHTML = '<span class="text-muted">未获取到数据</span>';
      document.getElementById('detailMonthlyRevenue').innerHTML = '<span class="text-muted">未获取到数据</span>';
      document.getElementById('detailWorkHours').innerHTML = '<span class="text-muted">未获取到数据</span>';
      document.getElementById('detailAvgRating').innerHTML = '<span class="text-muted">未获取到数据</span>';
      
      // 显示错误提示
      showToast('获取医师统计数据失败：' + (error.message || '未知错误'), 'warning');
    }
  }
  
  /**
   * 显示删除确认模态框
   * @param {String} id 医师ID
   * @param {String} name 医师姓名
   */
  showDeleteConfirmModal(id, name) {
    this.deleteTherapistId = id;
    document.getElementById('deleteTherapistName').textContent = name;
    $('#deleteConfirmModal').modal('show');
  }
  
  /**
   * 保存医师
   */
  async saveTherapist() {
    try {
      // 验证表单
      if (!this.therapistForm.checkValidity()) {
        this.therapistForm.reportValidity();
        return;
      }
      
      // 手动验证手机号格式
      const phone = document.getElementById('phone').value.trim();
      const phoneRegex = /^1[3-9]\d{9}$/;
      if (!phoneRegex.test(phone)) {
        showToast('请输入有效的11位手机号码', 'warning');
        document.getElementById('phone').focus();
        return;
      }
      
      // 收集表单数据
      const formData = {
        name: document.getElementById('name').value.trim(),
        gender: document.getElementById('gender').value,
        phone: phone,
        title: document.getElementById('title').value.trim(),
        specialties: document.getElementById('specialties').value ? 
          document.getElementById('specialties').value.split(',').map(s => s.trim()).filter(s => s) : 
          [],
        experience: parseInt(document.getElementById('experience').value) || 0,
        photoUrl: document.getElementById('photoUrl').value.trim(),
        description: document.getElementById('description').value.trim(),
        isActive: document.getElementById('isActive').checked
      };
      
      // 调试日志
      console.log('提交的医师数据:', formData);
      
      // 获取医师ID (如果有)
      const therapistId = document.getElementById('therapistId').value;
      
      let response;
      let successMessage;
      
      if (therapistId) {
        // 更新现有医师
        response = await dataService.updateTherapist(therapistId, formData);
        successMessage = '医师信息已成功更新';
      } else {
        // 创建新医师
        response = await dataService.createTherapist(formData);
        successMessage = '医师已成功添加';
      }
      
      // 调试日志
      console.log('服务器响应:', response);
      
      if (response.success) {
        // 关闭模态框
        $('#therapistModal').modal('hide');
        
        // 重新加载医师列表
        await this.loadTherapists();
        
        // 显示成功消息
        showToast(successMessage, 'success');
      } else {
        // 显示详细错误信息
        showToast(response.message || '保存失败，请检查输入数据', 'danger');
      }
    } catch (error) {
      console.error('保存医师失败:', error);
      showToast('保存医师失败:' + (error.message || '服务器错误'), 'danger');
    }
  }
  
  /**
   * 删除医师
   */
  async deleteTherapist() {
    if (!this.deleteTherapistId) return;
    
    try {
      const response = await dataService.deleteTherapist(this.deleteTherapistId);
      
      // 关闭模态框
      $('#deleteConfirmModal').modal('hide');
      
      if (response.success) {
        // 重新加载医师列表
        await this.loadTherapists();
        
        // 显示成功消息
        showToast(response.message || '医师已成功删除', 'success');
      } else {
        showToast(response.message || '删除失败', 'danger');
      }
    } catch (error) {
      console.error('删除医师失败:', error);
      showToast('删除医师失败:' + (error.message || '服务器错误'), 'danger');
      
      // 关闭模态框
      $('#deleteConfirmModal').modal('hide');
    }
  }
  
  /**
   * 搜索医师
   */
  searchTherapists() {
    const searchText = this.searchInput.value.trim().toLowerCase();
    
    if (!searchText) {
      // 如果搜索框为空，显示所有医师
      this.renderTherapistList(this.therapists);
      return;
    }
    
    // 筛选符合条件的医师
    const filteredTherapists = this.therapists.filter(therapist => 
      therapist.name.toLowerCase().includes(searchText) ||
      (therapist.title && therapist.title.toLowerCase().includes(searchText)) ||
      (therapist.phone && therapist.phone.includes(searchText)) ||
      (therapist.specialties && therapist.specialties.some(s => s.toLowerCase().includes(searchText)))
    );
    
    // 渲染筛选后的列表
    this.renderTherapistList(filteredTherapists);
    
    // 显示搜索结果信息
    showToast(`找到 ${filteredTherapists.length} 个匹配的医师`, 'info');
  }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  const therapistManager = new TherapistManager();
  therapistManager.init();
});

export default TherapistManager; 