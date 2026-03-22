const db = require('../config/db');

class DriverModel {
  async getDriverList(filters = {}) {
    const { status, keyword, page = 1, pageSize = 10 } = filters;
    
    let sql = `
      SELECT 
        d.*,
        v.car_no as current_vehicle
      FROM drivers d
      LEFT JOIN vehicles v ON d.driver_name = v.driver_name AND v.status = 'busy'
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
    
    sql += ' ORDER BY d.create_time DESC';
    
    const [drivers] = await db.query(sql, params);
    
    const total = drivers.length;
    const start = (page - 1) * pageSize;
    const paginatedDrivers = drivers.slice(start, start + parseInt(pageSize));
    
    paginatedDrivers.forEach(driver => {
      driver.current_task_count = 0;
    });
    
    return {
      list: paginatedDrivers,
      total: total,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    };
  }

  async getDriverById(id) {
    const [drivers] = await db.query(`
      SELECT 
        d.*,
        v.car_no as current_vehicle,
        v.status as vehicle_status
      FROM drivers d
      LEFT JOIN vehicles v ON d.driver_name = v.driver_name
      WHERE d.id = ?
    `, [id]);
    
    return drivers.length > 0 ? drivers[0] : null;
  }

  async createDriver(driverData) {
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
      hire_date,
      avatar
    } = driverData;
    
    const [result] = await db.query(`
      INSERT INTO drivers (
        driver_name, phone, id_card, license_no, license_type,
        license_expire_date, address, emergency_contact, emergency_phone,
        hire_date, avatar
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      driver_name, phone, id_card, license_no, license_type,
      license_expire_date, address, emergency_contact, emergency_phone,
      hire_date, avatar
    ]);
    
    return { id: result.insertId };
  }

  async updateDriver(id, driverData) {
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
    } = driverData;
    
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
    
    return result.affectedRows > 0;
  }

  async deleteDriver(id) {
    const [result] = await db.query('DELETE FROM drivers WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  async getDriverVehicles(id) {
    const [driver] = await db.query('SELECT driver_name FROM drivers WHERE id = ?', [id]);
    
    if (!driver || driver.length === 0) {
      return [];
    }
    
    const driverName = driver[0].driver_name;
    
    const [vehicles] = await db.query(`
      SELECT 
        v.*
      FROM vehicles v
      WHERE v.driver_name = ?
      ORDER BY v.create_time DESC
    `, [driverName]);
    
    return vehicles;
  }

  async getDriverTasks(id, filters = {}) {
    const { status, page = 1, pageSize = 10 } = filters;
    
    const [driver] = await db.query('SELECT driver_name FROM drivers WHERE id = ?', [id]);
    
    if (!driver || driver.length === 0) {
      return {
        list: [],
        total: 0,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      };
    }
    
    const driverName = driver[0].driver_name;
    
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
      WHERE v.driver_name = ?
    `;
    const params = [driverName];
    
    if (status) {
      sql += ' AND tt.status = ?';
      params.push(status);
    }
    
    sql += ' ORDER BY tt.create_time DESC';
    
    const [tasks] = await db.query(sql, params);
    
    const total = tasks.length;
    const start = (page - 1) * pageSize;
    const paginatedTasks = tasks.slice(start, start + parseInt(pageSize));
    
    return {
      list: paginatedTasks,
      total: total,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    };
  }

  async getDriverStats() {
    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as total_drivers,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_drivers,
        SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive_drivers,
        SUM(CASE WHEN status = 'on_leave' THEN 1 ELSE 0 END) as on_leave_drivers,
        AVG(rating) as avg_rating,
        SUM(total_orders) as total_orders,
        SUM(total_mileage) as total_mileage
      FROM drivers
    `);
    
    return stats[0];
  }
}

module.exports = new DriverModel();
