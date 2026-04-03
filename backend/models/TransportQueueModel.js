const db = require('../config/db');

class TransportQueueModel {
  static async findAll(params = {}) {
    const { page = 1, size = 10, status, priority, queue_no } = params;
    try {
      let sql = 'SELECT * FROM transport_queue WHERE 1=1';
      const queryParams = [];

      if (status) {
        sql += ' AND status = ?';
        queryParams.push(status);
      }
      if (priority) {
        sql += ' AND priority = ?';
        queryParams.push(priority);
      }
      if (queue_no) {
        sql += ' AND queue_no LIKE ?';
        queryParams.push(`%${queue_no}%`);
      }

      const offset = (page - 1) * parseInt(size);
      const limit = parseInt(size);
      sql += ` ORDER BY FIELD(priority, 'high', 'normal', 'low'), create_time ASC LIMIT ${limit} OFFSET ${offset}`;
      
      const [rows] = await db.query(sql, queryParams);
      return rows;
    } catch (err) {
      console.error('查询运输队列失败：', err);
      throw err;
    }
  }

  static async count(params = {}) {
    const { status, priority, queue_no } = params;
    try {
      let sql = 'SELECT COUNT(*) as total FROM transport_queue WHERE 1=1';
      const queryParams = [];

      if (status) {
        sql += ' AND status = ?';
        queryParams.push(status);
      }
      if (priority) {
        sql += ' AND priority = ?';
        queryParams.push(priority);
      }
      if (queue_no) {
        sql += ' AND queue_no LIKE ?';
        queryParams.push(`%${queue_no}%`);
      }

      const [rows] = await db.query(sql, queryParams);
      return rows[0].total;
    } catch (err) {
      console.error('统计运输队列失败：', err);
      throw err;
    }
  }

  static async create(queueData) {
    const {
      queue_no,
      order_no,
      priority,
      status = 'waiting',
      goods_name,
      goods_type,
      quantity,
      weight,
      volume,
      sender_address,
      receiver_address,
      driver_id,
      driver_name,
      vehicle_no,
      estimated_arrival_time
    } = queueData;

    // 根据货物类型自动设置优先级
    let autoPriority = 'low';
    if (goods_type === '生鲜食品') {
      autoPriority = 'high';
    } else if (goods_type === '贵重物品') {
      autoPriority = 'normal';
    } else if (goods_type === '危险品') {
      throw new Error('危险品不受理');
    } else if (['普通货物', '电子产品', '大件货物'].includes(goods_type)) {
      autoPriority = 'low';
    }

    // 使用自动计算的优先级，如果用户没有手动指定
    const finalPriority = priority || autoPriority;

    const sql = `
      INSERT INTO transport_queue 
      (queue_no, order_no, priority, status, goods_name, goods_type, quantity, weight, volume, sender_address, receiver_address, driver_id, driver_name, vehicle_no, estimated_arrival_time) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await db.query(sql, [
      queue_no,
      order_no,
      finalPriority,
      status,
      goods_name,
      goods_type,
      quantity,
      weight,
      volume,
      sender_address,
      receiver_address,
      driver_id,
      driver_name,
      vehicle_no,
      estimated_arrival_time
    ]);
    return result.insertId;
  }

  static async update(id, updateData) {
    const {
      status,
      driver_id,
      driver_name,
      vehicle_no,
      estimated_arrival_time,
      actual_arrival_time
    } = updateData;

    const sql = `
      UPDATE transport_queue 
      SET status = ?, driver_id = ?, driver_name = ?, vehicle_no = ?, estimated_arrival_time = ?, actual_arrival_time = ? 
      WHERE id = ?
    `;
    const [result] = await db.query(sql, [
      status,
      driver_id,
      driver_name,
      vehicle_no,
      estimated_arrival_time,
      actual_arrival_time,
      id
    ]);
    return result.affectedRows;
  }

  static async delete(id) {
    const sql = 'DELETE FROM transport_queue WHERE id = ?';
    const [result] = await db.query(sql, [id]);
    return result.affectedRows;
  }

  static async findById(id) {
    const sql = 'SELECT * FROM transport_queue WHERE id = ?';
    const [rows] = await db.query(sql, [id]);
    return rows[0];
  }

  static async getStatistics() {
    try {
      const sql = `
        SELECT 
          status,
          priority,
          COUNT(*) as count,
          SUM(quantity) as total_quantity,
          SUM(weight) as total_weight
        FROM transport_queue
        GROUP BY status, priority
      `;
      const [rows] = await db.query(sql);
      return rows;
    } catch (err) {
      console.error('获取运输队列统计失败：', err);
      throw err;
    }
  }
}

module.exports = TransportQueueModel;
