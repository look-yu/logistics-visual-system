// 库存/出入库数据模型（适配整体后端架构：config/db.js + controller层调用）
const { query } = require('../config/db'); // 引入架构统一的数据库查询工具

// ===================== 1. 模拟数据（数据库兜底/测试用，保留原有结构） =====================
const mockGoodsList = [
  { goodsId: 1, goodsName: '生鲜-蔬菜', safeStock: 100, currentStock: 80, status: '预警', warehouse: '库位A', unitPrice: 15.50 },
  { goodsId: 2, goodsName: '标品-日用品', safeStock: 500, currentStock: 600, status: '正常', warehouse: '库位B', unitPrice: 25.00 },
  { goodsId: 3, goodsName: '大件-家电', safeStock: 50, currentStock: 40, status: '预警', warehouse: '库位C', unitPrice: 1200.00 },
  { goodsId: 4, goodsName: '耗材-包装', safeStock: 200, currentStock: 250, status: '正常', warehouse: '库位D', unitPrice: 5.00 }
];

const mockInOutRecord = [
  { id: 1, time: '2026-02-21 08:00', goodsName: '生鲜-蔬菜', type: '出库', num: 20, operator: '张三', reason: '配送' },
  { id: 2, time: '2026-02-21 09:30', goodsName: '标品-日用品', type: '入库', num: 100, operator: '李四', reason: '' },
  { id: 3, time: '2026-02-21 10:15', goodsName: '大件-家电', type: '出库', num: 10, operator: '王五', reason: '配送' },
  { id: 4, time: '2026-02-21 11:00', goodsName: '耗材-包装', type: '入库', num: 50, operator: '赵六', reason: '' }
];

// ===================== 2. 私有工具函数（模型层内部使用，适配架构规范） =====================
/**
 * 数据库字段 → 前端返回字段 映射（统一格式，避免前后端字段不一致）
 * @param {Object} dbData 数据库原始数据
 * @param {String} type 类型：goods/record
 * @returns {Object} 适配前端的格式
 */
const formatData = (dbData, type) => {
  if (type === 'goods') {
    return {
      goodsId: dbData.id,                // 库字段id → 前端goodsId
      goodsName: dbData.goods_name,      // 库字段goods_name → 前端goodsName
      safeStock: dbData.safe_stock,      // 库字段safe_stock → 前端safeStock
      currentStock: dbData.current_stock,// 库字段current_stock → 前端currentStock
      status: dbData.status,             // 状态：正常/预警/补货中
      warehouse: dbData.warehouse_loc,   // 库字段warehouse_loc → 前端warehouse
      unitPrice: dbData.unit_price || 0  // 库字段unit_price → 前端unitPrice
    };
  } else if (type === 'record') {
    return {
      id: dbData.id,
      time: dbData.operate_time,         // 库字段operate_time → 前端time
      goodsName: dbData.goods_name,      // 关联商品名称
      type: dbData.operate_type,         // 库字段operate_type → 前端type（入库/出库）
      num: dbData.operate_num,           // 库字段operate_num → 前端num
      operator: dbData.operator,         // 操作人
      reason: dbData.reason || ''        // 操作原因
    };
  }
};

