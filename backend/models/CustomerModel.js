const db = require('../config/db');

class CustomerModel {
  async getCustomerList(filters = {}) {
    const { status, customer_type, keyword, page = 1, pageSize = 10 } = filters;
    
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
    
    return {
      list: paginatedCustomers,
      total: total,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    };
  }

  async getCustomerById(id) {
    const [customers] = await db.query('SELECT * FROM customers WHERE id = ?', [id]);
    return customers[0];
  }

  async getCustomerByCode(customer_code) {
    const [customers] = await db.query('SELECT * FROM customers WHERE customer_code = ?', [customer_code]);
    return customers[0];
  }

  async createCustomer(customerData) {
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
    } = customerData;
    
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
    
    const [result] = await db.query(sql, params);
    return result.insertId;
  }

  async updateCustomer(id, customerData) {
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
    } = customerData;
    
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
  }

  async deleteCustomer(id) {
    await db.query('DELETE FROM customers WHERE id = ?', [id]);
  }

  async getCustomerOrders(customerId, limit = 10) {
    const [orders] = await db.query(
      'SELECT * FROM orders WHERE customer_id = ? ORDER BY create_time DESC LIMIT ?',
      [customerId, limit]
    );
    return orders;
  }

  async getCustomerServiceRequests(customerId, limit = 10) {
    const [requests] = await db.query(
      'SELECT * FROM service_requests WHERE customer_id = ? ORDER BY create_time DESC LIMIT ?',
      [customerId, limit]
    );
    return requests;
  }

  async getCustomerStats() {
    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as total_customers,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_customers,
        SUM(CASE WHEN customer_type = 'vip' THEN 1 ELSE 0 END) as vip_customers,
        SUM(CASE WHEN customer_type = 'strategic' THEN 1 ELSE 0 END) as strategic_customers,
        SUM(total_orders) as total_orders,
        SUM(total_amount) as total_amount
      FROM customers
    `);
    return stats[0];
  }

  async getRecentCustomers(limit = 5) {
    const [customers] = await db.query(`
      SELECT * FROM customers 
      WHERE status = 'active'
      ORDER BY create_time DESC 
      LIMIT ?
    `, [limit]);
    return customers;
  }
}

module.exports = new CustomerModel();
