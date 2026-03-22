const OrderModel = require('../models/OrderModel');

class OrderController {
  // 获取订单列表
  static async getOrderList(req, res) {
    try {
      const { page = 1, size = 10, order_no, status, customer_name } = req.query;
      const list = await OrderModel.findAll({ page, size, order_no, status, customer_name });
      const total = await OrderModel.count({ order_no, status, customer_name });
      res.json({
        code: 200,
        data: { list, total },
        msg: '获取订单成功'
      });
    } catch (err) {
      console.error('获取订单列表失败：', err);
      res.json({ code: 500, msg: '获取订单失败' });
    }
  }

  // 创建新订单
  static async createOrder(req, res) {
    try {
      const orderData = req.body;
      if (!orderData.order_no) {
        orderData.order_no = 'ORD' + Date.now(); // 自动生成订单号
      }

      await OrderModel.create(orderData);
      res.json({ code: 200, msg: '订单录入成功' });
    } catch (err) {
      console.error('创建订单失败：', err);
      res.json({ code: 500, msg: '订单录入失败' });
    }
  }

  // 状态跟踪与分配
  static async updateOrderStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;
      if (!id || !status) {
        return res.json({ code: 400, msg: '参数不完整' });
      }

      await OrderModel.updateStatus(id, status, reason);
      res.json({ code: 200, msg: `订单状态已更新为：${status}` });
    } catch (err) {
      console.error('更新订单状态失败：', err);
      res.json({ code: 500, msg: '更新状态失败' });
    }
  }

  // 获取订单详情
  static async getOrderDetail(req, res) {
    try {
      const { id } = req.params;
      const detail = await OrderModel.findById(id);
      if (!detail) return res.json({ code: 404, msg: '订单不存在' });

      res.json({ code: 200, data: detail, msg: '获取成功' });
    } catch (err) {
      console.error('获取详情失败：', err);
      res.json({ code: 500, msg: '系统错误' });
    }
  }
}

module.exports = OrderController;
