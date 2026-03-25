const db = require('../config/db');
const crypto = require('crypto');

class AuthController {
  async register(req, res) {
    try {
      const {
        username,
        password
      } = req.body;

      if (!username || !password) {
        return res.json({
          code: 400,
          msg: '用户名和密码不能为空',
          data: null
        });
      }

      const [existingUsers] = await db.query(
        'SELECT id FROM customers WHERE username = ?',
        [username]
      );

      if (existingUsers.length > 0) {
        return res.json({
          code: 400,
          msg: '用户名已存在',
          data: null
        });
      }

      const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

      const customerCode = 'CUS' + Date.now();

      const sql = `
        INSERT INTO customers (
          customer_code, username, password, customer_name, contact_person,
          contact_phone, contact_email, company_address, customer_type,
          credit_rating, credit_limit, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        customerCode,
        username,
        hashedPassword,
        username,
        username,
        null,
        null,
        null,
        'regular',
        'A',
        0,
        'active'
      ];

      await db.query(sql, params);

      const [newCustomer] = await db.query(
        'SELECT id, customer_code, username, customer_name FROM customers WHERE customer_code = ?',
        [customerCode]
      );

      res.json({
        code: 200,
        msg: '注册成功',
        data: {
          id: newCustomer[0].id,
          customer_code: newCustomer[0].customer_code,
          username: newCustomer[0].username,
          customer_name: newCustomer[0].customer_name
        }
      });
    } catch (err) {
      console.error('注册失败:', err);
      res.json({
        code: 500,
        msg: '注册失败',
        data: null
      });
    }
  }

  async login(req, res) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.json({
          code: 400,
          msg: '用户名和密码不能为空',
          data: null
        });
      }

      const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

      const [customers] = await db.query(
        'SELECT * FROM customers WHERE username = ? AND password = ?',
        [username, hashedPassword]
      );

      if (customers.length === 0) {
        return res.json({
          code: 401,
          msg: '用户名或密码错误',
          data: null
        });
      }

      const customer = customers[0];
      
      delete customer.password;

      res.json({
        code: 200,
        msg: '登录成功',
        data: {
          id: customer.id,
          customer_code: customer.customer_code,
          username: customer.username,
          customer_name: customer.customer_name,
          contact_person: customer.contact_person,
          contact_phone: customer.contact_phone,
          contact_email: customer.contact_email,
          company_address: customer.company_address
        }
      });
    } catch (err) {
      console.error('登录失败:', err);
      res.json({
        code: 500,
        msg: '登录失败',
        data: null
      });
    }
  }

  async updatePassword(req, res) {
    try {
      const { id } = req.params;
      const { new_password } = req.body;

      if (!id || !new_password) {
        return res.json({
          code: 400,
          msg: '参数不完整',
          data: null
        });
      }

      if (new_password.length < 6) {
        return res.json({
          code: 400,
          msg: '密码长度不能少于6位',
          data: null
        });
      }

      const hashedPassword = crypto.createHash('sha256').update(new_password).digest('hex');

      await db.query(
        'UPDATE customers SET password = ? WHERE id = ?',
        [hashedPassword, id]
      );

      res.json({
        code: 200,
        msg: '密码修改成功',
        data: null
      });
    } catch (err) {
      console.error('密码修改失败:', err);
      res.json({
        code: 500,
        msg: '密码修改失败',
        data: null
      });
    }
  }
}

module.exports = new AuthController();
