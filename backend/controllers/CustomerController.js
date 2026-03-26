const db = require('../config/db');

class CustomerController {
  async getCustomerList(req, res) {
    try {
      const { status, customer_type, keyword, page = 1, pageSize = 10 } = req.query;
      
      let sql = 'SELECT * FROM customers WHERE 1=1';
      const params = [];
      
      if (status) {
        sql += ' AND status = ?';
        params.push(status);
      }
      
      if (customer_type) {
        sql += ' AND customer_type = ?';
        params.push(customer_type);
      }
      
      if (keyword) {
        sql += ' AND (customer_name LIKE ? OR customer_code LIKE ? OR contact_person LIKE ?)';
        params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
      }
      
      sql += ' ORDER BY create_time DESC';
      
      const [customers] = await db.query(sql, params);
      
      const total = customers.length;
      const start = (page - 1) * pageSize;
      const paginatedCustomers = customers.slice(start, start + parseInt(pageSize));
      
      res.json({
        code: 200,
        msg: 'success',
        data: {
          list: paginatedCustomers,
          total: total,
          page: parseInt(page),
          pageSize: parseInt(pageSize)
        }
      });
    } catch (err) {
      console.error('获取客户列表失败:', err);
      res.json({
        code: 500,
        msg: '获取客户列表失败',
        data: { list: [], total: 0 }
      });
    }
  }

  async getCustomerDetail(req, res) {
    try {
      const { id } = req.params;
      
      const [customers] = await db.query('SELECT * FROM customers WHERE id = ?', [id]);
      
      if (customers.length === 0) {
        return res.json({
          code: 404,
          msg: '客户不存在',
          data: null
        });
      }
      
      const customer = customers[0];
      
      const [orders] = await db.query(
        'SELECT * FROM orders WHERE customer_id = ? ORDER BY create_time DESC LIMIT 10',
        [id]
      );
      
      const [requests] = await db.query(
        'SELECT * FROM service_requests WHERE customer_id = ? ORDER BY create_time DESC LIMIT 10',
        [id]
      );
      
      res.json({
        code: 200,
        msg: 'success',
        data: {
          ...customer,
          recent_orders: orders,
          recent_requests: requests
        }
      });
    } catch (err) {
      console.error('获取客户详情失败:', err);
      res.json({
        code: 500,
        msg: '获取客户详情失败',
        data: null
      });
    }
  }

