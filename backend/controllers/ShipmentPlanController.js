const db = require('../config/db');

class ShipmentPlanController {
  async getShipmentPlanList(req, res) {
    try {
      const { 
        status, 
        customer_id,
        driver_id,
        keyword,
        page = 1, 
        pageSize = 10 
      } = req.query;
      
      let sql = `
        SELECT sp.*, c.customer_name, d.driver_name, v.car_no
        FROM shipment_plans sp
        LEFT JOIN customers c ON sp.customer_id = c.id
        LEFT JOIN drivers d ON sp.driver_id = d.id
        LEFT JOIN vehicles v ON d.driver_name = v.driver_name
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
      
      res.json({
        code: 200,
        msg: 'success',
        data: {
          list: paginatedPlans,
          total: total,
          page: parseInt(page),
          pageSize: parseInt(pageSize)
        }
      });
    } catch (err) {
      console.error('获取装运计划列表失败:', err);
      res.json({
        code: 500,
        msg: '获取装运计划列表失败',
        data: { list: [], total: 0 }
      });
    }
  }

  async getShipmentPlanDetail(req, res) {
    try {
      const { id } = req.params;
      
      const [plans] = await db.query(`
        SELECT sp.*, c.customer_name, c.contact_person, c.contact_phone,
               d.driver_name, d.phone as driver_phone, v.car_no
        FROM shipment_plans sp
        LEFT JOIN customers c ON sp.customer_id = c.id
        LEFT JOIN drivers d ON sp.driver_id = d.id
        LEFT JOIN vehicles v ON d.driver_name = v.driver_name
        WHERE sp.id = ?
      `, [id]);
      
      if (plans.length === 0) {
        return res.json({
          code: 404,
          msg: '装运计划不存在',
          data: null
        });
      }
      
      const plan = plans[0];
      
      const [tasks] = await db.query(`
        SELECT * FROM transport_tasks 
        WHERE shipment_plan_id = ?
        ORDER BY create_time DESC
      `, [id]);
      
      res.json({
        code: 200,
        msg: 'success',
        data: {
          ...plan,
          tasks: tasks
        }
      });
    } catch (err) {
      console.error('获取装运计划详情失败:', err);
      res.json({
        code: 500,
        msg: '获取装运计划详情失败',
        data: null
      });
    }
  }

  async createShipmentPlan(req, res) {
    try {
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
      } = req.body;
      
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
      
      await db.query(sql, params);
      
      res.json({
        code: 200,
        msg: '创建装运计划成功',
        data: { plan_no }
      });
    } catch (err) {
      console.error('创建装运计划失败:', err);
      res.json({
        code: 500,
        msg: '创建装运计划失败',
        data: null
      });
    }
  }

  async updateShipmentPlan(req, res) {
    try {
      const { id } = req.params;
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
      } = req.body;
      
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
      
      res.json({
        code: 200,
        msg: '更新装运计划成功',
        data: null
      });
    } catch (err) {
      console.error('更新装运计划失败:', err);
      res.json({
        code: 500,
        msg: '更新装运计划失败',
        data: null
      });
    }
  }

  async deleteShipmentPlan(req, res) {
    try {
      const { id } = req.params;
      
      await db.query('DELETE FROM shipment_plans WHERE id = ?', [id]);
      
      res.json({
        code: 200,
        msg: '删除装运计划成功',
        data: null
      });
    } catch (err) {
      console.error('删除装运计划失败:', err);
      res.json({
        code: 500,
        msg: '删除装运计划失败',
        data: null
      });
    }
  }

  async confirmShipmentPlan(req, res) {
    try {
      const { id } = req.params;
      
      await db.query(`
        UPDATE shipment_plans SET
          status = 'confirmed'
        WHERE id = ?
      `, [id]);
      
      res.json({
        code: 200,
        msg: '确认装运计划成功',
        data: null
      });
    } catch (err) {
      console.error('确认装运计划失败:', err);
      res.json({
        code: 500,
        msg: '确认装运计划失败',
        data: null
      });
    }
  }

  async startShipmentPlan(req, res) {
    try {
      const { id } = req.params;
      
      await db.query(`
        UPDATE shipment_plans SET
          status = 'in_transit',
          progress = 0
        WHERE id = ?
      `, [id]);
      
      res.json({
        code: 200,
        msg: '开始装运成功',
        data: null
      });
    } catch (err) {
      console.error('开始装运失败:', err);
      res.json({
        code: 500,
        msg: '开始装运失败',
        data: null
      });
    }
  }

  async completeShipmentPlan(req, res) {
    try {
      const { id } = req.params;
      const { actual_cost } = req.body;
      
      await db.query(`
        UPDATE shipment_plans SET
          status = 'completed',
          progress = 100,
          actual_cost = ?
        WHERE id = ?
      `, [actual_cost, id]);
      
      res.json({
        code: 200,
        msg: '完成装运成功',
        data: null
      });
    } catch (err) {
      console.error('完成装运失败:', err);
      res.json({
        code: 500,
        msg: '完成装运失败',
        data: null
      });
    }
  }

  async getShipmentPlanStats(req, res) {
    try {
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
      
      const [recentPlans] = await db.query(`
        SELECT sp.*, c.customer_name, d.driver_name
        FROM shipment_plans sp
        LEFT JOIN customers c ON sp.customer_id = c.id
        LEFT JOIN drivers d ON sp.driver_id = d.id
        WHERE sp.status IN ('draft', 'confirmed', 'in_transit')
        ORDER BY sp.pickup_date DESC
        LIMIT 5
      `);
      
      res.json({
        code: 200,
        msg: 'success',
        data: {
          stats: stats[0],
          recent_plans: recentPlans
        }
      });
    } catch (err) {
      console.error('获取装运计划统计失败:', err);
      res.json({
        code: 500,
        msg: '获取装运计划统计失败',
        data: null
      });
    }
  }
}

module.exports = new ShipmentPlanController();
