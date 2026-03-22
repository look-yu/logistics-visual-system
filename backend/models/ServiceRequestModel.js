const db = require('../config/db');

class ServiceRequestModel {
  async getServiceRequestList(filters = {}) {
    const { 
      status, 
      priority, 
      request_type, 
      customer_id,
      keyword,
      page = 1, 
      pageSize = 10 
    } = filters;
    
    let sql = `
      SELECT sr.*, c.customer_name, c.contact_person 
      FROM service_requests sr
      LEFT JOIN customers c ON sr.customer_id = c.id
      WHERE 1=1
    `;
    const params = [];
    
    if (status) {
      sql += ' AND sr.status = ?';
      params.push(status);
    }
    
    if (priority) {
      sql += ' AND sr.priority = ?';
      params.push(priority);
    }
    
    if (request_type) {
      sql += ' AND sr.request_type = ?';
      params.push(request_type);
    }
    
    if (customer_id) {
      sql += ' AND sr.customer_id = ?';
      params.push(customer_id);
    }
    
    if (keyword) {
      sql += ' AND (sr.request_title LIKE ? OR sr.request_no LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }
    
    sql += ' ORDER BY sr.create_time DESC';
    
    const [requests] = await db.query(sql, params);
    
    const total = requests.length;
    const start = (page - 1) * pageSize;
    const paginatedRequests = requests.slice(start, start + parseInt(pageSize));
    
    return {
      list: paginatedRequests,
      total: total,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    };
  }

  async getServiceRequestById(id) {
    const [requests] = await db.query(`
      SELECT sr.*, c.customer_name, c.contact_person, c.contact_phone
      FROM service_requests sr
      LEFT JOIN customers c ON sr.customer_id = c.id
      WHERE sr.id = ?
    `, [id]);
    return requests[0];
  }

  async getServiceRequestByNo(request_no) {
    const [requests] = await db.query('SELECT * FROM service_requests WHERE request_no = ?', [request_no]);
    return requests[0];
  }

  async createServiceRequest(requestData) {
    const {
      customer_id,
      request_type,
      request_title,
      request_content,
      priority,
      attachments,
      created_by
    } = requestData;
    
    const request_no = 'SR' + Date.now();
    
    const sql = `
      INSERT INTO service_requests (
        request_no, customer_id, request_type, request_title,
        request_content, priority, attachments, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      request_no,
      customer_id,
      request_type,
      request_title,
      request_content,
      priority || 'normal',
      attachments,
      created_by
    ];
    
    const [result] = await db.query(sql, params);
    return { insertId: result.insertId, request_no };
  }

  async updateServiceRequest(id, requestData) {
    const {
      request_type,
      request_title,
      request_content,
      priority,
      status
    } = requestData;
    
    const sql = `
      UPDATE service_requests SET
        request_type = ?,
        request_title = ?,
        request_content = ?,
        priority = ?,
        status = ?
      WHERE id = ?
    `;
    
    const params = [
      request_type,
      request_title,
      request_content,
      priority,
      status,
      id
    ];
    
    await db.query(sql, params);
  }

  async deleteServiceRequest(id) {
    await db.query('DELETE FROM service_requests WHERE id = ?', [id]);
  }

  async handleServiceRequest(id, handleData) {
    const {
      handler_id,
      handler_name,
      handle_result,
      customer_satisfaction
    } = handleData;
    
    const handle_time = new Date();
    
    const [requests] = await db.query('SELECT * FROM service_requests WHERE id = ?', [id]);
    
    if (requests.length === 0) {
      throw new Error('Service request not found');
    }
    
    const request = requests[0];
    const response_time = Math.floor((handle_time - new Date(request.create_time)) / 60000);
    const resolve_time = response_time;
    
    await db.query(`
      UPDATE service_requests SET
        handler_id = ?,
        handler_name = ?,
        handle_time = ?,
        handle_result = ?,
        customer_satisfaction = ?,
        response_time = ?,
        resolve_time = ?,
        status = 'resolved'
      WHERE id = ?
    `, [
      handler_id,
      handler_name,
      handle_time,
      handle_result,
      customer_satisfaction,
      response_time,
      resolve_time,
      id
    ]);
    
    return { response_time, resolve_time };
  }

  async getServiceRequestStats() {
    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as total_requests,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_requests,
        SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing_requests,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved_requests,
        SUM(CASE WHEN priority = 'high' THEN 1 ELSE 0 END) as high_priority_requests,
        AVG(response_time) as avg_response_time,
        AVG(resolve_time) as avg_resolve_time,
        AVG(customer_satisfaction) as avg_satisfaction
      FROM service_requests
    `);
    return stats[0];
  }

  async getRecentRequests(limit = 5) {
    const [requests] = await db.query(`
      SELECT sr.*, c.customer_name
      FROM service_requests sr
      LEFT JOIN customers c ON sr.customer_id = c.id
      WHERE sr.status IN ('pending', 'processing')
      ORDER BY sr.create_time DESC
      LIMIT ?
    `, [limit]);
    return requests;
  }

  async getPendingRequests() {
    const [requests] = await db.query(`
      SELECT sr.*, c.customer_name
      FROM service_requests sr
      LEFT JOIN customers c ON sr.customer_id = c.id
      WHERE sr.status = 'pending'
      ORDER BY sr.priority DESC, sr.create_time ASC
    `);
    return requests;
  }
}

module.exports = new ServiceRequestModel();
