const StockModel = require('../models/StockModel');

class WarehouseController {
  async getWarehouseData(req, res) {
    try {
      const data = await StockModel.getStockData();
      res.json({ code: 200, data, msg: '获取仓储数据成功' });
    } catch (error) {
      console.error('获取仓储数据失败:', error);
      res.json({ code: 500, msg: '服务器内部错误' });
    }
  }

  async submitInOutStock(req, res) {
    try {
      const result = await StockModel.submitInOutStock(req.body);
      res.json(result);
    } catch (error) {
      console.error('提交出入库失败:', error);
      res.json({ code: 500, msg: '服务器内部错误' });
    }
  }

  async replenishStock(req, res) {
    try {
      const result = await StockModel.replenishStock(req.body);
      res.json(result);
    } catch (error) {
      console.error('补货提醒失败:', error);
      res.json({ code: 500, msg: '服务器内部错误' });
    }
  }

  async getWarehouseStats(req, res) {
    try {
      const stats = await StockModel.getWarehouseStats();
      res.json({ code: 200, data: stats, msg: '获取统计数据成功' });
    } catch (error) {
      console.error('获取统计数据失败:', error);
      res.json({ code: 500, msg: '服务器内部错误' });
    }
  }
}

module.exports = new WarehouseController();
