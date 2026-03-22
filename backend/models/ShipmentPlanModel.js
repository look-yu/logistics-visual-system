const db = require('../config/db');

class ShipmentPlanModel {
  async getShipmentPlanList(filters = {}) {
    const { 
      status, 
      customer_id,
      driver_id,
      keyword,
      page = 1, 
      pageSize = 10 
    } = filters;
    
    let sql = `
      SELECT sp.*, c.customer_name, d.driver_name, v.car_no
      FROM shipment_plans sp
      LEFT JOIN customers c ON sp.customer_id = c.id
      LEFT JOIN drivers d ON sp.driver_id = d.id
      LEFT JOIN vehicles v ON d.id = v.driver_id AND v.status = 'busy'
      WHERE 1=1
    `;
    const params = [];
    
    if (status) {
      sql += ' AND sp.status = ?';
      params.push(status);
    }
    
    if (customer_id) {
      sql += ' AND sp.customer_id = ?';
      params.push(customer_id);
    }
    
    if (driver_id) {
      sql += ' AND sp.driver_id = ?';
      params.push(driver_id);
    }
    
    if (keyword) {
      sql += ' AND (sp.plan_name LIKE ? OR sp.plan_no LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }
    
    sql += ' ORDER BY sp.create_time DESC';
    
    const [plans] = await db.query(sql, params);
    
    const total = plans.length;
    const start = (page - 1) * pageSize;
    const paginatedPlans = plans.slice(start, start + parseInt(pageSize));
    
    return {
      list: paginatedPlans,
      total: total,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    };
  }

  async getShipmentPlanById(id) {
    const [plans] = await db.query(`
      SELECT sp.*, c.customer_name, c.contact_person, c.contact_phone,
             d.driver_name, d.phone as driver_phone, v.car_no
      FROM shipment_plans sp
      LEFT JOIN customers c ON sp.customer_id = c.id
      LEFT JOIN drivers d ON sp.driver_id = d.id
      LEFT JOIN vehicles v ON d.id = v.driver_id AND v.status = 'busy'
      WHERE sp.id = ?
    `, [id]);
    return plans[0];
  }

  async getShipmentPlanByNo(plan_no) {
    const [plans] = await db.query('SELECT * FROM shipment_plans WHERE plan_no = ?', [plan_no]);
    return plans[0];
  }

  async createShipmentPlan(planData) {
    const {
      plan_name,
      customer_id,
      order_id,
      goods_type,
      goods_name,
      goods_quantity,
      goods_weight,
      goods_volume,
      pickup_address,
      delivery_address,
      pickup_date,
      delivery_date,
      vehicle_type,
      driver_id,
      transport_mode,
      estimated_cost,
      special_requirements,
      remarks,
      created_by
    } = planData;
    
    const plan_no = 'SP' + Date.now();
    
    const sql = `
      INSERT INTO shipment_plans (
        plan_no, plan_name, customer_id, order_id, goods_type, goods_name,
        goods_quantity, goods_weight, goods_volume, pickup_address,
        delivery_address, pickup_date, delivery_date, vehicle_type,
        driver_id, transport_mode, estimated_cost, special_requirements,
        remarks, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      plan_no,
      plan_name,
      customer_id,
      order_id,
      goods_type,
      goods_name,
      goods_quantity,
      goods_weight,
      goods_volume,
      pickup_address,
      delivery_address,
      pickup_date,
      delivery_date,
      vehicle_type,
      driver_id,
      transport_mode || 'road',
      estimated_cost,
      special_requirements,
      remarks,
      created_by
    ];
    
    const [result] = await db.query(sql, params);
    return { insertId: result.insertId, plan_no };
  }

  async updateShipmentPlan(id, planData) {
    const {
      plan_name,
      customer_id,
      order_id,
      goods_type,
      goods_name,
      goods_quantity,
      goods_weight,
      goods_volume,
      pickup_address,
      delivery_address,
      pickup_date,
      delivery_date,
      vehicle_type,
      driver_id,
      transport_mode,
      estimated_cost,
      actual_cost,
      special_requirements,
      status,
      progress,
      remarks
    } = planData;
    
    const sql = `
      UPDATE shipment_plans SET
        plan_name = ?,
        customer_id = ?,
        order_id = ?,
        goods_type = ?,
        goods_name = ?,
        goods_quantity = ?,
        goods_weight = ?,
        goods_volume = ?,
        pickup_address = ?,
        delivery_address = ?,
        pickup_date = ?,
        delivery_date = ?,
        vehicle_type = ?,
        driver_id = ?,
        transport_mode = ?,
        estimated_cost = ?,
        actual_cost = ?,
        special_requirements = ?,
        status = ?,
        progress = ?,
        remarks = ?
      WHERE id = ?
    `;
    
    const params = [
      plan_name,
      customer_id,
      order_id,
      goods_type,
      goods_name,
      goods_quantity,
      goods_weight,
      goods_volume,
      pickup_address,
      delivery_address,
      pickup_date,
      delivery_date,
      vehicle_type,
      driver_id,
      transport_mode,
      estimated_cost,
      actual_cost,
      special_requirements,
      status,
      progress,
      remarks,
      id
    ];
    
    await db.query(sql, params);
  }

  async deleteShipmentPlan(id) {
    await db.query('DELETE FROM shipment_plans WHERE id = ?', [id]);
  }

  async confirmShipmentPlan(id) {
    await db.query(`
      UPDATE shipment_plans SET
        status = 'confirmed'
      WHERE id = ?
    `, [id]);
  }

  async startShipmentPlan(id) {
    await db.query(`
      UPDATE shipment_plans SET
        status = 'in_transit',
        progress = 0
      WHERE id = ?
    `, [id]);
  }

  async completeShipmentPlan(id, actual_cost) {
    await db.query(`
      UPDATE shipment_plans SET
        status = 'completed',
        progress = 100,
        actual_cost = ?
      WHERE id = ?
    `, [actual_cost, id]);
  }

  async updateProgress(id, progress) {
    await db.query(`
      UPDATE shipment_plans SET
        progress = ?
      WHERE id = ?
    `, [progress, id]);
  }

  async getShipmentPlanTasks(shipmentPlanId) {
    const [tasks] = await db.query(`
      SELECT * FROM transport_tasks 
      WHERE shipment_plan_id = ?
      ORDER BY create_time DESC
    `, [shipmentPlanId]);
    return tasks;
  }

  async getShipmentPlanStats() {
    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as total_plans,
        SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft_plans,
        SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_plans,
        SUM(CASE WHEN status = 'in_transit' THEN 1 ELSE 0 END) as in_transit_plans,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_plans,
        SUM(estimated_cost) as total_estimated_cost,
        SUM(actual_cost) as total_actual_cost
      FROM shipment_plans
    `);
    return stats[0];
  }

