/**
 * 数据服务接口
 * 提供统一的存储接口，便于将来切换到后端API
 */

class DataService {
  /**
   * 初始化后端API连接
   */
  constructor() {
    // 后端API基础URL，根据实际部署的端口进行调整
    this.apiUrl = 'http://localhost:5201/api';
    this.token = localStorage.getItem('token');
  }
  
  /**
   * 获取请求头部，包含授权令牌
   * @returns {Object} 包含授权令牌的头部对象
   */
  getHeaders() {
    // 获取最新的令牌
    this.token = localStorage.getItem('token');
    
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }
  
  /**
   * 执行API请求
   * @param {string} url - API端点
   * @param {Object} options - 请求选项
   * @returns {Promise<Object>} 响应数据
   */
  async fetchApi(url, options = {}) {
    try {
      // 为每个请求添加认证头
      options.headers = this.getHeaders();
      options.credentials = 'include';
      
      const response = await fetch(url, options);
      
      // 如果响应状态为401（未授权），尝试重新登录
      if (response.status === 401) {
        // 清除本地存储的令牌和用户信息
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // 重定向到登录页面
        if (!window.location.pathname.includes('login.html')) {
          window.location.href = 'login.html';
          throw new Error('登录已过期，请重新登录');
        }
      }
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || '请求失败');
      }
      
