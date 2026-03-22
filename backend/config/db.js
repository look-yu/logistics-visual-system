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
  multipleStatements: true, // 允许执行多条SQL语句
  // 连接池配置（性能优化）
  waitForConnections: true,
  connectionLimit: 10,      // 最大连接数
  queueLimit: 0,            // 排队请求无限制
  // 连接时设置字符集
  typeCast: function (field, next) {
    if (field.type === 'VAR_STRING' || field.type === 'STRING') {
      return field.string();
    }
    return next();
  }
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
    { id: 1, order_no: 'ORD20260317001', customer_name: '阿里巴巴', sender_address: '杭州市余杭区', receiver_address: '上海市浦东新区', goods_type: '生鲜', weight: '2吨', amount: 1500, status: 'pending', create_time: new Date() },
    { id: 2, order_no: 'ORD20260317002', customer_name: '腾讯', sender_address: '深圳市南山区', receiver_address: '北京市朝阳区', goods_type: '电子产品', weight: '1.5吨', amount: 3200, status: 'shipping', create_time: new Date() },
    { id: 3, order_no: 'ORD20260317003', customer_name: '京东', sender_address: '北京市大兴区', receiver_address: '广州市天河区', goods_type: '日用品', weight: '5吨', amount: 4500, status: 'delivered', create_time: new Date() }
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
    const lowerSql = sql.toLowerCase();
    if (lowerSql.includes('vehicle')) return [mockData.carList, []];
    if (lowerSql.includes('order')) return [mockData.orderList, []];

    // 增加对用户角色的模拟数据返回（适配登录等场景）
    if ((lowerSql.includes('user') || lowerSql.includes('account')) && params && params.length > 0) {
      const username = params[0]; // 假设第一个参数是用户名
      if (mockData[username]) {
        return [[mockData[username]], []]; // 返回匹配的用户信息
      }
    }

    return [[], []];
  }

  // 连接成功则执行真实SQL
  try {
    return await pool.execute(sql, params);
  } catch (err) {
    console.error(`❌ SQL执行失败：${sql} | 错误：${err.message}`);
    return [[], []];
  }
};

// ===================== 4. 对外暴露（保持原有接口兼容） =====================
module.exports = {
  pool,        // 连接池实例（供特殊场景调用）
  query,       // 通用查询方法（Model层核心调用）
  mockData     // 模拟数据（连接失败时兜底）
};