  async createCustomer(req, res) {
    try {
      const {
        customer_code,
        customer_name,
        contact_person,
        contact_phone,
        contact_email,
        company_address,
        customer_type,
        credit_rating,
        credit_limit,
        remarks,
        created_by
      } = req.body;
      
      const sql = `
        INSERT INTO customers (
          customer_code, customer_name, contact_person, contact_phone,
          contact_email, company_address, customer_type, credit_rating,
          credit_limit, remarks, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const params = [
        customer_code,
        customer_name,
        contact_person,
        contact_phone,
        contact_email,
        company_address,
        customer_type || 'regular',
        credit_rating || 'A',
        credit_limit || 0,
        remarks,
        created_by
      ];
      
      await db.query(sql, params);
      
      res.json({
        code: 200,
        msg: '创建客户成功',
        data: null
      });
    } catch (err) {
      console.error('创建客户失败:', err);
      res.json({
        code: 500,
        msg: '创建客户失败',
        data: null
      });
    }
  }

  async updateCustomer(req, res) {
    try {
      const { id } = req.params;
      const {
        customer_name,
        contact_person,
        contact_phone,
        contact_email,
        company_address,
        customer_type,
        credit_rating,
        credit_limit,
        status,
        remarks
      } = req.body;
      
      const sql = `
        UPDATE customers SET
          customer_name = ?,
          contact_person = ?,
          contact_phone = ?,
          contact_email = ?,
          company_address = ?,
          customer_type = ?,
          credit_rating = ?,
          credit_limit = ?,
          status = ?,
          remarks = ?
        WHERE id = ?
      `;
      
      const params = [
        customer_name,
        contact_person,
        contact_phone,
        contact_email,
        company_address,
        customer_type,
        credit_rating,
        credit_limit,
        status,
        remarks,
        id
      ];
      
      await db.query(sql, params);
      
      res.json({
        code: 200,
        msg: '更新客户成功',
        data: null
      });
    } catch (err) {
      console.error('更新客户失败:', err);
      res.json({
        code: 500,
        msg: '更新客户失败',
        data: null
      });
    }
  }

  async deleteCustomer(req, res) {
    try {
      const { id } = req.params;
      
      await db.query('DELETE FROM customers WHERE id = ?', [id]);
      
      res.json({
        code: 200,
        msg: '删除客户成功',
        data: null
      });
    } catch (err) {
      console.error('删除客户失败:', err);
      res.json({
        code: 500,
        msg: '删除客户失败',
        data: null
      });
    }
  }

  async getCustomerStats(req, res) {
    try {
      const [totalStats] = await db.query(`
        SELECT 
          COUNT(*) as total_customers,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_customers,
          SUM(CASE WHEN customer_type = 'vip' THEN 1 ELSE 0 END) as vip_customers,
          SUM(CASE WHEN customer_type = 'strategic' THEN 1 ELSE 0 END) as strategic_customers,
          SUM(total_orders) as total_orders,
          SUM(total_amount) as total_amount
        FROM customers
      `);
      
      const [recentCustomers] = await db.query(`
        SELECT * FROM customers 
        WHERE status = 'active'
        ORDER BY create_time DESC 
        LIMIT 5
      `);
      
      res.json({
        code: 200,
        msg: 'success',
        data: {
          stats: totalStats[0],
          recent_customers: recentCustomers
        }
      });
    } catch (err) {
      console.error('获取客户统计失败:', err);
      res.json({
        code: 500,
        msg: '获取客户统计失败',
        data: { stats: {}, recent_customers: [] }
      });
    }
  }

  async getAddressList(req, res) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.json({
          code: 400,
          msg: '客户ID不能为空',
          data: []
        });
      }
      
      const [addresses] = await db.query(
        'SELECT * FROM customer_addresses WHERE customer_id = ? ORDER BY is_default DESC, create_time DESC',
        [id]
      );
      
      res.json({
        code: 200,
        msg: 'success',
        data: addresses
      });
    } catch (err) {
      console.error('获取收货地址失败:', err);
      res.json({
        code: 500,
        msg: '获取收货地址失败',
        data: []
      });
    }
  }

  async addAddress(req, res) {
    try {
      const { customer_id, receiver_name, phone, province, city, district, detail_address, is_default } = req.body;
      
      if (!customer_id || !receiver_name || !phone || !province || !city || !district || !detail_address) {
        return res.json({
          code: 400,
          msg: '参数不完整',
          data: null
        });
      }
      
      let sql = `
        INSERT INTO customer_addresses (
          customer_id, receiver_name, phone, province, city, district, detail_address, is_default
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const params = [customer_id, receiver_name, phone, province, city, district, detail_address, is_default ? 1 : 0];
      
      if (is_default) {
        await db.query(
          'UPDATE customer_addresses SET is_default = 0 WHERE customer_id = ?',
          [customer_id]
        );
      }
      
      await db.query(sql, params);
      
      res.json({
        code: 200,
        msg: '添加成功',
        data: null
      });
    } catch (err) {
      console.error('添加收货地址失败:', err);
      res.json({
        code: 500,
        msg: '添加收货地址失败',
        data: null
      });
    }
  }

  async updateAddress(req, res) {
    try {
      const { id } = req.params;
      const { receiver_name, phone, province, city, district, detail_address, is_default } = req.body;
      
      if (!id || !receiver_name || !phone || !province || !city || !district || !detail_address) {
        return res.json({
          code: 400,
          msg: '参数不完整',
          data: null
        });
      }
      
      const [address] = await db.query('SELECT customer_id FROM customer_addresses WHERE id = ?', [id]);
      
      if (address.length === 0) {
        return res.json({
          code: 404,
          msg: '地址不存在',
          data: null
        });
      }
      
      if (is_default) {
        await db.query(
          'UPDATE customer_addresses SET is_default = 0 WHERE customer_id = ? AND id != ?',
          [address[0].customer_id, id]
        );
      }
      
      const sql = `
        UPDATE customer_addresses SET
          receiver_name = ?,
          phone = ?,
          province = ?,
          city = ?,
          district = ?,
          detail_address = ?,
          is_default = ?
        WHERE id = ?
      `;
      
      await db.query(sql, [receiver_name, phone, province, city, district, detail_address, is_default ? 1 : 0, id]);
      
      res.json({
        code: 200,
        msg: '修改成功',
        data: null
      });
    } catch (err) {
      console.error('更新收货地址失败:', err);
      res.json({
        code: 500,
        msg: '更新收货地址失败',
        data: null
      });
    }
  }

  async deleteAddress(req, res) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.json({
          code: 400,
          msg: '地址ID不能为空',
          data: null
        });
      }
      
      await db.query('DELETE FROM customer_addresses WHERE id = ?', [id]);
      
      res.json({
        code: 200,
        msg: '删除成功',
        data: null
      });
    } catch (err) {
      console.error('删除收货地址失败:', err);
      res.json({
        code: 500,
        msg: '删除收货地址失败',
        data: null
      });
    }
  }

  async setDefaultAddress(req, res) {
    try {
      const { customer_id, address_id } = req.params;
      
      if (!customer_id || !address_id) {
        return res.json({
          code: 400,
          msg: '参数不完整',
          data: null
        });
      }
      
      await db.query(
        'UPDATE customer_addresses SET is_default = 0 WHERE customer_id = ?',
        [customer_id]
      );
      
      await db.query(
        'UPDATE customer_addresses SET is_default = 1 WHERE id = ? AND customer_id = ?',
        [address_id, customer_id]
      );
      
      res.json({
        code: 200,
        msg: '设置成功',
        data: null
      });
    } catch (err) {
      console.error('设置默认地址失败:', err);
      res.json({
        code: 500,
        msg: '设置默认地址失败',
        data: null
      });
    }
  }
}

module.exports = new CustomerController();