      return data;
    } catch (error) {
      console.error('API请求错误:', error);
      throw error;
    }
  }
  
  /**
   * 获取所有客户列表
   * @returns {Promise<Array>} 客户数组
   */
  async getAllCustomers() {
    try {
      const response = await fetch(`${this.apiUrl}/customers`);
      // 如果响应不成功，返回空数组而不是抛出错误
      if (!response.ok) {
        console.warn(`获取客户列表失败: ${response.status}`);
        return [];
      }
      
      const result = await response.json();
      
      // 处理不同的返回数据结构
      if (Array.isArray(result)) {
        return result; // 如果直接返回数组
      } else if (result.data && Array.isArray(result.data)) {
        return result.data; // 标准响应格式
      } else if (result.success === false) {
        console.warn(`获取客户列表失败: ${result.message || '未知错误'}`);
        return [];
      } else {
        console.warn('获取客户列表返回了未知格式的数据:', result);
        return [];
      }
    } catch (error) {
      console.error('从API获取客户数据失败:', error);
      return []; // 捕获错误但返回空数组，而不是抛出错误
    }
  }
  
  /**
   * 根据ID获取客户信息
   * @param {string} id 客户ID
   * @returns {Promise<Object|null>} 客户对象或null
   */
  async getCustomerById(id) {
    if (!id) {
      throw new Error('客户ID不能为空');
    }
    
    try {
      console.log(`正在获取客户数据，ID: ${id}`);
      const url = `${this.apiUrl}/customers/${id}`;
      console.log(`请求URL: ${url}`);
      
      const response = await fetch(url);
      
      if (response.status === 404) {
        console.error(`客户不存在，ID: ${id}`);
        return null;
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`获取客户数据失败: HTTP ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log('获取客户数据成功', result);
      
      if (!result.success && !result.data) {
        throw new Error(result.message || '服务器未返回客户数据');
      }
      
      return result.data;
    } catch (error) {
      console.error(`从API获取客户(ID:${id})数据失败:`, error);
      
      // 尝试开发测试环境下的数据
      if (this.isDevelopment()) {
        return this.getMockCustomerData(id);
      }
      
      throw error;
    }
  }
  
  /**
   * 判断是否为开发环境
   * @returns {boolean}
   */
  isDevelopment() {
    return window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1';
  }
  
  /**
   * 获取测试客户数据
   * @param {string} id 客户ID
   * @returns {Object} 测试客户数据
   */
  getMockCustomerData(id) {
    console.log(`使用模拟数据，ID: ${id}`);
    return {
      _id: id,
      childName: '测试客户',
      childGender: 'male',
      childBirthdate: '2018-01-01',
      childAge: 5,
      parentName: '测试家长',
      relationship: 'father',
      phone: '13800138000',
      address: '测试地址',
      email: 'test@example.com',
      constitution: '平和质',
      mainSymptoms: '测试症状',
      allergyHistory: '无',
      familyHistory: '无',
      medicalHistory: '无',
      notes: '测试备注',
      source: 'walk_in',
      membershipStatus: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }
  
  /**
   * 添加新客户
   * @param {Object} customer 客户信息对象
   * @returns {Promise<Object>} 添加后的客户对象（包含ID）
   */
  async addCustomer(customer) {
    try {
      const response = await fetch(`${this.apiUrl}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(customer)
      });

      if (!response.ok) {
        throw new Error(`创建客户失败: ${response.status}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('向API添加客户数据失败:', error);
      throw error; // 不再降级到本地存储，直接抛出错误
    }
  }
  
  /**
   * 更新客户信息
   * @param {string} id 客户ID
   * @param {Object} customerData 要更新的客户数据
   * @returns {Promise<Object|null>} 更新后的客户对象或null
   */
  async updateCustomer(id, customerData) {
    if (!id) {
      throw new Error('客户ID不能为空');
    }
    
    try {
      console.log(`正在更新客户数据，ID: ${id}`, customerData);
      
      const response = await fetch(`${this.apiUrl}/customers/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(customerData)
      });

      // 获取响应内容
      const responseText = await response.text();
      let result;
      
      try {
        // 尝试解析JSON响应
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('响应解析失败:', parseError, '原始响应:', responseText);
        // 如果不是JSON，使用原始文本
        result = { success: false, message: responseText };
      }

      if (!response.ok) {
        // 提供更详细的错误信息
        throw new Error(result.message || `更新客户失败: ${response.status}`);
      }

      console.log('更新客户数据成功', result);
      
      if (!result.success) {
        throw new Error(result.message || '服务器未返回更新后的客户数据');
      }
      
      return result.data;
    } catch (error) {
      console.error(`向API更新客户(ID:${id})数据失败:`, error);
      throw error; // 不再降级到本地存储，直接抛出错误
    }
  }
  
  /**
   * 删除客户
   * @param {string} id 客户ID
   * @returns {Promise<boolean>} 是否成功删除
   */
  async deleteCustomer(id) {
    try {
      const response = await fetch(`${this.apiUrl}/customers/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`删除客户失败: ${response.status}`);
      }
      
      return true;
    } catch (error) {
      console.error('从API删除客户数据失败:', error);
      throw error; // 不再降级到本地存储，直接抛出错误
    }
  }
  
  /**
   * 删除客户相关的所有服务记录
   * @param {string} customerId 客户ID
   * @private
   */
  deleteCustomerServices(customerId) {
    const services = JSON.parse(localStorage.getItem('services') || '[]');
    const filteredServices = services.filter(s => s.customerId !== customerId);
    localStorage.setItem('services', JSON.stringify(filteredServices));

    // TODO: 当服务记录API实现后，添加对API的调用
  }
  
  /**
   * 删除客户相关的所有会员卡
   * @param {string} customerId 客户ID
   * @private
   */
  deleteCustomerMemberships(customerId) {
    const memberships = JSON.parse(localStorage.getItem('memberships') || '[]');
    const filteredMemberships = memberships.filter(m => m.customerId !== customerId);
    localStorage.setItem('memberships', JSON.stringify(filteredMemberships));

    // TODO: 当会员卡API实现后，添加对API的调用
  }
  
  /**
   * 搜索客户
   * @param {string} keyword 搜索关键词
   * @returns {Promise<Array>} 匹配的客户数组
   */
  async searchCustomers(keyword) {
    try {
      const url = keyword 
        ? `${this.apiUrl}/customers?keyword=${encodeURIComponent(keyword)}`
        : `${this.apiUrl}/customers`;
        
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`搜索客户失败: ${response.status}`);
      }
      
      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('从API搜索客户数据失败:', error);
      
      // 降级：使用本地搜索
      const customers = JSON.parse(localStorage.getItem('customers') || '[]');
      
      if (!keyword) {
        return customers;
      }
      
      const lowercaseKeyword = keyword.toLowerCase();
      return customers.filter(customer => 
        customer.childName?.toLowerCase().includes(lowercaseKeyword) ||
        customer.parentName?.toLowerCase().includes(lowercaseKeyword) ||
        customer.phone?.includes(lowercaseKeyword)
      );
    }
  }

  /**
   * 获取所有服务记录
   * @param {Object} query 查询参数
   * @returns {Promise<Array>} 服务记录列表
   */
  async getServices(query = {}) {
    try {
      // 构建查询字符串
      const queryParams = new URLSearchParams();
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value);
        }
      });
      
      const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
      
      // 发送GET请求
      const response = await fetch(`${this.apiUrl}/services${queryString}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || '获取服务记录失败');
      }
      
      return data;
    } catch (error) {
      console.error('获取服务记录出错:', error);
      throw error;
    }
  }

  /**
   * 获取服务统计数据
   * @returns {Promise<Object>} 服务统计数据
   */
  async getServiceStats() {
    try {
      const apiUrl = `${this.apiUrl}/services/stats`;
      console.log('正在请求服务统计数据API:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('API响应状态:', response.status, response.statusText);
      const data = await response.json();
      console.log('原始API响应数据:', JSON.stringify(data));
      
      if (!response.ok) {
        throw new Error(data.message || '获取服务统计数据失败');
      }
      
      // 验证数据结构正确性
      if (!data.success || !data.data) {
        console.error('API返回的数据结构不符合预期:', data);
        throw new Error('统计数据格式不正确');
      }
      
      // 提取数据对象
      const statsData = data.data;
      console.log('提取的统计数据:', JSON.stringify(statsData));
      
      // 返回统计数据
      return {
        data: statsData // 使用一致的数据结构，包装成 {data: {...}} 格式
      };
    } catch (error) {
      console.error('获取服务统计数据出错:', error);
      throw error;
    }
  }

  /**
   * 获取单个客户的服务记录
   * @param {string} customerId 客户ID
   * @returns {Promise<Array>} 服务记录列表
   */
  async getCustomerServices(customerId) {
    try {
      if (!customerId) {
        throw new Error('客户ID不能为空');
      }
      
      console.log(`获取客户(ID: ${customerId})的服务记录`);
      
      const response = await fetch(`${this.apiUrl}/services/customer/${customerId}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `获取客户服务记录失败: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('获取客户服务记录出错:', error);
      throw error;
    }
  }

  /**
   * 获取单个服务记录详情
   * @param {string} serviceId 服务记录ID
   * @returns {Promise<Object>} 服务记录详情
   */
  async getServiceById(serviceId) {
    try {
      const response = await fetch(`${this.apiUrl}/services/${serviceId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || '获取服务记录详情失败');
      }
      
      return data;
    } catch (error) {
      console.error('获取服务记录详情出错:', error);
      throw error;
    }
  }

  /**
   * 创建新的服务记录
   * @param {Object} serviceData 服务记录数据
   * @returns {Promise<Object>} 创建的服务记录
   */
  async createService(serviceData) {
    try {
      console.log('准备发送服务记录数据到API:', JSON.stringify(serviceData, null, 2));
      
      // 确保日期字段格式正确
      if (serviceData.serviceDate) {
        try {
          // 如果已经是Date对象，转换为ISO字符串
          if (serviceData.serviceDate instanceof Date) {
            if (!isNaN(serviceData.serviceDate.getTime())) {
              serviceData.serviceDate = serviceData.serviceDate.toISOString();
            } else {
              console.warn('无效的Date对象，使用当前日期');
              serviceData.serviceDate = new Date().toISOString();
            }
          } 
          // 如果是字符串，确保格式正确
          else if (typeof serviceData.serviceDate === 'string') {
            const dateObj = new Date(serviceData.serviceDate);
            // 验证日期有效性
            if (!isNaN(dateObj.getTime())) {
              serviceData.serviceDate = dateObj.toISOString();
            } else {
              console.warn('无效的服务日期字符串，使用当前日期:', serviceData.serviceDate);
              serviceData.serviceDate = new Date().toISOString();
            }
          } else {
            console.warn('未知的服务日期格式，使用当前日期');
            serviceData.serviceDate = new Date().toISOString();
          }
        } catch (error) {
          console.error('服务日期转换错误，使用当前日期:', error);
          serviceData.serviceDate = new Date().toISOString();
        }
      } else {
        console.log('未提供服务日期，使用当前日期');
        serviceData.serviceDate = new Date().toISOString();
      }
      
      // 确保数字字段是数字类型
      if (serviceData.serviceFee) {
        if (typeof serviceData.serviceFee === 'string') {
          serviceData.serviceFee = parseFloat(serviceData.serviceFee);
          if (isNaN(serviceData.serviceFee)) {
            console.error('服务费用转换为数字失败');
            throw new Error('服务费用必须是有效数字');
          }
        } else if (typeof serviceData.serviceFee !== 'number') {
          console.error('服务费用类型无效:', typeof serviceData.serviceFee);
          throw new Error('服务费用类型无效');
        }
      }
      
      // 处理可能的undefined字段，避免发送null值
      const processedData = Object.fromEntries(
        Object.entries(serviceData).filter(([_, v]) => v !== undefined && v !== null && v !== '')
      );
      
      // 特别处理医师ID
      if (processedData.therapist === '') {
        delete processedData.therapist;
      }
      
      console.log('过滤后准备发送的数据:', JSON.stringify(processedData, null, 2));
      
      const response = await fetch(`${this.apiUrl}/services`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(processedData)
      });
      
      // 检查是否是JSON响应
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch (jsonError) {
          console.error('解析JSON响应失败:', jsonError);
          const text = await response.text();
          throw new Error(`无法解析服务器响应: ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`);
        }
      } else {
        const text = await response.text();
        console.error('服务器返回非JSON响应:', text);
        throw new Error(`服务器返回了非JSON响应: ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`);
      }
      
      if (!response.ok) {
        const errorMessage = data.message || data.error || `创建服务记录失败 (HTTP ${response.status})`;
        console.error('API错误:', errorMessage, data);
        throw new Error(errorMessage);
      }
      
      console.log('服务记录创建成功:', data);
      return data.data;
    } catch (error) {
      console.error('创建服务记录出错:', error);
      throw error;
    }
  }

  /**
   * 更新服务记录
   * @param {string} serviceId 服务记录ID
   * @param {Object} serviceData 更新的服务记录数据
   * @returns {Promise<Object>} 更新后的服务记录
   */
  async updateService(serviceId, serviceData) {
    try {
      console.log(`准备更新服务记录 ID: ${serviceId}`);
      console.log('更新数据:', JSON.stringify(serviceData, null, 2));
      
      // 确保没有空的ObjectId引用字段
      const cleanData = {...serviceData};
      if (cleanData.membership === '') {
        console.log('检测到空的membership字段，从前端移除');
        delete cleanData.membership;
      }
      
      const response = await fetch(`${this.apiUrl}/services/${serviceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(cleanData)
      });
      
      console.log(`API响应状态: ${response.status} ${response.statusText}`);
      
      const data = await response.json();
      console.log('API响应数据:', JSON.stringify(data, null, 2));
      
      if (!response.ok) {
        console.error('API返回错误:', data);
        throw new Error(data.message || '更新服务记录失败');
      }
      
      console.log('服务记录更新成功');
      return data.data;
    } catch (error) {
      console.error('更新服务记录出错:', error);
      // 增强错误处理，确保返回包含消息的Error对象
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error('更新服务记录时发生未知错误');
      }
    }
  }

  /**
   * 删除服务记录
   * @param {string} serviceId 服务记录ID
   * @returns {Promise<void>}
   */
  async deleteService(serviceId) {
    try {
      const response = await fetch(`${this.apiUrl}/services/${serviceId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || '删除服务记录失败');
      }
      
      return data;
    } catch (error) {
      console.error('删除服务记录出错:', error);
      throw error;
    }
  }

  /**
   * 获取会员卡列表
   * @param {Object} query 查询参数
   * @returns {Promise<Object>} 会员卡列表
   */
  async getMemberships(query = {}) {
    try {
      // 构建查询字符串
      const queryParams = new URLSearchParams();
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value);
        }
      });
      
      const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
      
      // 发送GET请求
      const response = await fetch(`${this.apiUrl}/memberships${queryString}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || '获取会员卡列表失败');
      }
      
      return data;
    } catch (error) {
      console.error('获取会员卡列表出错:', error);
      throw error;
    }
  }

  /**
   * 获取会员卡统计数据
   * @returns {Promise<Object>} 会员卡统计数据
   */
  async getMembershipStats() {
    try {
      const response = await fetch(`${this.apiUrl}/memberships/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || '获取会员卡统计数据失败');
      }
      
      return data;
    } catch (error) {
      console.error('获取会员卡统计数据出错:', error);
      throw error;
    }
  }

  /**
   * 获取客户的会员卡
   * @param {string} customerId 客户ID
   * @returns {Promise<Object>} 会员卡列表
   */
  async getCustomerMemberships(customerId) {
    if (!customerId) {
      throw new Error('客户ID不能为空');
    }
    
    try {
      console.log(`正在获取客户会员卡，客户ID: ${customerId}`);
      const response = await fetch(`${this.apiUrl}/memberships/customer/${customerId}`);
      
      if (!response.ok) {
        throw new Error(`获取会员卡失败: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('获取客户会员卡失败:', error);
      throw error;
    }
  }

  /**
   * 获取单个会员卡详情
   * @param {string} membershipId 会员卡ID
   * @returns {Promise<Object>} 会员卡详情
   */
  async getMembershipById(membershipId) {
    try {
      if (!membershipId) {
        throw new Error('会员卡ID不能为空');
      }
      
      const response = await fetch(`${this.apiUrl}/memberships/${membershipId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || '获取会员卡详情失败');
      }
      
      return data;
    } catch (error) {
      console.error('获取会员卡详情出错:', error);
      throw error;
    }
  }

  /**
   * 创建会员卡
   * @param {Object} membershipData 会员卡数据
   * @returns {Promise<Object>} 创建的会员卡
   */
  async createMembership(membershipData) {
    try {
      console.log('准备创建会员卡:', JSON.stringify(membershipData, null, 2));
      
      const response = await fetch(`${this.apiUrl}/memberships`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(membershipData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || '创建会员卡失败');
      }
      
      return data;
    } catch (error) {
      console.error('创建会员卡出错:', error);
      throw error;
    }
  }

  /**
   * 更新会员卡
   * @param {string} membershipId 会员卡ID
   * @param {Object} membershipData 会员卡数据
   * @returns {Promise<Object>} 更新后的会员卡
   */
  async updateMembership(membershipId, membershipData) {
    try {
      if (!membershipId) {
        throw new Error('会员卡ID不能为空');
      }
      
      console.log(`准备更新会员卡 ID ${membershipId}:`, JSON.stringify(membershipData, null, 2));
      
      const response = await fetch(`${this.apiUrl}/memberships/${membershipId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(membershipData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || '更新会员卡失败');
      }
      
      return data;
    } catch (error) {
      console.error('更新会员卡出错:', error);
      throw error;
    }
  }

  /**
   * 更新会员卡状态
   * @param {string} membershipId 会员卡ID
   * @param {Object} statusData 状态数据，包含status字段
   * @returns {Promise<Object>} 更新后的会员卡数据
   */
  async updateMembershipStatus(membershipId, statusData) {
    if (!membershipId) {
      throw new Error('会员卡ID不能为空');
    }
    
    if (!statusData || !statusData.status) {
      throw new Error('状态数据不完整');
    }
    
    try {
      console.log(`正在更新会员卡状态，ID: ${membershipId}，状态: ${statusData.status}`);
      const response = await fetch(`${this.apiUrl}/memberships/${membershipId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(statusData)
      });
      
      if (!response.ok) {
        throw new Error(`更新会员卡状态失败: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('更新会员卡状态失败:', error);
      throw error;
    }
  }

  /**
   * 为会员卡充值
   * @param {string} membershipId 会员卡ID
   * @param {Object} rechargeData 充值数据，包含amount字段
   * @returns {Promise<Object>} 充值后的会员卡数据
   */
  async rechargeMembership(membershipId, rechargeData) {
    if (!membershipId) {
      throw new Error('会员卡ID不能为空');
    }
    
    if (!rechargeData || rechargeData.amount <= 0) {
      throw new Error('充值金额必须大于零');
    }
    
    try {
      console.log(`正在为会员卡充值，ID: ${membershipId}，金额: ${rechargeData.amount}`);
      const response = await fetch(`${this.apiUrl}/memberships/${membershipId}/recharge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(rechargeData)
      });
      
      if (!response.ok) {
        throw new Error(`会员卡充值失败: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('会员卡充值失败:', error);
      throw error;
    }
  }

  /**
   * 获取会员卡充值历史
   * @param {string} membershipId 会员卡ID
   * @returns {Promise<Object>} 充值历史记录
   */
  async getMembershipRechargeHistory(membershipId) {
    try {
      if (!membershipId) {
        throw new Error('会员卡ID不能为空');
      }
      
      const response = await fetch(`${this.apiUrl}/memberships/${membershipId}/recharge-history`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || '获取会员卡充值历史失败');
      }
      
      return data;
    } catch (error) {
      console.error('获取会员卡充值历史出错:', error);
      throw error;
    }
  }

  /**
   * 获取统计与数据分析的数据
   * @param {string} queryParams 查询参数字符串
   * @returns {Promise<Object>} 统计数据
   */
  async getStatisticsData(queryParams = '') {
    try {
      console.log(`正在获取统计数据，查询参数: ${queryParams}`);
      
      const response = await fetch(`${this.apiUrl}/statistics?${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('API响应状态:', response.status, response.statusText);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || '获取统计数据失败');
      }
      
      return data;
    } catch (error) {
      console.error('获取统计数据出错:', error);
      throw error;
    }
  }

  /**
   * 删除会员卡
   * @param {string} membershipId 会员卡ID
   * @returns {Promise<Object>} 删除结果
   */
  async deleteMembership(membershipId) {
    try {
      const response = await fetch(`${this.apiUrl}/memberships/${membershipId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      return await response.json();
    } catch (error) {
      console.error('删除会员卡失败:', error);
      throw error;
    }
  }

  /**
   * 获取所有医师列表
   * @returns {Promise<Object>} 包含医师数组的对象
   */
  async getAllTherapists() {
    try {
      console.log('开始获取所有医师列表');
      const url = `${this.apiUrl}/therapists`;
      
      const response = await fetch(url);
      
      // 检查HTTP状态码
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`获取医师列表失败: HTTP ${response.status} - ${errorText}`);
        return {
          success: false,
          message: `HTTP错误: ${response.status}`,
          data: []
        };
      }
      
      const result = await response.json();
      
      if (!result.success) {
        console.error('获取医师列表返回错误:', result.message);
        return {
          success: false,
          message: result.message || '获取医师列表失败',
          data: []
        };
      }
      
      // 确保我们有一个有效的数组
      if (!Array.isArray(result.data)) {
        console.warn('获取医师列表返回的数据不是数组:', result);
        result.data = [];
      }
      
      console.log(`成功获取 ${result.data.length} 名医师`);
      return result;
    } catch (error) {
      console.error('获取医师列表错误:', error);
      return {
        success: false,
        message: error.message || '获取医师列表时发生错误',
        data: []
      };
    }
  }

  /**
   * 获取医师详情
   * @param {string} id 医师ID
   * @returns {Promise<Object>} 医师详情数据
   */
  async getTherapist(id) {
    try {
      const response = await fetch(`${this.apiUrl}/therapists/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('未找到该医师');
        }
        throw new Error(`获取医师详情失败: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('获取医师详情失败:', error);
      throw error;
    }
  }

  /**
   * 获取医师统计数据
   * @param {string} id 医师ID
   * @returns {Promise<Object>} 医师统计数据
   */
  async getTherapistStats(id) {
    if (!id) {
      console.error('getTherapistStats: 医师ID不能为空');
      throw new Error('医师ID不能为空');
    }
    
    try {
      console.log(`开始获取医师(ID: ${id})统计数据`);
      const url = `${this.apiUrl}/therapists/${id}/stats`;
      
      const response = await fetch(url);
      
      // 检查HTTP状态码
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`获取医师统计数据失败: HTTP ${response.status} - ${errorText}`);
        throw new Error(`HTTP ${response.status} - ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        console.error(`获取医师统计数据失败:`, result.message);
        throw new Error(result.message || '获取医师统计数据失败');
      }
      
      console.log(`医师(ID: ${id})统计数据获取成功:`, result);
      return result;
    } catch (error) {
      console.error(`获取医师统计数据失败:`, error);
      throw error;
    }
  }

  /**
   * 创建新医师
   * @param {Object} therapistData 医师数据
   * @returns {Promise<Object>} 创建结果
   */
  async createTherapist(therapistData) {
    try {
      const response = await fetch(`${this.apiUrl}/therapists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(therapistData)
      });
      
      const data = await response.json();
      
      // 如果响应不成功，记录详细错误信息
      if (!response.ok) {
        console.error('创建医师API错误:', {
          status: response.status,
          statusText: response.statusText,
          data: data
        });
      }
      
      return data;
    } catch (error) {
      console.error('创建医师失败:', error);
      return {
        success: false,
        message: error.message || '创建医师时发生错误'
      };
    }
  }

  /**
   * 更新医师信息
   * @param {string} id 医师ID
   * @param {Object} therapistData 医师数据
   * @returns {Promise<Object>} 更新结果
   */
  async updateTherapist(id, therapistData) {
    try {
      const response = await fetch(`${this.apiUrl}/therapists/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(therapistData)
      });
      
      const data = await response.json();
      
      // 如果响应不成功，记录详细错误信息
      if (!response.ok) {
        console.error('更新医师API错误:', {
          status: response.status,
          statusText: response.statusText,
          data: data
        });
      }
      
      return data;
    } catch (error) {
      console.error('更新医师失败:', error);
      return {
        success: false,
        message: error.message || '更新医师时发生错误'
      };
    }
  }

  /**
   * 删除医师
   * @param {string} id 医师ID
   * @returns {Promise<Object>} 删除结果
   */
  async deleteTherapist(id) {
    try {
      const response = await fetch(`${this.apiUrl}/therapists/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      // 如果响应不成功，记录详细错误信息
      if (!response.ok) {
        console.error('删除医师API错误:', {
          status: response.status,
          statusText: response.statusText,
          data: data
        });
      }
      
      return data;
    } catch (error) {
      console.error('删除医师失败:', error);
      return {
        success: false,
        message: error.message || '删除医师时发生错误'
      };
    }
  }

  /**
   * 获取所有库存商品
   * @param {Object} params 查询参数
   * @returns {Promise<Array>} 商品数组
   */
  async getInventoryItems(params = {}) {
    try {
      // 构建查询字符串
      const queryParams = new URLSearchParams();
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          queryParams.append(key, params[key]);
        }
      });
      
      const url = `${this.apiUrl}/inventory${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      console.log(`获取库存商品列表: ${url}`);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`获取库存列表失败: ${response.status}`);
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('从API获取库存数据失败:', error);
      throw error;
    }
  }
  
  /**
   * 获取库存统计信息
   * @returns {Promise<Object>} 统计信息
   */
  async getInventoryStats() {
    try {
      const response = await fetch(`${this.apiUrl}/inventory/stats`);
      if (!response.ok) {
        throw new Error(`获取库存统计失败: ${response.status}`);
      }
      
      const result = await response.json();
      return result.data || {};
    } catch (error) {
      console.error('从API获取库存统计数据失败:', error);
      throw error;
    }
  }
  
  /**
   * 获取库存交易记录
   * @param {Object} params 查询参数
   * @returns {Promise<Array>} 交易记录数组
   */
  async getInventoryTransactions(params = {}) {
    try {
      // 构建查询字符串
      const queryParams = new URLSearchParams();
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          queryParams.append(key, params[key]);
        }
      });
      
      const url = `${this.apiUrl}/inventory/transactions${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      console.log(`获取库存交易记录: ${url}`);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`获取交易记录失败: ${response.status}`);
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('从API获取交易记录失败:', error);
      throw error;
    }
  }
  
  /**
   * 获取单个库存商品
   * @param {string} id 商品ID
   * @returns {Promise<Object|null>} 商品对象或null
   */
  async getInventoryItemById(id) {
    if (!id) {
      throw new Error('商品ID不能为空');
    }
    
    try {
      console.log(`正在获取商品数据，ID: ${id}`);
      const url = `${this.apiUrl}/inventory/${id}`;
      
      const response = await fetch(url);
      
      if (response.status === 404) {
        console.warn(`未找到ID为${id}的商品`);
        return null;
      }
      
      if (!response.ok) {
        throw new Error(`获取商品失败: ${response.status}`);
      }
      
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('获取商品数据失败:', error);
      throw error;
    }
  }
  
  /**
   * 创建库存商品
   * @param {Object} itemData 商品数据
   * @returns {Promise<Object>} 创建的商品
   */
  async createInventoryItem(itemData) {
    try {
      console.log('创建库存商品:', itemData);
      
      const response = await fetch(`${this.apiUrl}/inventory`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(itemData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `创建商品失败: ${response.status}`);
      }
      
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('创建商品失败:', error);
      throw error;
    }
  }
  
  /**
   * 更新库存商品
   * @param {string} id 商品ID
   * @param {Object} itemData 商品数据
   * @returns {Promise<Object>} 更新后的商品
   */
  async updateInventoryItem(id, itemData) {
    if (!id) {
      throw new Error('商品ID不能为空');
    }
    
    try {
      console.log(`更新商品，ID: ${id}`, itemData);
      
      const response = await fetch(`${this.apiUrl}/inventory/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(itemData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `更新商品失败: ${response.status}`);
      }
      
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('更新商品失败:', error);
      throw error;
    }
  }
  
  /**
   * 删除库存商品
   * @param {string} id 商品ID
   * @returns {Promise<void>}
   */
  async deleteInventoryItem(id) {
    if (!id) {
      throw new Error('商品ID不能为空');
    }
    
    try {
      console.log(`删除商品，ID: ${id}`);
      
      const response = await fetch(`${this.apiUrl}/inventory/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `删除商品失败: ${response.status}`);
      }
    } catch (error) {
      console.error('删除商品失败:', error);
      throw error;
    }
  }
  
  /**
   * 商品入库
   * @param {string} id 商品ID
   * @param {Object} data 入库数据
   * @returns {Promise<Object>} 入库结果
   */
  async stockIn(id, data) {
    if (!id) {
      throw new Error('商品ID不能为空');
    }
    
    if (!data.quantity || data.quantity <= 0) {
      throw new Error('入库数量必须大于0');
    }
    
    try {
      console.log(`商品入库，ID: ${id}`, data);
      
      const response = await fetch(`${this.apiUrl}/inventory/${id}/stock-in`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `入库操作失败: ${response.status}`);
      }
      
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('入库操作失败:', error);
      throw error;
    }
  }
  
  /**
   * 商品出库
   * @param {string} id 商品ID
   * @param {Object} data 出库数据
   * @returns {Promise<Object>} 出库结果
   */
  async stockOut(id, data) {
    if (!id) {
      throw new Error('商品ID不能为空');
    }
    
    if (!data.quantity || data.quantity <= 0) {
      throw new Error('出库数量必须大于0');
    }
    
    try {
      console.log(`商品出库，ID: ${id}`, data);
      
      const response = await fetch(`${this.apiUrl}/inventory/${id}/stock-out`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `出库操作失败: ${response.status}`);
      }
      
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('出库操作失败:', error);
      throw error;
    }
  }

  /**
   * 获取客户的消费记录
   * @param {string} customerId 客户ID
   * @returns {Promise<Object>} 客户的消费记录
   */
  async getCustomerConsumptions(customerId) {
    try {
      if (!customerId) {
        throw new Error('客户ID不能为空');
      }
      
      console.log(`获取客户(ID: ${customerId})的消费记录`);
      
      const response = await fetch(`${this.apiUrl}/services/customer/${customerId}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `获取客户消费记录失败: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('获取客户消费记录出错:', error);
      throw error;
    }
  }

  /**
   * 用户登录
   * @param {string} username - 用户名
   * @param {string} password - 密码
   * @returns {Promise<Object>} 登录结果
   */
  async login(username, password) {
    const url = `${this.apiUrl}/auth/login`;
    const options = {
      method: 'POST',
      body: JSON.stringify({ username, password })
    };
    
    return await this.fetchApi(url, options);
  }
  
  /**
   * 用户注册
   * @param {Object} userData - 用户数据
   * @returns {Promise<Object>} 注册结果
   */
  async register(userData) {
    const url = `${this.apiUrl}/auth/register`;
    const options = {
      method: 'POST',
      body: JSON.stringify(userData)
    };
    
    return await this.fetchApi(url, options);
  }
  
  /**
   * 用户注销
   * @returns {Promise<Object>} 注销结果
   */
  async logout() {
    const url = `${this.apiUrl}/auth/logout`;
    const result = await this.fetchApi(url);
    
    // 清除本地存储
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    return result;
  }
  
  /**
   * 获取当前用户信息
   * @returns {Promise<Object>} 用户信息
   */
  async getCurrentUser() {
    const url = `${this.apiUrl}/auth/me`;
    return await this.fetchApi(url);
  }
  
  /**
   * 修改密码
   * @param {string} currentPassword - 当前密码
   * @param {string} newPassword - 新密码
   * @returns {Promise<Object>} 修改结果
   */
  async updatePassword(currentPassword, newPassword) {
    const url = `${this.apiUrl}/auth/updatepassword`;
    const options = {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword })
    };
    
    return await this.fetchApi(url, options);
  }
  
  /**
   * 发送密码重置请求
   * @param {string} email - 用户邮箱
   * @returns {Promise<Object>} 请求结果
   */
  async forgotPassword(email) {
    const url = `${this.apiUrl}/auth/forgotpassword`;
    const options = {
      method: 'POST',
      body: JSON.stringify({ email })
    };
    
    return await this.fetchApi(url, options);
  }
  
  /**
   * 重置密码
   * @param {string} resetToken - 重置令牌
   * @param {string} password - 新密码
   * @returns {Promise<Object>} 重置结果
   */
  async resetPassword(resetToken, password) {
    const url = `${this.apiUrl}/auth/resetpassword/${resetToken}`;
    const options = {
      method: 'PUT',
      body: JSON.stringify({ password })
    };
    
    return await this.fetchApi(url, options);
  }

  /**
   * 获取所有服务项目
   * @returns {Promise<Object>} 包含服务项目数组的对象
   */
  async getAllServiceItems() {
    try {
      console.log('开始获取所有服务项目');
      const url = `${this.apiUrl}/settings/service-items`;
      
      const response = await fetch(url);
      
      // 检查HTTP状态码
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`获取服务项目列表失败: HTTP ${response.status} - ${errorText}`);
        return {
          success: false,
          message: `HTTP错误: ${response.status}`,
          data: []
        };
      }
      
      const result = await response.json();
      
      if (!result.success) {
        console.error('获取服务项目列表返回错误:', result.message);
        return {
          success: false,
          message: result.message || '获取服务项目列表失败',
          data: []
        };
      }
      
      // 确保我们有一个有效的数组
      if (!Array.isArray(result.data)) {
        console.warn('获取服务项目列表返回的数据不是数组:', result);
        result.data = [];
      }
      
      console.log(`成功获取 ${result.data.length} 个服务项目`);
      return result;
    } catch (error) {
      console.error('获取服务项目列表错误:', error);
      return {
        success: false,
        message: error.message || '获取服务项目列表时发生错误',
        data: []
      };
    }
  }

  /**
   * 商品出库操作
   * @param {string} id 商品ID
   * @param {Object} data 出库数据
   * @returns {Promise<Object>} 响应结果
   */
  async stockOutInventoryItem(id, data) {
    try {
      const response = await fetch(`${this.apiUrl}/inventory/${id}/stock-out`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data)
      });
      
      // 处理非2xx响应
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '操作失败');
      }
      
      const result = await response.json();
      
      return result;
    } catch (error) {
      console.error('商品出库失败:', error);
      throw error;
    }
  }
  
  /**
   * 商品销售操作
   * @param {string} id 商品ID
   * @param {Object} data 销售数据
   * @returns {Promise<Object>} 响应结果
   */
  async sellInventoryItem(id, data) {
    try {
      const response = await fetch(`${this.apiUrl}/inventory/${id}/sell`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data)
      });
      
      // 处理非2xx响应
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '销售失败');
      }
      
      const result = await response.json();
      
      return result;
    } catch (error) {
      console.error('商品销售失败:', error);
      throw error;
    }
  }
}

// 创建单例实例并暴露
window.dataService = new DataService(); 
export default window.dataService; 