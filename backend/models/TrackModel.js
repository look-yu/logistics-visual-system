// 运输轨迹数据模型（适配整体后端架构：config/db.js + controller层调用）
const { query } = require('../config/db'); // 引入架构统一的数据库查询工具

// ===================== 1. 模拟数据（数据库兜底/测试用，保留原有结构） =====================
const mockTrackData = [
  {
    orderId: 'OD20260221001',
    status: '配送中',
    points: [
      { from: '仓库A', fromCoord: [116.403874, 39.914885], to: '配送点1', toCoord: [116.4551, 39.9177] },
      { from: '配送点1', fromCoord: [116.4551, 39.9177], to: '配送点2', toCoord: [116.4870, 39.9219] }
    ],
    detail: [
      { time: '2026-02-21 08:00', node: '仓库A出库', status: '待配送', operator: '张三', remark: '生鲜装车完成' },
      { time: '2026-02-21 09:30', node: '配送点1', status: '配送中', operator: '张三', remark: '正在卸货' },
      { time: '2026-02-21 11:00', node: '配送点2', status: '待配送', operator: '张三', remark: '预计12点送达' }
    ]
  },
  {
    orderId: 'OD20260221002',
    status: '已完成',
    points: [
      { from: '仓库B', fromCoord: [116.343874, 39.894885], to: '配送点3', toCoord: [116.3851, 39.9077] }
    ],
    detail: [
      { time: '2026-02-21 07:00', node: '仓库B出库', status: '待配送', operator: '李四', remark: '标品装车完成' },
      { time: '2026-02-21 08:30', node: '配送点3', status: '已完成', operator: '李四', remark: '配送完成' }
    ]
  }
];

// ===================== 2. 私有工具函数（模型层内部使用，适配架构规范） =====================
/**
 * 数据库字段 → 前端返回字段 映射（统一格式，避免前后端字段不一致）
 * @param {Object} trackMain 轨迹主表数据
 * @param {Array} trackPoints 轨迹点数据
 * @param {Array} trackDetails 轨迹详情数据
 * @returns {Object} 适配前端的轨迹格式
 */
const formatTrackData = (trackMain, trackPoints, trackDetails) => {
  // 格式化轨迹点
  const formattedPoints = trackPoints.map(point => ({
    from: point.from_node,          // 库字段from_node → 前端from
    fromCoord: JSON.parse(point.from_coord), // 库字段from_coord（JSON字符串）→ 前端fromCoord数组
    to: point.to_node,              // 库字段to_node → 前端to
    toCoord: JSON.parse(point.to_coord)      // 库字段to_coord（JSON字符串）→ 前端toCoord数组
  }));

  // 格式化轨迹详情
  const formattedDetails = trackDetails.map(detail => ({
    time: detail.operate_time,      // 库字段operate_time → 前端time
    node: detail.node_name,         // 库字段node_name → 前端node
    status: detail.node_status,     // 库字段node_status → 前端status
    operator: detail.operator,      // 操作人
    remark: detail.remark || ''     // 备注
  }));

  // 组装完整轨迹数据
  return {
    orderId: trackMain.order_id,    // 库字段order_id → 前端orderId
    status: trackMain.track_status, // 库字段track_status → 前端status
    points: formattedPoints,
    detail: formattedDetails
  };
};

// ===================== 3. 核心业务方法（对外暴露，适配controller层调用） =====================
const TrackModel = {
  /**
   * 获取轨迹数据（支持按运单号筛选）
   * @param {String} orderId 运单号（可选，不传则返回所有）
   * @returns {Object} 符合架构规范的响应格式：{code, data, msg}
   */
  getTrackData: async (orderId) => {
    try {
      // 3.1 构建查询条件（支持按运单号筛选）
      const orderIdCondition = orderId ? `AND t.order_id = ?` : '';
      const queryParams = orderId ? [orderId] : [];

      // 3.2 查询轨迹主表（transport_track）
      const trackMainSql = `
        SELECT id, order_id, track_status 
        FROM transport_track 
        WHERE is_delete = 0 ${orderIdCondition}
      `;
      const trackMainResult = await query(trackMainSql, queryParams);

      // 无数据库数据时直接兜底模拟数据
      if (trackMainResult.length === 0) {
        let filteredMock = mockTrackData;
        if (orderId) filteredMock = mockTrackData.filter(item => item.orderId === orderId);
        return {
          code: 200,
          data: { tracks: filteredMock },
          msg: '使用模拟数据（数据库无匹配轨迹）'
        };
      }

      // 3.3 批量查询轨迹点和详情（关联主表ID）
      const trackList = [];
      for (const main of trackMainResult) {
        // 查询轨迹点（track_point）
        const pointSql = `
          SELECT from_node, from_coord, to_node, to_coord 
          FROM track_point 
          WHERE track_id = ? AND is_delete = 0
          ORDER BY sort_num ASC
        `;
        const pointResult = await query(pointSql, [main.id]);

        // 查询轨迹详情（track_detail）
        const detailSql = `
          SELECT operate_time, node_name, node_status, operator, remark 
          FROM track_detail 
          WHERE track_id = ? AND is_delete = 0
          ORDER BY operate_time ASC
        `;
        const detailResult = await query(detailSql, [main.id]);

        // 格式化并组装轨迹数据
        trackList.push(formatTrackData(main, pointResult, detailResult));
      }

      // 3.4 返回适配架构的响应（和原有格式一致，controller层无需修改）
      return {
        code: 200,
        data: { tracks: trackList },
        msg: '获取轨迹数据成功'
      };
    } catch (error) {
      // 3.5 异常处理（架构统一的错误日志+兜底）
      console.error('[TrackModel] 获取轨迹数据异常：', error.message);
      
      // 异常时兜底模拟数据（保留原有筛选逻辑）
      let filteredMock = mockTrackData;
      if (orderId) filteredMock = mockTrackData.filter(item => item.orderId === orderId);
      
      return {
        code: 500,
        data: { tracks: filteredMock }, // 异常时兜底模拟数据
        msg: `获取轨迹数据失败：${error.message}`
      };
    }
  }
};

// ===================== 4. 对外暴露（适配routes/controller层调用） =====================
module.exports = TrackModel;