const UserModel = require('../models/UserModel');

class UserController {
  // 登录 (简单实现，未加JWT，实际可扩充)
  static async login(req, res) {
    try {
      const { username, password, role } = req.body;
      if (!username || !password) {
        return res.json({ code: 400, msg: '请输入用户名和密码' });
      }

      const user = await UserModel.findByUsername(username);
      if (!user || user.password !== password) {
        return res.json({ code: 401, msg: '用户名或密码错误' });
      }

      // 角色验证
      if (role && user.role !== role) {
        return res.json({ code: 403, msg: `该账号不是${role === 'admin' ? '管理员' : '客户'}角色` });
      }

      // 更新最后登录时间
      await UserModel.update(user.id, { last_login: new Date() });

      // 返回脱敏后的用户信息
      const { password: _, ...userInfo } = user;
      res.json({
        code: 200,
        data: {
          token: 'mock-token-' + user.id, // 实际应使用JWT
          user: userInfo
        },
        msg: '登录成功'
      });
    } catch (err) {
      console.error('登录失败：', err);
      res.json({ code: 500, msg: '系统错误' });
    }
  }

  // 获取用户列表
  static async getUserList(req, res) {
    try {
      const { page = 1, size = 10, username, role } = req.query;
      const list = await UserModel.findAll({ page, size, username, role });
      const total = await UserModel.count({ username, role });
      res.json({
        code: 200,
        data: { list, total },
        msg: '获取成功'
      });
    } catch (err) {
      console.error('获取用户列表失败：', err);
      res.json({ code: 500, msg: '获取失败' });
    }
  }

  // 新增/注册用户
  static async register(req, res) {
    try {
      const { username, password, real_name, role, phone, email } = req.body;
      if (!username || !password) {
        return res.json({ code: 400, msg: '用户名和密码必填' });
      }

      const exist = await UserModel.findByUsername(username);
      if (exist) {
        return res.json({ code: 400, msg: '用户名已存在' });
      }

      await UserModel.create({ username, password, real_name, role, phone, email });
      res.json({ code: 200, msg: '创建成功' });
    } catch (err) {
      console.error('创建用户失败：', err);
      res.json({ code: 500, msg: '创建失败' });
    }
  }

  // 修改用户
  static async updateUser(req, res) {
    try {
      const { id } = req.params;
      const userData = req.body;
      if (!id) return res.json({ code: 400, msg: '缺少用户ID' });

      await UserModel.update(id, userData);
      res.json({ code: 200, msg: '修改成功' });
    } catch (err) {
      console.error('修改用户失败：', err);
      res.json({ code: 500, msg: '修改失败' });
    }
  }

  // 禁用/删除用户 (软删除)
  static async deleteUser(req, res) {
    try {
      const { id } = req.params;
      const { status = 0 } = req.body;
      if (!id) return res.json({ code: 400, msg: '缺少用户ID' });

      await UserModel.setStatus(id, status);
      res.json({ code: 200, msg: status === 0 ? '已禁用' : '已启用' });
    } catch (err) {
      console.error('操作失败：', err);
      res.json({ code: 500, msg: '操作失败' });
    }
  }
}

module.exports = UserController;
