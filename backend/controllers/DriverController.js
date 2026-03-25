const db = require('../config/db');

class DriverController {
  async getDriverList(req, res) {
    try {
      const { status, keyword, page = 1, pageSize = 10 } = req.query;
      
      let sql = `
        SELECT 
          d.*,
          COUNT(DISTINCT tt.id) as current_task_count,
          v.car_no as current_vehicle
        FROM drivers d
        LEFT JOIN vehicles v ON d.driver_name = v.driver_name
        LEFT JOIN transport_tasks tt ON v.id = tt.vehicle_id AND tt.status IN ('pending', 'in_transit')
        WHERE 1=1
      `;
      const params = [];
      
      if (status) {
        sql += ' AND d.status = ?';
        params.push(status);
      }
      
      if (keyword) {
        sql += ' AND (d.driver_name LIKE ? OR d.phone LIKE ?)';
        params.push(`%${keyword}%`, `%${keyword}%`);
      }
      
      sql += ' GROUP BY d.id ORDER BY d.create_time DESC';
      
      const [drivers] = await db.query(sql, params);
      
      const total = drivers.length;
      const start = (page - 1) * pageSize;
      const paginatedDrivers = drivers.slice(start, start + parseInt(pageSize));
      
      res.json({
        code: 200,
        msg: 'success',
        data: {
          list: paginatedDrivers,
          total: total,
          page: parseInt(page),
          pageSize: parseInt(pageSize)
        }
      });
    } catch (err) {
      console.error('获取司机列表失败:', err);
      res.json({
        code: 500,
        msg: '获取司机列表失败',
        data: { list: [], total: 0 }
      });
    }
  }

  async getDriverDetail(req, res) {
    try {
      const { id } = req.params;
      
      const [drivers] = await db.query(`
        SELECT 
          d.*,
          v.car_no as current_vehicle,
          v.status as vehicle_status
        FROM drivers d
        LEFT JOIN vehicles v ON d.driver_name = v.driver_name
        WHERE d.id = ?
      `, [id]);
      
      if (drivers.length === 0) {
        return res.json({
          code: 404,
          msg: '司机不存在',
          data: null
        });
      }
      
      const driver = drivers[0];
      
      const [taskCounts] = await db.query(`
        SELECT 
          COUNT(*) as total_tasks,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
          SUM(CASE WHEN status IN ('pending', 'in_transit') THEN 1 ELSE 0 END) as active_tasks
        FROM transport_tasks tt
        JOIN vehicles v ON tt.vehicle_id = v.id
        WHERE v.driver_name = ?
      `, [driver.driver_name]);
      
      driver.total_tasks = taskCounts[0].total_tasks || 0;
      driver.completed_tasks = taskCounts[0].completed_tasks || 0;
      driver.active_tasks = taskCounts[0].active_tasks || 0;
      
      res.json({
        code: 200,
        msg: 'success',
        data: driver
      });
    } catch (err) {
      console.error('获取司机详情失败:', err);
      res.json({
        code: 500,
        msg: '获取司机详情失败',
        data: null
      });
    }
  }

