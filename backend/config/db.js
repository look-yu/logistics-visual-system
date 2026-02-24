// config/db.js - 纯MySQL连接池配置（无自动建表/插数据逻辑）
const mysql = require('mysql2/promise'); // 仅使用promise版mysql2

// ===================== 1. MySQL连接配置（根据你的本地MySQL修改） =====================
const dbConfig = {
  host: 'localhost',        // 本地MySQL地址（默认localhost）
  user: 'root',             // MySQL登录账号（默认root）
  password: '123456',       // 你的MySQL登录密码（必填！改这里）
  database: 'logistics_db', // 需先手动在MySQL创建这个库
  port: 3306,               // MySQL端口（默认3306）
  charset: 'utf8mb4',       // 字符集（支持中文/emoji）
  // 连接池配置（性能优化）
  waitForConnections: true,
  connectionLimit: 10,      // 最大连接数
  queueLimit: 0             // 排队请求无限制
};

// ===================== 2. 模拟数据兜底（MySQL连接失败时用） =====================
// 保留原有模拟数据结构，和之前Model层的mock数据一致
const mockData = {
  // 角色相关模拟数据（兼容原有接口）
  manager: { role: 'manager', dashboard: '全量数据看板' },
  dispatcher: { role: 'dispatcher', dashboard: '运力调度看板' },
  warehouse: { role: 'warehouse', dashboard: '库存管理看板' },
  // 车辆/运单模拟数据
  carList: [
    { id: 1, carNo: '京A12345', driver: '张三', phone: '13800138000', status: '空闲', area: '朝阳区', load: '5吨' },
    { id: 2, carNo: '京B67890', driver: '李四', phone: '13900139000', status: '在途', area: '海淀区', load: '8吨' }
  ],
  orderList: [
    { orderId: 'OD20260221001', goodsType: '生鲜', weight: '2吨', area: '朝阳区', urgent: '紧急', status: '待分配' },
    { orderId: 'OD20260221002', goodsType: '标品', weight: '3吨', area: '海淀区', urgent: '普通', status: '待分配' }
  ]
};

// ===================== 3. 创建连接池 + 通用查询方法 =====================
let pool = null; // 连接池实例（成功则赋值，失败则为null）

// 初始化连接池
const initPool = async () => {
  try {
    // 创建连接池
    pool = mysql.createPool(dbConfig);
    // 测试连接（执行空查询）
    await pool.execute('SELECT 1');
    console.log('✅ MySQL连接池创建并测试成功（已连接logistics_db库）');
  } catch (err) {
    pool = null; // 连接失败则置空
    console.error(`❌ MySQL连接失败：${err.message}`);
    console.warn('⚠️ 将自动切换为模拟数据模式运行');
  }
};
// 启动时立即初始化连接池
initPool();

// 通用查询方法（供Model层调用，兼容Promise）
const query = async (sql, params = []) => {
  // 连接失败则返回模拟数据（兜底）
  if (!pool) {
    console.warn(`⚠️ SQL执行失败（无数据库连接），SQL：${sql}`);
    // 根据SQL关键词返回对应模拟数据（简单适配）
    if (sql.includes('vehicle_info')) return mockData.carList;
    if (sql.includes('waybill_main')) return mockData.orderList;
    return [];
  }

  // 连接成功则执行真实SQL
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (err) {
    console.error(`❌ SQL执行失败：${sql} | 错误：${err.message}`);
    return [];
  }
};

// ===================== 4. 对外暴露（保持原有接口兼容） =====================
// module.exports = {
//   pool,        // 连接池实例（供特殊场景调用）
//   query,       // 通用查询方法（Model层核心调用）
//   mockData     // 模拟数据（连接失败时兜底）
// };