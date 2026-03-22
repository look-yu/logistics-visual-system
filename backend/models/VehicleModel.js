const db = require('../config/db');

class VehicleModel {
  // 获取所有车辆 (支持状态和车型筛选)
  static async findAll(params = {}) {
    const { status, car_type, car_no } = params;
    let sql = 'SELECT * FROM vehicles WHERE 1=1';
    const queryParams = [];

    if (status) {
      sql += ' AND status = ?';
      queryParams.push(status);
    }
    if (car_type) {
      sql += ' AND car_type = ?';
      queryParams.push(car_type);
    }
    if (car_no) {
      sql += ' AND car_no LIKE ?';
      queryParams.push(`%${car_no}%`);
    }

    const [rows] = await db.query(sql, queryParams);
    return rows;
  }

  // 更新车辆状态或位置
  static async update(id, updateData) {
    const fields = [];
    const values = [];
    for (const [key, value] of Object.entries(updateData)) {
      if (value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }
    if (fields.length === 0) return 0;

    const sql = `UPDATE vehicles SET ${fields.join(', ')} WHERE id = ?`;
    values.push(id);
    const [result] = await db.query(sql, values);
    return result.affectedRows;
  }

  // 创建运输任务
  static async createTransportTask(taskData) {
    const { task_no, order_id, vehicle_id, route_plan, cost } = taskData;
    const sql = 'INSERT INTO transport_tasks (task_no, order_id, vehicle_id, route_plan, cost, status) VALUES (?, ?, ?, ?, ?, "pending")';
    const [result] = await db.query(sql, [task_no, order_id, vehicle_id, JSON.stringify(route_plan), cost]);
    return result.insertId;
  }

  // 获取运输任务列表
  static async getTasks(params = {}) {
    const { status, vehicle_id } = params;
    let sql = `
      SELECT t.*, o.order_no, v.car_no, v.driver_name 
      FROM transport_tasks t
      JOIN orders o ON t.order_id = o.id
      JOIN vehicles v ON t.vehicle_id = v.id
      WHERE 1=1
    `;
    const queryParams = [];

    if (status) {
      sql += ' AND t.status = ?';
      queryParams.push(status);
    }
    if (vehicle_id) {
      sql += ' AND t.vehicle_id = ?';
      queryParams.push(vehicle_id);
    }

    const [rows] = await db.query(sql, queryParams);
    return rows;
  }

  // 更新任务状态
  static async updateTaskStatus(id, status, endTime = null) {
    let sql = 'UPDATE transport_tasks SET status = ?';
    const params = [status];
    if (endTime) {
      sql += ', end_time = ?';
      params.push(endTime);
    }
    sql += ' WHERE id = ?';
    params.push(id);
    const [result] = await db.query(sql, params);
    return result.affectedRows;
  }
}

module.exports = VehicleModel;
