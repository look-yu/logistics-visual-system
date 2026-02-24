// 导出接口控制器：接收筛选参数、调用 ExcelGenerator 生成文件流、处理导出异常
/**
 * 运力调度-筛选/下钻控制器
 * 对接前端：
 * - 前端 FilterBar 组件触发的筛选请求（handleFilterChange）
 * - 前端 DrillDownHandler 触发的下钻请求（handleChartDrill）
 * 核心接口：/api/capacity/filtered （对应前端 getFilteredCapacityData 方法）
 */
const express = require('express');
const router = express.Router();
const FilterQueryUtil = require('../utils/FilterQueryUtil');
// 模拟数据库操作（替换为你的实际ORM/数据库连接，如sequelize/mysql2）
const db = require('../db/mockDb'); // 实际项目替换为真实数据库连接

/**
 * 运力数据筛选/下钻接口
 * 前端请求参数示例：
 * {
 *   timeRange: "2026-02-01至2026-02-23", // 时间范围
 *   area: "华东", // 区域筛选（all/华东/华北/华南）
 *   drillDownLevel: "city", // 下钻层级（province/city/district）
 *   drillDimension: "area" // 下钻维度（area/carType/goodsType）
 * }
 */
router.post('/capacity/filtered', async (req, res) => {
  try {
    // 1. 接收并校验前端参数（与前端 FilterBar 传参完全对齐）
    const filterParams = req.body;
    if (!filterParams) {
      return res.json({
        code: 400,
        msg: '筛选参数不能为空',
        data: null
      });
    }

    // 2. 调用工具类生成查询条件（复用 FilterQueryUtil）
    const { whereSql, queryParams } = FilterQueryUtil.buildFilterCondition(filterParams);

    // 3. 执行数据库查询（适配你的实际业务表，这里以运力调度表为例）
    // 3.1 车辆数据查询
    const carSql = `SELECT * FROM t_car_info ${whereSql.length ? 'WHERE ' + whereSql.join(' AND ') : ''}`;
    const carList = await db.query(carSql, queryParams); // 实际项目替换为真实查询

    // 3.2 订单数据查询
    const orderSql = `SELECT * FROM t_order_info ${whereSql.length ? 'WHERE ' + whereSql.join(' AND ') : ''}`;
    const orderList = await db.query(orderSql, queryParams); // 实际项目替换为真实查询

    // 4. 构造前端需要的返回格式（与前端 dataStore 完全对齐）
    const responseData = {
      cars: carList, // 车辆列表（前端 dataStore.setCarList 接收）
      orders: orderList // 订单列表（前端 dataStore.setOrderList 接收）
    };

    // 5. 返回统一响应格式（前端 ElMessage 依赖 code/msg 判断结果）
    res.json({
      code: 200,
      msg: '筛选/下钻数据查询成功',
      data: responseData
    });

  } catch (error) {
    // 异常处理：前端会捕获并提示错误信息
    console.error('筛选/下钻查询失败：', error);
    res.json({
      code: 500,
      msg: '服务器内部错误：' + error.message,
      data: null
    });
  }
});

/**
 * 下钻层级回退接口（对接前端 handleDrillBack 方法）
 * 前端传参：清空下钻层级的参数，返回顶层数据
 */
router.post('/capacity/drill-back', async (req, res) => {
  try {
    // 回退逻辑：清空下钻参数，查询顶层数据
    const defaultParams = {
      timeRange: '',
      area: 'all',
      drillDownLevel: '',
      drillDimension: ''
    };
    const { whereSql, queryParams } = FilterQueryUtil.buildFilterCondition(defaultParams);
    
    // 执行查询（同筛选接口）
    const carList = await db.query(`SELECT * FROM t_car_info ${whereSql.length ? 'WHERE ' + whereSql.join(' AND ') : ''}`, queryParams);
    const orderList = await db.query(`SELECT * FROM t_order_info ${whereSql.length ? 'WHERE ' + whereSql.join(' AND ') : ''}`, queryParams);

    res.json({
      code: 200,
      msg: '下钻回退成功',
      data: { cars: carList, orders: orderList }
    });
  } catch (error) {
    res.json({
      code: 500,
      msg: '下钻回退失败：' + error.message,
      data: null
    });
  }
});

// 导出路由（挂载到 Express 主服务）
module.exports = router;