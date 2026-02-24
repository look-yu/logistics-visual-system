// 导出接口控制器：接收筛选参数、调用 ExcelGenerator 生成文件流、处理导出异常
/**
 * Excel导出控制器：
 * 对接前端导出按钮请求，适配筛选/下钻参数，返回Excel文件流
 * 前端请求地址：/api/capacity/export
 */
const express = require('express');
const router = express.Router();
const FilterQueryUtil = require('../utils/FilterQueryUtil'); // 复用之前的筛选工具
const ExcelGenerator = require('../utils/ExcelGenerator');
// 模拟数据库操作（替换为你的真实数据库连接）
const db = require('../db/mockDb');

/**
 * 运力数据Excel导出接口
 * 前端传参：与筛选/下钻接口完全一致（timeRange/area/drillDownLevel/drillDimension）
 * 响应：Excel文件流（前端直接下载，无需解析JSON）
 */
router.post('/capacity/export', async (req, res) => {
  try {
    // 1. 接收前端筛选参数（与筛选/下钻接口参数完全对齐，无额外学习成本）
    const filterParams = req.body;

    // 2. 调用筛选工具生成查询条件（复用FilterQueryUtil，保证数据一致性）
    const { whereSql, queryParams } = FilterQueryUtil.buildFilterCondition(filterParams);

    // 3. 查询数据库（与筛选/下钻接口查询逻辑一致，保证导出数据=页面展示数据）
    // 3.1 车辆数据查询
    const carSql = `SELECT * FROM t_car_info ${whereSql.length ? 'WHERE ' + whereSql.join(' AND ') : ''}`;
    const carList = await db.query(carSql, queryParams);
    // 3.2 订单数据查询
    const orderSql = `SELECT * FROM t_order_info ${whereSql.length ? 'WHERE ' + whereSql.join(' AND ') : ''}`;
    const orderList = await db.query(orderSql, queryParams);

    // 4. 生成Excel Buffer（调用ExcelGenerator）
    const excelBuffer = ExcelGenerator.generateCapacityExcel({ carList, orderList });

    // 5. 设置响应头（关键：让浏览器识别为Excel文件并触发下载）
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=运力数据_${new Date().getTime()}.xlsx`);
    res.setHeader('Content-Length', excelBuffer.length);

    // 6. 返回Excel文件流（前端直接下载）
    res.end(excelBuffer);

  } catch (error) {
    // 异常处理：前端捕获后提示导出失败
    console.error('Excel导出失败：', error);
    res.status(500).json({
      code: 500,
      msg: 'Excel导出失败：' + error.message,
      data: null
    });
  }
});

/**
 * 可选：仅导出车辆数据接口（前端按需调用）
 */
router.post('/capacity/export/car', async (req, res) => {
  try {
    const filterParams = req.body;
    const { whereSql, queryParams } = FilterQueryUtil.buildFilterCondition(filterParams);
    const carList = await db.query(`SELECT * FROM t_car_info ${whereSql.length ? 'WHERE ' + whereSql.join(' AND ') : ''}`, queryParams);
    
    // 简化Excel（仅车辆sheet）
    const header = ['ID', '车牌号', '司机姓名', '联系电话', '状态', '所属区域', '载重(吨)'];
    const carData = carList.map(car => [car.id, car.carNo, car.driver, car.phone, car.status, car.area, car.load]);
    const excelBuffer = ExcelGenerator.generateSimpleExcel(carData, '车辆信息', header);

    // 设置响应头并返回
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=车辆数据_${new Date().getTime()}.xlsx`);
    res.end(excelBuffer);
  } catch (error) {
    res.status(500).json({ code: 500, msg: '车辆数据导出失败：' + error.message });
  }
});

module.exports = router;