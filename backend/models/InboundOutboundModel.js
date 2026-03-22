const db = require('../config/db');

class InboundOutboundModel {
  static async findAll(params = {}) {
    const { page = 1, size = 10, record_type, status, record_no } = params;
    try {
      let sql = 'SELECT * FROM inbound_outbound_records WHERE 1=1';
      const queryParams = [];

      if (record_type) {
        sql += ' AND record_type = ?';
        queryParams.push(record_type);
      }
      if (status) {
        sql += ' AND status = ?';
        queryParams.push(status);
      }
      if (record_no) {
        sql += ' AND record_no LIKE ?';
        queryParams.push(`%${record_no}%`);
      }

      const offset = (page - 1) * parseInt(size);
      const limit = parseInt(size);
      sql += ` ORDER BY create_time DESC LIMIT ${limit} OFFSET ${offset}`;
      
      const [rows] = await db.query(sql, queryParams);
      return rows;
    } catch (err) {
      console.error('查询出入库记录失败：', err);
      throw err;
    }
  }

  static async count(params = {}) {
    const { record_type, status, record_no } = params;
    try {
      let sql = 'SELECT COUNT(*) as total FROM inbound_outbound_records WHERE 1=1';
      const queryParams = [];

      if (record_type) {
        sql += ' AND record_type = ?';
        queryParams.push(record_type);
      }
      if (status) {
        sql += ' AND status = ?';
        queryParams.push(status);
      }
      if (record_no) {
        sql += ' AND record_no LIKE ?';
        queryParams.push(`%${record_no}%`);
      }

      const [rows] = await db.query(sql, queryParams);
      return rows[0].total;
    } catch (err) {
      console.error('统计出入库记录失败：', err);
      throw err;
    }
  }

  static async create(recordData) {
    const {
      record_no,
      record_type,
      order_no,
      goods_name,
      goods_type,
      quantity,
      unit,
      weight,
      volume,
      warehouse_name,
      warehouse_location,
      operator,
      vehicle_no,
      driver_name,
      status = 'pending',
      remark
    } = recordData;

    const sql = `
      INSERT INTO inbound_outbound_records 
      (record_no, record_type, order_no, goods_name, goods_type, quantity, unit, weight, volume, warehouse_name, warehouse_location, operator, vehicle_no, driver_name, status, remark) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await db.query(sql, [
      record_no,
      record_type,
      order_no,
      goods_name,
      goods_type,
      quantity,
      unit,
      weight,
      volume,
      warehouse_name,
      warehouse_location,
      operator,
      vehicle_no,
      driver_name,
      status,
      remark
    ]);
    return result.insertId;
  }

  static async update(id, updateData) {
    const {
      status,
      remark
    } = updateData;

    const sql = 'UPDATE inbound_outbound_records SET status = ?, remark = ? WHERE id = ?';
    const [result] = await db.query(sql, [status, remark, id]);
    return result.affectedRows;
  }

  static async delete(id) {
    const sql = 'DELETE FROM inbound_outbound_records WHERE id = ?';
    const [result] = await db.query(sql, [id]);
    return result.affectedRows;
  }

  static async findById(id) {
    const sql = 'SELECT * FROM inbound_outbound_records WHERE id = ?';
    const [rows] = await db.query(sql, [id]);
    return rows[0];
  }

  static async getStatistics() {
    try {
      const sql = `
        SELECT 
          record_type,
          status,
          COUNT(*) as count,
          SUM(quantity) as total_quantity,
          SUM(weight) as total_weight
        FROM inbound_outbound_records
        GROUP BY record_type, status
      `;
      const [rows] = await db.query(sql);
      return rows;
    } catch (err) {
      console.error('获取出入库统计失败：', err);
      throw err;
    }
  }
}

module.exports = InboundOutboundModel;
