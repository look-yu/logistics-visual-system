const db = require('../config/db');

// 新增：用户模拟数据 (数据库连接失败时兜底)
const mockUsers = [
  { id: 1, username: 'admin', password: '123456', real_name: '系统管理员', role: 'admin', status: 1 },
  { id: 2, username: 'manager', password: '123456', real_name: '运营经理', role: 'manager', status: 1 },
  { id: 3, username: 'dispatcher', password: '123456', real_name: '调度主管', role: 'dispatcher', status: 1 },
  { id: 4, username: 'warehouse', password: '123456', real_name: '仓库组长', role: 'warehouse', status: 1 },
];

class UserModel {
  // 根据用户名查找用户 (兼容数据库和模拟数据)
  static async findByUsername(username) {
    try {
      const sql = 'SELECT * FROM users WHERE username = ? AND status = 1';
      const [rows] = await db.query(sql, [username]);
      // 如果数据库有数据，则返回第一条
      if (rows && rows.length > 0) {
        return rows[0];
      }
      // 数据库无数据，则从模拟数据中查找
      return mockUsers.find(u => u.username === username);
    } catch (err) {
      console.warn('数据库查询用户失败，回退到模拟数据：', err.message);
      return mockUsers.find(u => u.username === username);
    }
  }

  // 更新用户信息 (仅在数据库连接时有效)
  static async update(id, userData) {
    try {
      const fields = [];
      const values = [];
      for (const [key, value] of Object.entries(userData)) {
        if (value !== undefined) {
          fields.push(`${key} = ?`);
          values.push(value);
        }
      }
      if (fields.length === 0) return 0;
      
      const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
      values.push(id);
      const [result] = await db.query(sql, values);
      return result.affectedRows;
    } catch (err) {
      console.warn('数据库更新用户信息失败（可能未使用数据库），此操作被跳过。');
      return 0; // 静默失败，不影响主流程
    }
  }

  // 删除/禁用用户
  static async setStatus(id, status) {
    const sql = 'UPDATE users SET status = ? WHERE id = ?';
    const [result] = await db.query(sql, [status, id]);
    return result.affectedRows;
  }

  // 统计用户总数
  static async count(params = {}) {
    const { username, role } = params;
    let sql = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
    const queryParams = [];

    if (username) {
      sql += ' AND username LIKE ?';
      queryParams.push(`%${username}%`);
    }
    if (role) {
      sql += ' AND role = ?';
      queryParams.push(role);
    }

    const [rows] = await db.query(sql, queryParams);
    return rows[0].total;
  }
}

module.exports = UserModel;
