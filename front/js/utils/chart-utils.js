/**
 * 图表工具函数
 * 提供安全的图表创建和错误处理方法
 */

/**
 * 安全地创建图表，处理可能的Chart.js加载失败
 * @param {string} elementId 图表canvas元素的ID
 * @param {string} type 图表类型：'pie', 'bar', 'line'等
 * @param {Object} data 图表数据
 * @param {Object} options 图表选项
 * @returns {Chart|null} 创建的图表对象或null（如果失败）
 */
export function createChart(elementId, type, data, options) {
  try {
    console.log(`尝试创建图表: ${elementId}, 类型: ${type}`);
    
    // 检查Chart.js是否已加载
    if (typeof Chart === 'undefined') {
      console.error('Chart.js库未加载，无法创建图表');
      
      // 向用户显示错误信息
      const canvas = document.getElementById(elementId);
      if (canvas && canvas.parentNode) {
        // 移除可能存在的旧错误信息
        Array.from(canvas.parentNode.querySelectorAll('.alert')).forEach(el => el.remove());
        
        const errorMsg = document.createElement('div');
        errorMsg.className = 'alert alert-danger mt-2';
        errorMsg.textContent = 'Chart.js库未加载，请刷新页面重试';
        canvas.parentNode.insertBefore(errorMsg, canvas.nextSibling);
      }
      return null;
    }
    
    // 获取canvas元素
    const canvas = document.getElementById(elementId);
    if (!canvas) {
      console.warn(`找不到图表Canvas元素: ${elementId}`);
      return null;
    }
    
    // 移除可能存在的旧错误信息
    if (canvas.parentNode) {
      Array.from(canvas.parentNode.querySelectorAll('.alert')).forEach(el => el.remove());
    }
    
    // 确保Canvas有具体尺寸
    if (canvas.parentElement) {
      // 设置固定高度
      canvas.style.width = '100%';
      canvas.style.height = '250px';
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.warn(`无法获取Canvas 2D上下文: ${elementId}`);
      return null;
    }
    
    // 确保数据格式正确
    if (!data || !data.datasets || data.datasets.length === 0) {
      console.warn(`创建图表的数据格式不正确: ${elementId}`);
      
      // 使用默认数据
      data = {
        labels: ['暂无数据'],
        datasets: [{
          label: '无数据',
          data: [1],
          backgroundColor: ['rgba(200, 200, 200, 0.7)']
        }]
      };
    }
    
    // 创建图表前检查是否已存在图表实例
    if (canvas.chart instanceof Chart) {
      try {
        canvas.chart.destroy();
        console.log(`已销毁现有图表实例: ${elementId}`);
      } catch (error) {
        console.warn(`销毁旧图表实例失败: ${error.message}`);
      }
    }
    
    // 确保数据集的值是数值类型
    data.datasets.forEach(dataset => {
      if (dataset.data) {
        dataset.data = dataset.data.map(value => {
          const num = Number(value);
          return isNaN(num) ? 0 : num;
        });
      }
    });
    
    // 简化图表配置，避免不必要的选项
    const chartConfig = {
      type,
      data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        // 完全禁用所有动画，减少出错可能性
        animation: false,
        plugins: {
          legend: {
            display: true,
            position: 'top'
          },
          tooltip: {
            enabled: true
          },
          title: {
            display: data.labels.length === 1 && data.labels[0] === '暂无数据',
            text: '无数据可显示',
            font: {
              size: 16
            }
          }
        },
        ...options
      }
    };
    
    try {
      // 清除canvas上的任何现有绘图
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // 直接创建图表，不使用复杂的配置
      const chart = new Chart(ctx, chartConfig);
      console.log(`图表 ${elementId} 创建成功`);
      
      // 将图表实例存储在canvas元素上，方便后续访问
      canvas.chart = chart;
      
      return chart;
    } catch (chartError) {
      console.error(`Chart.js创建图表失败: ${chartError.message}`);
      
      if (canvas.parentNode) {
        const errorMsg = document.createElement('div');
        errorMsg.className = 'alert alert-danger mt-2';
        errorMsg.textContent = `图表创建失败: ${chartError.message}`;
        canvas.parentNode.insertBefore(errorMsg, canvas.nextSibling);
      }
      return null;
    }
  } catch (error) {
    console.error(`创建图表(${elementId})失败:`, error);
    
    // 在Canvas位置显示错误信息
    try {
      const canvas = document.getElementById(elementId);
      if (canvas && canvas.parentNode) {
        const errorMsg = document.createElement('div');
        errorMsg.className = 'alert alert-danger mt-2';
        errorMsg.textContent = `图表加载失败: ${error.message}`;
        canvas.parentNode.insertBefore(errorMsg, canvas.nextSibling);
      }
    } catch (e) {
      console.error('无法创建错误消息元素:', e);
    }
    
    return null;
  }
}

/**
 * 销毁图表（如果存在）
 * @param {Chart|string} chart 图表对象或元素ID
 */
export function destroyChart(chart) {
  try {
    // 如果传入的是字符串ID，获取对应元素上的图表实例
    if (typeof chart === 'string') {
      const canvas = document.getElementById(chart);
      if (canvas && canvas.chart instanceof Chart) {
        chart = canvas.chart;
      } else {
        return; // 没有找到图表实例
      }
    }
    
    // 销毁图表实例
    if (chart && typeof chart.destroy === 'function') {
      chart.destroy();
      console.log('图表已成功销毁');
    }
  } catch (error) {
    console.error('销毁图表失败:', error);
  }
}

/**
 * 格式化货币值
 * @param {number} value 货币值
 * @returns {string} 格式化后的货币字符串
 */
export function formatCurrency(value) {
  return `￥${Number(value || 0).toFixed(2)}`;
}

/**
 * 生成图表颜色数组
 * @param {number} count 需要的颜色数量
 * @returns {string[]} 颜色数组
 */
export function generateChartColors(count) {
  const baseColors = [
    'rgba(78, 115, 223, 0.7)',  // 蓝色
    'rgba(28, 200, 138, 0.7)',  // 绿色
    'rgba(246, 194, 62, 0.7)',  // 黄色
    'rgba(54, 185, 204, 0.7)',  // 青色
    'rgba(231, 74, 59, 0.7)'    // 红色
  ];
  
  // 如果需要的颜色少于或等于基础颜色数量，直接返回需要的部分
  if (count <= baseColors.length) {
    return baseColors.slice(0, count);
  }
  
  // 否则，重复使用基础颜色
  const colors = [];
  for (let i = 0; i < count; i++) {
    colors.push(baseColors[i % baseColors.length]);
  }
  
  return colors;
} 