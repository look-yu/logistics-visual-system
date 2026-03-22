const ReportModel = require('../models/ReportModel');

class ReportController {
  // 综合看板数据
  static async getDashboardData(req, res) {
    try {
      const { month } = req.query;
      const orderStats = await ReportModel.getOrderStats(7, month ? parseInt(month) : null);
      const transportCosts = await ReportModel.getTransportCosts();
      const inventoryStats = await ReportModel.getInventoryStats();
      const customerRank = await ReportModel.getCustomerRank();
      const funnelData = await ReportModel.getOrderFunnelData();
      const radarData = await ReportModel.getServiceRadarData();

      res.json({
        code: 200,
        data: {
          orderTrend: orderStats,
          transportCosts,
          inventoryStats,
          customerRank,
          funnelData,
          radarData
        },
        msg: '获取报表数据成功'
      });
    } catch (err) {
      console.error('获取报表失败：', err);
      res.json({ code: 500, msg: '获取报表失败' });
    }
  }

  // 获取订单周趋势图
  static async getOrderTrend(req, res) {
    try {
      const { days = 7 } = req.query;
      const stats = await ReportModel.getOrderStats(parseInt(days));
      res.json({ code: 200, data: stats, msg: '获取成功' });
    } catch (err) {
      console.error('获取趋势图失败：', err);
      res.json({ code: 500, msg: '获取失败' });
    }
  }
}

module.exports = ReportController;
