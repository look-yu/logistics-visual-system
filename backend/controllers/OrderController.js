const OrderModel = require('../models/OrderModel');
const db = require('../config/db');

class OrderController {
  // 获取订单列表
  static async getOrderList(req, res) {
    try {
      const { page = 1, size = 10, order_no, status, customer_name, customer_id } = req.query;
      const list = await OrderModel.findAll({ page, size, order_no, status, customer_name, customer_id });
      const total = await OrderModel.count({ order_no, status, customer_name, customer_id });
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
        const now = new Date();
        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
        orderData.order_no = `ORD${yy}${mm}${dd}${random}`;
      }

      await OrderModel.create(orderData);
      res.json({ code: 200, msg: '订单录入成功' });
    } catch (err) {
      console.error('创建订单失败：', err);
      res.json({ code: 500, msg: '订单录入失败' });
    }
  }

  // 客户下订单（价格自动计算）
  static async customerCreateOrder(req, res) {
    try {
      const {
        customer_id,
        customer_name,
        sender_address,
        receiver_address,
        goods_type,
        weight,
        volume
      } = req.body;

      if (!customer_id || !sender_address || !receiver_address || !goods_type || !weight || !volume) {
        return res.json({
          code: 400,
          msg: '参数不完整，请填写所有必填项',
          data: null
        });
      }

      const [priceConfigs] = await db.query('SELECT * FROM price_config LIMIT 1');
      
      if (priceConfigs.length === 0) {
        return res.json({
          code: 500,
          msg: '价格配置不存在，请联系管理员',
          data: null
        });
      }

      const priceConfig = priceConfigs[0];
      const goodsTypeMultiplier = priceConfig.goods_type_multiplier;
      const multiplier = goodsTypeMultiplier[goods_type] || 1.0;

      const basePrice = parseFloat(priceConfig.base_price);
      const weightPrice = parseFloat(weight) * parseFloat(priceConfig.weight_price);
      const volumePrice = parseFloat(volume) * parseFloat(priceConfig.volume_price);
      const goodsTypePrice = basePrice * (multiplier - 1);
      
      const totalAmount = basePrice + weightPrice + volumePrice + goodsTypePrice;

      const now = new Date();
      const yy = String(now.getFullYear()).slice(-2);
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
      const orderNo = `ORD${yy}${mm}${dd}${random}`;

      const orderData = {
        order_no: orderNo,
        customer_id: customer_id,
        customer_name: customer_name,
        sender_address: sender_address,
        receiver_address: receiver_address,
        goods_type: goods_type,
        weight: weight,
        volume: volume,
        amount: parseFloat(totalAmount.toFixed(2)),
        status: 'pending'
      };

      await OrderModel.create(orderData);

      res.json({
        code: 200,
        msg: '下单成功',
        data: {
          order_no: orderNo,
          amount: parseFloat(totalAmount.toFixed(2)),
          price_breakdown: {
            base_price: basePrice,
            weight_price: weightPrice,
            volume_price: volumePrice,
            goods_type_price: goodsTypePrice,
            total: parseFloat(totalAmount.toFixed(2))
          }
        }
      });
    } catch (err) {
      console.error('客户下单失败：', err);
      res.json({
        code: 500,
        msg: '下单失败',
        data: null
      });
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

  // 签收订单
  static async signOrder(req, res) {
    try {
      const { id } = req.params;
      const { signer, remark } = req.body;
      
      if (!id) {
        return res.json({ code: 400, msg: '订单ID不能为空' });
      }

      const order = await OrderModel.findById(id);
      if (!order) {
        return res.json({ code: 404, msg: '订单不存在' });
      }

      if (order.status === 'signed') {
        return res.json({ code: 400, msg: '订单已签收' });
      }

      if (order.status !== 'delivered') {
        return res.json({ code: 400, msg: '订单状态不正确，只有已送达的订单才能签收' });
      }

      await OrderModel.signOrder(id, signer, remark);
      res.json({ code: 200, msg: '签收成功' });
    } catch (err) {
      console.error('签收失败：', err);
      res.json({ code: 500, msg: '签收失败' });
    }
  }

  // 取消订单
  static async cancelOrder(req, res) {
    try {
      const { id } = req.params;
      const { reason, penalty } = req.body;
      
      if (!id) {
        return res.json({ code: 400, msg: '订单ID不能为空' });
      }

      if (!reason) {
        return res.json({ code: 400, msg: '取消原因不能为空' });
      }

      const order = await OrderModel.findById(id);
      if (!order) {
        return res.json({ code: 404, msg: '订单不存在' });
      }

      if (order.status !== 'pending') {
        return res.json({ code: 400, msg: '只有待处理的订单才能取消' });
      }

      await OrderModel.cancelOrder(id, reason, penalty);
      res.json({ 
        code: 200, 
        msg: '订单已取消',
        data: {
          penalty: penalty,
          reason: reason
        }
      });
    } catch (err) {
      console.error('取消订单失败：', err);
      res.json({ code: 500, msg: '取消订单失败' });
    }
  }

  // 获取订单司机信息
  static async getOrderDriver(req, res) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.json({ code: 400, msg: '订单ID不能为空' });
      }

      const driverInfo = await OrderModel.getOrderDriver(id);
      
      if (!driverInfo) {
        return res.json({ code: 404, msg: '未找到司机信息' });
      }

      res.json({ code: 200, data: driverInfo, msg: '获取成功' });
    } catch (err) {
      console.error('获取司机信息失败：', err);
      res.json({ code: 500, msg: '获取司机信息失败' });
    }
  }
}

module.exports = OrderController;
