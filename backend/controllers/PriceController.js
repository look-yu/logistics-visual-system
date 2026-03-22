const PriceModel = require('../models/PriceModel');

class PriceController {
  // 获取价格配置
  static async getPriceConfig(req, res) {
    try {
      const config = await PriceModel.getConfig();
      res.json({
        code: 200,
        data: config,
        msg: '获取价格配置成功'
      });
    } catch (err) {
      console.error('获取价格配置失败：', err);
      res.json({ code: 500, msg: '获取价格配置失败' });
    }
  }

  // 更新价格配置
  static async updatePriceConfig(req, res) {
    try {
      const config = req.body;
      await PriceModel.updateConfig(config);
      res.json({
        code: 200,
        msg: '价格配置更新成功'
      });
    } catch (err) {
      console.error('更新价格配置失败：', err);
      res.json({ code: 500, msg: '更新价格配置失败' });
    }
  }

  // 计算订单价格
  static async calculateOrderPrice(req, res) {
    try {
      const { goods_type, weight, volume, base_price } = req.body;
      const price = await PriceModel.calculatePrice({ goods_type, weight, volume, base_price });
      res.json({
        code: 200,
        data: price,
        msg: '价格计算成功'
      });
    } catch (err) {
      console.error('计算价格失败：', err);
      res.json({ code: 500, msg: '计算价格失败' });
    }
  }
}

module.exports = PriceController;
