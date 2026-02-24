const VehicleModel = require('../models/VehicleModel');
const RoleModel = require('../models/RoleModel');
const StockModel = require('../models/StockModel');
const TrackModel = require('../models/TrackModel');
const WarehouseModel = require('../models/WarehouseModel');

// ===================== 1. 角色相关接口 =====================
const getLogisticsDataByRole = async (req, res) => {
  try {
    const { role = 'manager' } = req.query;
    const data = await RoleModel.getRoleData(role);
    res.json({ code: 200, data, msg: 'success' });
  } catch (err) {
    console.error('获取角色数据失败：', err);
    res.json({ code: 500, data: {}, msg: '获取数据失败' });
  }
};

const changeRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!role) return res.json({ code: 400, data: {}, msg: '缺少角色参数' });

    await RoleModel.changeRole(role);
    res.json({ code: 200, data: { role }, msg: '切换角色成功' });
  } catch (err) {
    console.error('切换角色失败：', err);
    res.json({ code: 500, data: {}, msg: '切换失败' });
  }
};

// ===================== 2. 运力调度接口 =====================
const getCapacityData = async (req, res) => {
  try {
    // 仅新增这一行：接收前端参数并传递给模型
    const filterParams = req.query;
    // 原有代码：把getCapacityData()改为getCapacityData(filterParams)
    const result = await VehicleModel.getCapacityData(filterParams);
    res.json(result);
  } catch (err) {
    // 原有异常逻辑不变
  }
};

const allocateOrder = async (req, res) => {
  try {
    const { carId, orderId, arriveTime } = req.body;
    if (!carId || !orderId || !arriveTime)
      return res.json({ code: 400, data: {}, msg: '参数不完整' });

    await VehicleModel.allocateOrder({ carId, orderId, arriveTime });
    res.json({ code: 200, data: {}, msg: '运单分配成功' });
  } catch (err) {
    console.error('分配运单失败：', err);
    res.json({ code: 500, data: {}, msg: '分配失败' });
  }
};

// ===================== 3. 库存/出入库接口 =====================
const getStockData = async (req, res) => {
  try {
    const data = await StockModel.getStockData();
    res.json({ code: 200, data, msg: 'success' });
  } catch (err) {
    console.error('获取库存数据失败：', err);
    res.json({ code: 500, data: {}, msg: '获取失败' });
  }
};

const submitInOutStock = async (req, res) => {
  try {
    const { goodsId, type, num, time, operator, reason } = req.body;
    if (!goodsId || !type || !num || !time || !operator) 
      return res.json({ code: 400, data: {}, msg: '参数不完整' });

    await StockModel.submitInOutStock({ goodsId, type, num, time, operator, reason });
    res.json({ code: 200, data: {}, msg: '操作成功' });
  } catch (err) {
    console.error('提交出入库失败：', err);
    res.json({ code: 500, data: {}, msg: '提交失败' });
  }
};

const replenishStock = async (req, res) => {
  try {
    const { goodsId } = req.body;
    if (!goodsId) return res.json({ code: 400, data: {}, msg: '缺少商品ID' });

    await StockModel.replenishStock(goodsId);
    res.json({ code: 200, data: {}, msg: '补货提醒发送成功' });
  } catch (err) {
    console.error('补货提醒失败：', err);
    res.json({ code: 500, data: {}, msg: '操作失败' });
  }
};

// ===================== 4. 运输轨迹接口 =====================
const getTrackData = async (req, res) => {
  try {
    const { orderId } = req.query;
    const data = await TrackModel.getTrackData(orderId);
    res.json({ code: 200, data, msg: 'success' });
  } catch (err) {
    console.error('获取轨迹数据失败：', err);
    res.json({ code: 500, data: {}, msg: '获取失败' });
  }
};

// ===================== 5. 仓储看板聚合接口 =====================
const getWarehouseBoardData = async (req, res) => {
  try {
    const data = await WarehouseModel.getBoardData();
    res.json({ code: 200, data, msg: 'success' });
  } catch (err) {
    console.error('获取仓储看板数据失败：', err);
    res.json({ code: 500, data: {}, msg: '获取失败' });
  }
};

// ===================== 导出接口 =====================
module.exports = {
  getLogisticsDataByRole,
  changeRole,
  getCapacityData,
  allocateOrder,
  getStockData,
  submitInOutStock,
  replenishStock,
  getTrackData,
  getWarehouseBoardData
};