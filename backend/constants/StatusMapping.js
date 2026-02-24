// 状态映射枚举：统一管理 “状态值 - 展示文本 - 颜色标识”，前后端可共用（如 pending_sort: {text: ' 待分拣 ', color: 'blue'}）
/**
 * 状态映射配置文件（后端）
 * 作用：统一管理车辆/订单/优先级等状态的编码、显示文字、样式类型
 * 与前端 StatusEnum.js 完全对齐，避免前后端状态不一致
 */

// ===================== 核心状态映射 =====================
// 1. 车辆状态映射（对应前端 CAR_STATUS）
const CAR_STATUS_MAP = {
  // 后端存储值: { 前端显示文字, Element Plus Tag样式类型 }
  'idle': { label: '空闲', type: 'success' },    // 绿色
  'transporting': { label: '在途', type: 'warning' }, // 黄色
  'maintenance': { label: '维修', type: 'info' },    // 蓝色
  'assigned': { label: '已分配', type: 'primary' }   // 深蓝色
};

// 2. 订单状态映射（对应前端 ORDER_STATUS）
const ORDER_STATUS_MAP = {
  'pending': { label: '待分配', type: 'warning' },   // 黄色
  'assigned': { label: '已分配', type: 'primary' },  // 深蓝色
  'completed': { label: '已完成', type: 'success' }, // 绿色
  'cancelled': { label: '已取消', type: 'danger' }   // 红色
};

// 3. 优先级状态映射（对应前端 PRIORITY_STATUS）
const PRIORITY_STATUS_MAP = {
  'urgent': { label: '紧急', type: 'danger' },       // 红色
  'normal': { label: '普通', type: 'info' }          // 蓝色
};

// ===================== 工具方法（后端接口调用） =====================
/**
 * 获取状态对应的显示文字
 * @param {string} statusType 状态类型（car/order/priority）
 * @param {string} statusValue 后端存储的状态值（如'idle'/'pending'）
 * @returns {string} 前端显示的文字（如'空闲'/'待分配'）
 */
const getStatusLabel = (statusType, statusValue) => {
  let map = {};
  switch (statusType) {
    case 'car':
      map = CAR_STATUS_MAP;
      break;
    case 'order':
      map = ORDER_STATUS_MAP;
      break;
    case 'priority':
      map = PRIORITY_STATUS_MAP;
      break;
    default:
      return '未知状态';
  }
  return map[statusValue]?.label || '未知状态';
};

/**
 * 获取状态对应的样式类型（用于前端StatusTag组件）
 * @param {string} statusType 状态类型（car/order/priority）
 * @param {string} statusValue 后端存储的状态值
 * @returns {string} Element Plus Tag样式（success/warning/danger/info/primary）
 */
const getStatusStyle = (statusType, statusValue) => {
  let map = {};
  switch (statusType) {
    case 'car':
      map = CAR_STATUS_MAP;
      break;
    case 'order':
      map = ORDER_STATUS_MAP;
      break;
    case 'priority':
      map = PRIORITY_STATUS_MAP;
      break;
    default:
      return 'info';
  }
  return map[statusValue]?.type || 'info';
};

/**
 * 格式化接口返回数据（给前端返回带状态文字和样式的完整数据）
 * @param {string} statusType 状态类型
 * @param {Array} list 原始数据列表（如车辆列表/订单列表）
 * @returns {Array} 格式化后的数据（新增statusLabel/statusStyle字段）
 */
const formatStatusData = (statusType, list) => {
  return list.map(item => {
    // 兼容不同字段名（车辆状态字段是status，优先级是urgent）
    const statusValue = statusType === 'priority' ? item.urgent : item.status;
    return {
      ...item,
      statusLabel: getStatusLabel(statusType, statusValue),
      statusStyle: getStatusStyle(statusType, statusValue)
    };
  });
};

// ===================== 导出（供后端接口/控制器调用） =====================
module.exports = {
  // 原始映射表
  CAR_STATUS_MAP,
  ORDER_STATUS_MAP,
  PRIORITY_STATUS_MAP,
  // 工具方法
  getStatusLabel,
  getStatusStyle,
  formatStatusData
};