  async createDriver(req, res) {
    try {
      console.log('收到的请求数据:', req.body);
      
      const {
        driver_name,
        phone,
        id_card,
        license_no,
        license_type,
        hire_date,
        avatar
      } = req.body;
      
      console.log('解构后的数据:', { driver_name, phone, id_card, license_no, license_type, hire_date, avatar });
      
      if (!driver_name || !phone) {
        return res.json({
          code: 400,
          msg: '司机姓名和联系电话为必填项',
          data: null
        });
      }
      
      const [result] = await db.query(`
        INSERT INTO drivers (
          driver_name, phone, id_card, license_no, license_type,
          hire_date, avatar
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        driver_name, 
        phone, 
        id_card || null, 
        license_no || null, 
        license_type || null,
        hire_date || null,
        avatar || null
      ]);
      
      console.log('插入结果:', result);
      
      res.json({
        code: 200,
        msg: '创建司机成功',
        data: { id: result.insertId }
      });
    } catch (err) {
      console.error('创建司机失败:', err);
      res.json({
        code: 500,
        msg: '创建司机失败',
        data: null
      });
    }
  }

  async updateDriver(req, res) {
    try {
      const { id } = req.params;
      const {
        driver_name,
        phone,
        id_card,
        license_no,
        license_type,
        license_expire_date,
        address,
        emergency_contact,
        emergency_phone,
        status,
        total_mileage,
        total_orders,
        rating,
        avatar
      } = req.body;
      
      const [result] = await db.query(`
        UPDATE drivers SET
          driver_name = ?,
          phone = ?,
          id_card = ?,
          license_no = ?,
          license_type = ?,
          license_expire_date = ?,
          address = ?,
          emergency_contact = ?,
          emergency_phone = ?,
          status = ?,
          total_mileage = ?,
          total_orders = ?,
          rating = ?,
          avatar = ?
        WHERE id = ?
      `, [
        driver_name, phone, id_card, license_no, license_type,
        license_expire_date, address, emergency_contact, emergency_phone,
        status, total_mileage, total_orders, rating, avatar, id
      ]);
      
      if (result.affectedRows === 0) {
        return res.json({
          code: 404,
          msg: '司机不存在',
          data: null
        });
      }
      
      res.json({
        code: 200,
        msg: '更新司机成功',
        data: null
      });
    } catch (err) {
      console.error('更新司机失败:', err);
      res.json({
        code: 500,
        msg: '更新司机失败',
        data: null
      });
    }
  }

  async deleteDriver(req, res) {
    try {
      const { id } = req.params;
      
      const [result] = await db.query('DELETE FROM drivers WHERE id = ?', [id]);
      
      if (result.affectedRows === 0) {
        return res.json({
          code: 404,
          msg: '司机不存在',
          data: null
        });
      }
      
      res.json({
        code: 200,
        msg: '删除司机成功',
        data: null
      });
    } catch (err) {
      console.error('删除司机失败:', err);
      res.json({
        code: 500,
        msg: '删除司机失败',
        data: null
      });
    }
  }

  async getDriverVehicles(req, res) {
    try {
      const { id } = req.params;
      
      const [driver] = await db.query('SELECT driver_name FROM drivers WHERE id = ?', [id]);
      
      if (driver.length === 0) {
        return res.json({
          code: 404,
          msg: '司机不存在',
          data: []
        });
      }
      
      const [vehicles] = await db.query(`
        SELECT 
          v.*,
          d.driver_name
        FROM vehicles v
        LEFT JOIN drivers d ON v.driver_name = d.driver_name
        WHERE v.driver_name = ?
        ORDER BY v.create_time DESC
      `, [driver[0].driver_name]);
      
      res.json({
        code: 200,
        msg: 'success',
        data: vehicles
      });
    } catch (err) {
      console.error('获取司机车辆信息失败:', err);
      res.json({
        code: 500,
        msg: '获取司机车辆信息失败',
        data: []
      });
    }
  }

  async getDriverTasks(req, res) {
    try {
      const { id } = req.params;
      const { status, page = 1, pageSize = 10 } = req.query;
      
      let sql = `
        SELECT 
          tt.*,
          o.order_no,
          o.customer_name,
          o.sender_address,
          o.receiver_address,
          v.car_no
        FROM transport_tasks tt
        LEFT JOIN orders o ON tt.order_id = o.id
        LEFT JOIN vehicles v ON tt.vehicle_id = v.id
        WHERE tt.driver_id = ?
      `;
      const params = [id];
      
      if (status) {
        sql += ' AND tt.status = ?';
        params.push(status);
      }
      
      sql += ' ORDER BY tt.create_time DESC';
      
      const [tasks] = await db.query(sql, params);
      
      const total = tasks.length;
      const start = (page - 1) * pageSize;
      const paginatedTasks = tasks.slice(start, start + parseInt(pageSize));
      
      res.json({
        code: 200,
        msg: 'success',
        data: {
          list: paginatedTasks,
          total: total,
          page: parseInt(page),
          pageSize: parseInt(pageSize)
        }
      });
    } catch (err) {
      console.error('获取司机任务列表失败:', err);
      res.json({
        code: 500,
        msg: '获取司机任务列表失败',
        data: { list: [], total: 0 }
      });
    }
  }
}

module.exports = new DriverController();
