const db = require('../config/db');

class ServiceRequestController {
  async getServiceRequestList(req, res) {
    try {
      const { 
        status, 
        priority, 
        request_type, 
        customer_id,
        keyword,
        page = 1, 
        pageSize = 10 
      } = req.query;
      
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
      
      res.json({
        code: 200,
        msg: 'success',
        data: {
          list: paginatedRequests,
          total: total,
          page: parseInt(page),
          pageSize: parseInt(pageSize)
        }
      });
    } catch (err) {
      console.error('获取服务请求列表失败:', err);
      res.json({
        code: 500,
        msg: '获取服务请求列表失败',
        data: { list: [], total: 0 }
      });
    }
  }

  async getServiceRequestDetail(req, res) {
    try {
      const { id } = req.params;
      
      const [requests] = await db.query(`
        SELECT sr.*, c.customer_name, c.contact_person, c.contact_phone
        FROM service_requests sr
        LEFT JOIN customers c ON sr.customer_id = c.id
        WHERE sr.id = ?
      `, [id]);
      
      if (requests.length === 0) {
        return res.json({
          code: 404,
          msg: '服务请求不存在',
          data: null
        });
      }
      
      res.json({
        code: 200,
        msg: 'success',
        data: requests[0]
      });
    } catch (err) {
      console.error('获取服务请求详情失败:', err);
      res.json({
        code: 500,
        msg: '获取服务请求详情失败',
        data: null
      });
    }
  }

  async createServiceRequest(req, res) {
    try {
      const {
        customer_id,
        request_type,
        request_title,
        request_content,
        priority,
        attachments,
        created_by
      } = req.body;
      
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
      
      await db.query(sql, params);
      
      res.json({
        code: 200,
        msg: '创建服务请求成功',
        data: { request_no }
      });
    } catch (err) {
      console.error('创建服务请求失败:', err);
      res.json({
        code: 500,
        msg: '创建服务请求失败',
        data: null
      });
    }
  }

  async updateServiceRequest(req, res) {
    try {
      const { id } = req.params;
      const {
        request_type,
        request_title,
        request_content,
        priority,
        status
      } = req.body;
      
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
      
      res.json({
        code: 200,
        msg: '更新服务请求成功',
        data: null
      });
    } catch (err) {
      console.error('更新服务请求失败:', err);
      res.json({
        code: 500,
        msg: '更新服务请求失败',
        data: null
      });
    }
  }

  async deleteServiceRequest(req, res) {
    try {
      const { id } = req.params;
      
      await db.query('DELETE FROM service_requests WHERE id = ?', [id]);
      
      res.json({
        code: 200,
        msg: '删除服务请求成功',
        data: null
      });
    } catch (err) {
      console.error('删除服务请求失败:', err);
      res.json({
        code: 500,
        msg: '删除服务请求失败',
        data: null
      });
    }
  }

  async handleServiceRequest(req, res) {
    try {
      const { id } = req.params;
      const {
        handler_id,
        handler_name,
        handle_result,
        customer_satisfaction
      } = req.body;
      
      const handle_time = new Date();
      
      const [requests] = await db.query('SELECT * FROM service_requests WHERE id = ?', [id]);
      
      if (requests.length === 0) {
        return res.json({
          code: 404,
          msg: '服务请求不存在',
          data: null
        });
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
      
      res.json({
        code: 200,
        msg: '处理服务请求成功',
        data: {
          response_time,
          resolve_time
        }
      });
    } catch (err) {
      console.error('处理服务请求失败:', err);
      res.json({
        code: 500,
        msg: '处理服务请求失败',
        data: null
      });
    }
  }

  async getServiceRequestStats(req, res) {
    try {
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
      
      const [recentRequests] = await db.query(`
        SELECT sr.*, c.customer_name
        FROM service_requests sr
        LEFT JOIN customers c ON sr.customer_id = c.id
        WHERE sr.status IN ('pending', 'processing')
        ORDER BY sr.create_time DESC
        LIMIT 5
      `);
      
      res.json({
        code: 200,
        msg: 'success',
        data: {
          stats: stats[0],
          recent_requests: recentRequests
        }
      });
    } catch (err) {
      console.error('获取服务请求统计失败:', err);
      res.json({
        code: 500,
        msg: '获取服务请求统计失败',
        data: null
      });
    }
  }
}

module.exports = new ServiceRequestController();