  async getRecentPlans(limit = 5) {
    const [plans] = await db.query(`
      SELECT sp.*, c.customer_name, d.driver_name
      FROM shipment_plans sp
      LEFT JOIN customers c ON sp.customer_id = c.id
      LEFT JOIN drivers d ON sp.driver_id = d.id
      WHERE sp.status IN ('draft', 'confirmed', 'in_transit')
      ORDER BY sp.pickup_date DESC
      LIMIT ?
    `, [limit]);
    return plans;
  }

  async getUpcomingPlans(limit = 5) {
    const [plans] = await db.query(`
      SELECT sp.*, c.customer_name, d.driver_name
      FROM shipment_plans sp
      LEFT JOIN customers c ON sp.customer_id = c.id
      LEFT JOIN drivers d ON sp.driver_id = d.id
      WHERE sp.status IN ('confirmed', 'in_transit')
        AND sp.pickup_date >= CURDATE()
      ORDER BY sp.pickup_date ASC
      LIMIT ?
    `, [limit]);
    return plans;
  }

  async getPlansByCustomer(customerId, limit = 10) {
    const [plans] = await db.query(`
      SELECT sp.*, d.driver_name, v.car_no
      FROM shipment_plans sp
      LEFT JOIN drivers d ON sp.driver_id = d.id
      LEFT JOIN vehicles v ON d.id = v.driver_id AND v.status = 'busy'
      WHERE sp.customer_id = ?
      ORDER BY sp.create_time DESC
      LIMIT ?
    `, [customerId, limit]);
    return plans;
  }

  async getPlansByDriver(driverId, limit = 10) {
    const [plans] = await db.query(`
      SELECT sp.*, c.customer_name
      FROM shipment_plans sp
      LEFT JOIN customers c ON sp.customer_id = c.id
      WHERE sp.driver_id = ?
      ORDER BY sp.create_time DESC
      LIMIT ?
    `, [driverId, limit]);
    return plans;
  }
}

module.exports = new ShipmentPlanModel();
