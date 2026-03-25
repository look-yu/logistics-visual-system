// 状态枚举常量：统一管理订单 / 库存状态值（如 PENDING_SORT: ' 待分拣 '），避免硬编码
/**
 * 状态枚举常量：统一订单/车辆/库存状态的映射关系
 * 格式：{ 状态值: { text: 展示文本, type: element-plus标签类型, color: 自定义颜色 } }
 * 避免硬编码，前后端统一
 */
export const ORDER_STATUS = {
  PENDING: { text: '待分配', type: 'warning', color: '#E6A23C' }, // 橙
  ASSIGNED: { text: '已分配', type: 'primary', color: '#409EFF' }, // 蓝
  SHIPPING: { text: '运输中', type: 'info', color: '#909399' }, // 灰
  DELIVERED: { text: '已送达', type: 'success', color: '#67C23A' }, // 绿
  SIGNED: { text: '已签收', type: 'success', color: '#67C23A' }, // 绿
  EXCEPTION: { text: '异常', type: 'danger', color: '#F56C6C' }, // 红
  CANCELLED: { text: '已取消', type: 'danger', color: '#F56C6C' } // 红
};

export const CAR_STATUS = {
  IDLE: { text: '空闲', type: 'success', color: '#67C23A' }, // 绿
  ON_ROAD: { text: '在途', type: 'warning', color: '#E6A23C' }, // 橙
  MAINTENANCE: { text: '维修', type: 'danger', color: '#F56C6C' }, // 红
  ALLOCATED: { text: '已分配', type: 'primary', color: '#409EFF' } // 蓝
};

export const STOCK_STATUS = {
  SAFE: { text: '安全库存', type: 'success', color: '#67C23A' }, // 绿
  WARNING: { text: '库存预警', type: 'warning', color: '#E6A23C' }, // 橙
  DANGER: { text: '库存不足', type: 'danger', color: '#F56C6C' }, // 红
  OUT_OF_STOCK: { text: '缺货', type: 'danger', color: '#F56C6C' } // 红
};

// 状态值映射（适配后端返回的原始状态值）
export const STATUS_MAPPER = {
  // 订单状态映射：后端原始值 → 枚举key
  'pending': 'PENDING',
  'assigned': 'ASSIGNED',
  'shipping': 'SHIPPING',
  'delivered': 'DELIVERED',
  'signed': 'SIGNED',
  'exception': 'EXCEPTION',
  'cancelled': 'CANCELLED',
  // 车辆状态映射
  'idle': 'IDLE',
  'transporting': 'ON_ROAD',
  'maintenance': 'MAINTENANCE',
  'assigned': 'ALLOCATED'
};