// ===================== 3. 核心业务方法（对外暴露，适配controller层调用） =====================
const StockModel = {
  /**
   * 获取库存数据（商品库存+出入库记录）
   * @returns {Object} 符合架构规范的响应格式：{code, data, msg}
   */
  getStockData: async () => {
    try {
      // 3.1 查询数据库商品库存表（goods_stock）
      const goodsSql = `
        SELECT id, goods_name, safe_stock, current_stock, status, warehouse_loc 
        FROM goods_stock 
        WHERE is_delete = 0
      `;
      const goodsResult = await query(goodsSql);
      const formattedGoods = goodsResult.length > 0 
        ? goodsResult.map(goods => formatData(goods, 'goods')) 
        : mockGoodsList; // 数据库无数据则兜底模拟数据

      // 3.2 查询数据库出入库记录表（in_out_record）
      const recordSql = `
        SELECT r.id, r.operate_time, r.operate_type, r.operate_num, r.operator, r.reason, g.goods_name
        FROM in_out_record r
        LEFT JOIN goods_stock g ON r.goods_id = g.id
        WHERE r.is_delete = 0
        ORDER BY r.operate_time DESC
      `;
      const recordResult = await query(recordSql);
      const formattedRecords = recordResult.length > 0 
        ? recordResult.map(record => formatData(record, 'record')) 
        : mockInOutRecord; // 数据库无数据则兜底模拟数据

      // 3.3 返回适配架构的响应（和原有格式一致，controller层无需修改）
      return {
        code: 200,
        data: {
          goods: formattedGoods,
          stock: formattedGoods, // 兼容原有返回的stock字段（和goods一致）
          inOutRecord: formattedRecords
        },
        msg: '获取库存数据成功'
      };
    } catch (error) {
      // 3.4 异常处理（架构统一的错误日志+兜底）
      console.error('[StockModel] 获取库存数据异常：', error.message);
      return {
        code: 500,
        data: {
          goods: mockGoodsList,
          stock: mockGoodsList,
          inOutRecord: mockInOutRecord
        }, // 异常时兜底模拟数据
        msg: `获取库存数据失败：${error.message}`
      };
    }
  },

  /**
   * 提交出入库操作
   * @param {Object} data 操作参数：{goodsId, type, num, time, operator, reason}
   * @returns {Object} 符合架构规范的响应格式：{code, data, msg}
   */
  submitInOutStock: async (data) => {
    // 3.1 参数校验（模型层基础校验，适配架构规范）
    const { goodsId, type, num, time, operator } = data;
    if (!goodsId || !type || !num || !time || !operator) {
      return {
        code: 400,
        data: {},
        msg: '参数错误：商品ID、操作类型、数量、时间、操作人不能为空'
      };
    }
    const operateNum = Number(num);
    if (isNaN(operateNum) || operateNum <= 0) {
      return {
        code: 400,
        data: {},
        msg: '参数错误：操作数量必须为正整数'
      };
    }

    try {
      // 3.2 先查询商品当前库存（用于更新）
      const goodsSql = `
        SELECT current_stock, safe_stock, goods_name 
        FROM goods_stock 
        WHERE id = ? AND is_delete = 0
      `;
      const goodsResult = await query(goodsSql, [goodsId]);
      if (goodsResult.length === 0) {
        return {
          code: 404,
          data: {},
          msg: '未找到指定商品'
        };
      }
      const targetGoods = goodsResult[0];
      let newStock = targetGoods.current_stock;

      // 3.3 计算新库存（入库+，出库-）
      if (type === '入库') {
        newStock += operateNum;
      } else if (type === '出库') {
        if (newStock < operateNum) {
          return {
            code: 400,
            data: {},
            msg: '出库失败：当前库存不足'
          };
        }
        newStock -= operateNum;
      } else {
        return {
          code: 400,
          data: {},
          msg: '操作类型错误：仅支持“入库”/“出库”'
        };
      }

      // 3.4 更新商品库存状态
      const newStatus = newStock < targetGoods.safe_stock ? '预警' : '正常';
      const updateStockSql = `
        UPDATE goods_stock 
        SET current_stock = ?, status = ?, update_time = NOW() 
        WHERE id = ?
      `;
      await query(updateStockSql, [newStock, newStatus, goodsId]);

      // 3.5 新增出入库记录
      const addRecordSql = `
        INSERT INTO in_out_record (goods_id, operate_time, operate_type, operate_num, operator, reason)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      await query(addRecordSql, [goodsId, time, type, operateNum, operator, data.reason || '']);

      // 3.6 返回成功响应
      return {
        code: 200,
        data: {},
        msg: `${type}登记成功`
      };
    } catch (error) {
      // 3.7 异常处理（日志+兜底模拟更新）
      console.error('[StockModel] 提交出入库异常：', error.message);
      
      // 兜底：更新模拟数据（保证前端能看到状态变化）
      const goodsIndex = mockGoodsList.findIndex(item => item.goodsId === goodsId);
      if (goodsIndex > -1) {
        // 更新库存
        if (type === '入库') {
          mockGoodsList[goodsIndex].currentStock += operateNum;
        } else {
          mockGoodsList[goodsIndex].currentStock -= operateNum;
        }
        // 更新状态
        mockGoodsList[goodsIndex].status = mockGoodsList[goodsIndex].currentStock < mockGoodsList[goodsIndex].safeStock 
          ? '预警' 
          : '正常';
        
        // 新增模拟记录
        mockInOutRecord.unshift({
          id: Date.now(),
          time: data.time,
          goodsName: mockGoodsList[goodsIndex].goodsName,
          type: data.type,
          num: data.num,
          operator: data.operator,
          reason: data.reason || ''
        });
      }

      return {
        code: 500,
        data: {},
        msg: `${type}登记失败（已兜底模拟更新）：${error.message}`
      };
    }
  },

  /**
   * 补货提醒操作
   * @param {Object} data 操作参数：{goodsId}
   * @returns {Object} 符合架构规范的响应格式：{code, data, msg}
   */
  replenishStock: async (data) => {
    // 3.1 参数校验
    const { goodsId } = data;
    if (!goodsId) {
      return {
        code: 400,
        data: {},
        msg: '参数错误：商品ID不能为空'
      };
    }

    try {
      // 3.2 更新商品状态为“补货中”
      const updateSql = `
        UPDATE goods_stock 
        SET status = '补货中', update_time = NOW() 
        WHERE id = ? AND is_delete = 0
      `;
      const updateResult = await query(updateSql, [goodsId]);
      
      if (updateResult.affectedRows === 0) {
        return {
          code: 404,
          data: {},
          msg: '未找到指定商品，补货提醒失败'
        };
      }

      // 3.3 返回成功响应
      return {
        code: 200,
        data: {},
        msg: '补货提醒发送成功'
      };
    } catch (error) {
      // 3.4 异常处理（日志+兜底模拟更新）
      console.error('[StockModel] 补货提醒异常：', error.message);
      
      // 兜底：更新模拟数据
      const goodsIndex = mockGoodsList.findIndex(item => item.goodsId === goodsId);
      if (goodsIndex > -1) {
        mockGoodsList[goodsIndex].status = '补货中';
      }

      return {
        code: 500,
        data: {},
        msg: '补货提醒发送失败（已兜底模拟更新）：${error.message}'
      };
    }
  },

  /**
   * 获取仓储统计数据
   * @returns {Object} 符合架构规范的响应格式：{code, data, msg}
   */
  getWarehouseStats: async () => {
    try {
      const statsSql = `
        SELECT 
          COUNT(*) as total_goods,
          SUM(current_stock) as total_stock,
          SUM(CASE WHEN status = '预警' THEN 1 ELSE 0 END) as warning_count,
          SUM(CASE WHEN status = '缺货' THEN 1 ELSE 0 END) as shortage_count,
          SUM(CASE WHEN status = '正常' THEN 1 ELSE 0 END) as normal_count,
          AVG(current_stock) as avg_stock,
          MAX(current_stock) as max_stock,
          MIN(current_stock) as min_stock
        FROM goods_stock
        WHERE is_delete = 0
      `;
      const [statsResult] = await query(statsSql);
      
      const stats = statsResult[0] || {};

      const orderValueSql = `
        SELECT SUM(amount) as total_order_value
        FROM orders
        WHERE status != 'cancelled'
      `;
      const [orderValueResult] = await query(orderValueSql);
      
      const totalOrderValue = orderValueResult[0]?.total_order_value || 0;

      const inOutSql = `
        SELECT 
          COUNT(CASE WHEN operate_type = '入库' THEN 1 END) as today_inbound,
          COUNT(CASE WHEN operate_type = '出库' THEN 1 END) as today_outbound,
          SUM(CASE WHEN operate_type = '入库' THEN operate_num ELSE 0 END) as today_inbound_qty,
          SUM(CASE WHEN operate_type = '出库' THEN operate_num ELSE 0 END) as today_outbound_qty
        FROM in_out_record
        WHERE DATE(create_time) = (SELECT MAX(DATE(create_time)) FROM in_out_record)
      `;
      const [inOutResult] = await query(inOutSql);
      
      const inOutStats = inOutResult[0] || {};

      const orderTypeSql = `
        SELECT 
          goods_type as name,
          COUNT(*) as value
        FROM orders
        WHERE status != 'cancelled' AND goods_type IS NOT NULL AND goods_type != ''
        GROUP BY goods_type
        ORDER BY value DESC
      `;
      const [orderTypeResult] = await query(orderTypeSql);
      
      const orderTypeStats = orderTypeResult || [];

      return {
        code: 200,
        data: {
          totalGoods: stats.total_goods || 0,
          totalStock: stats.total_stock || 0,
          totalValue: totalOrderValue,
          warningCount: stats.warning_count || 0,
          shortageCount: stats.shortage_count || 0,
          normalCount: stats.normal_count || 0,
          avgStock: Math.round(stats.avg_stock || 0),
          maxStock: stats.max_stock || 0,
          minStock: stats.min_stock || 0,
          todayInbound: inOutStats.today_inbound || 0,
          todayOutbound: inOutStats.today_outbound || 0,
          todayInboundQty: inOutStats.today_inbound_qty || 0,
          todayOutboundQty: inOutStats.today_outbound_qty || 0,
          orderTypeStats: orderTypeStats
        },
        msg: '获取统计数据成功'
      };
    } catch (error) {
      console.error('[StockModel] 获取统计数据异常：', error.message);
      
      return {
        code: 500,
        data: {
          totalGoods: 4,
          totalStock: 1145,
          warningCount: 2,
          shortageCount: 1,
          normalCount: 1,
          avgStock: 286,
          maxStock: 600,
          minStock: 15,
          todayInbound: 2,
          todayOutbound: 2,
          todayInboundQty: 80,
          todayOutboundQty: 35
        },
        msg: `获取统计数据失败（已兜底模拟数据）：${error.message}`
      };
    }
  }
};

// ===================== 4. 对外暴露（适配routes/controller层调用） =====================
module.exports = StockModel;