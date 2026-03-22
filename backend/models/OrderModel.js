const db = require('../config/db');

// 根据地址获取坐标
function getCoordinatesFromAddress(address) {
  if (!address) return null;
  
  const cityCoordinates = {
    '杭州': [120.19, 30.26],
    '上海': [121.47, 31.23],
    '深圳': [114.07, 22.62],
    '北京': [116.40, 39.90],
    '广州': [113.23, 23.16],
    '成都': [104.06, 30.67],
    '西安': [108.95, 34.27],
    '武汉': [114.31, 30.52],
    '南京': [118.78, 32.04],
    '重庆': [106.55, 29.56],
    '天津': [117.20, 39.12],
    '青岛': [120.33, 36.07],
    '沈阳': [123.43, 41.80],
    '昆明': [102.71, 25.04],
    '长沙': [112.94, 28.23],
    '郑州': [113.66, 34.75],
    '东莞': [113.75, 23.04],
    '襄阳': [112.14, 32.01],
    '莫斯科': [37.62, 55.76]
  };
  
  for (const [city, coords] of Object.entries(cityCoordinates)) {
    if (address.includes(city)) {
      return coords;
    }
  }
  
  return null;
}

// 订单模拟数据
const mockOrders = [
  { 
    id: 1, 
    order_no: 'ORD20260317001', 
    customer_name: '阿里巴巴', 
    sender_address: '杭州市余杭区', 
    receiver_address: '上海市浦东新区', 
    goods_type: '生鲜', 
    weight: '2吨', 
    amount: 1500, 
    status: 'pending', 
    create_time: new Date(),
    sender_coord: getCoordinatesFromAddress('杭州市余杭区'),
    receiver_coord: getCoordinatesFromAddress('上海市浦东新区')
  },
  { 
    id: 2, 
    order_no: 'ORD20260317002', 
    customer_name: '腾讯', 
    sender_address: '深圳市南山区', 
    receiver_address: '北京市朝阳区', 
    goods_type: '电子产品', 
    weight: '1.5吨', 
    amount: 3200, 
    status: 'shipping', 
    create_time: new Date(),
    sender_coord: getCoordinatesFromAddress('深圳市南山区'),
    receiver_coord: getCoordinatesFromAddress('北京市朝阳区')
  },
  { 
    id: 3, 
    order_no: 'ORD20260317003', 
    customer_name: '京东', 
    sender_address: '北京市大兴区', 
    receiver_address: '广州市天河区', 
    goods_type: '日用品', 
    weight: '5吨', 
    amount: 4500, 
    status: 'delivered', 
    create_time: new Date(),
    sender_coord: getCoordinatesFromAddress('北京市大兴区'),
    receiver_coord: getCoordinatesFromAddress('广州市天河区')
  }
];

class OrderModel {
  // 获取订单列表 (支持分页、状态筛选、关键字搜索)
  static async findAll(params = {}) {
    const { page = 1, size = 10, order_no, status, customer_name } = params;
    try {
      let sql = 'SELECT * FROM orders WHERE 1=1';
      const queryParams = [];

      if (order_no) {
        sql += ' AND order_no LIKE ?';
        queryParams.push(`%${order_no}%`);
      }
      if (status) {
        sql += ' AND status = ?';
        queryParams.push(status);
      }
      if (customer_name) {
        sql += ' AND customer_name LIKE ?';
        queryParams.push(`%${customer_name}%`);
      }

      const offset = (page - 1) * parseInt(size);
      const limit = parseInt(size);
      sql += ` ORDER BY create_time DESC LIMIT ${limit} OFFSET ${offset}`;
      const [rows] = await db.query(sql, queryParams);
      
      if (rows && rows.length > 0) {
        return rows.map(order => {
          return {
            ...order,
            sender_coord: getCoordinatesFromAddress(order.sender_address),
            receiver_coord: getCoordinatesFromAddress(order.receiver_address)
          };
        });
      }
      
      // 数据库无数据时，使用 Mock 数据并进行内存筛选和分页
      let filtered = [...mockOrders];
      if (order_no) filtered = filtered.filter(o => o.order_no.includes(order_no));
      if (status) filtered = filtered.filter(o => o.status === status);
      if (customer_name) filtered = filtered.filter(o => o.customer_name.includes(customer_name));
      
      const start = (page - 1) * size;
      const end = start + parseInt(size);
      return filtered.slice(start, end);

    } catch (err) {
      console.warn('查询订单失败，回退到模拟数据:', err.message);
      return mockOrders.slice(0, size);
    }
  }

  // 统计订单数量
  static async count(params = {}) {
    const { order_no, status, customer_name } = params;
    try {
      let sql = 'SELECT COUNT(*) as total FROM orders WHERE 1=1';
      const queryParams = [];

      if (order_no) {
        sql += ' AND order_no LIKE ?';
        queryParams.push(`%${order_no}%`);
      }
      if (status) {
        sql += ' AND status = ?';
        queryParams.push(status);
      }
      if (customer_name) {
        sql += ' AND customer_name LIKE ?';
        queryParams.push(`%${customer_name}%`);
      }

      const [rows] = await db.query(sql, queryParams);
      if (rows && rows[0] && rows[0].total > 0) return rows[0].total;
      
      // 数据库无数据时，对 Mock 数据进行内存筛选后统计
      let filtered = [...mockOrders];
      if (order_no) filtered = filtered.filter(o => o.order_no.includes(order_no));
      if (status) filtered = filtered.filter(o => o.status === status);
      if (customer_name) filtered = filtered.filter(o => o.customer_name.includes(customer_name));
      return filtered.length;

    } catch (err) {
      return mockOrders.length;
    }
  }

  // 创建订单
  static async create(orderData) {
    const { 
      order_no, 
      customer_name, 
      sender_address, 
      receiver_address, 
      goods_type = '普通货物', 
      weight = 1.0, 
      volume = 0.1,
      base_price = 100.0,
      amount = 1000.0, 
      status = 'pending' 
    } = orderData;
    
    const sql = `
      INSERT INTO orders 
      (order_no, customer_name, sender_address, receiver_address, goods_type, weight, volume, amount, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await db.query(sql, [
      order_no, 
      customer_name, 
      sender_address, 
      receiver_address, 
      goods_type, 
      weight, 
      volume, 
      amount, 
      status
    ]);
    return result.insertId;
  }

  // 更新订单状态
  static async updateStatus(id, status, reason = '') {
    const sql = 'UPDATE orders SET status = ?, exception_reason = ? WHERE id = ?';
    const [result] = await db.query(sql, [status, reason, id]);
    return result.affectedRows;
  }

  // 获取订单详情
  static async findById(id) {
    const sql = 'SELECT * FROM orders WHERE id = ?';
    const [rows] = await db.query(sql, [id]);
    return rows[0];
  }
}

module.exports = OrderModel;
