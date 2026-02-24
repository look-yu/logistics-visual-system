// 车辆/运单数据模型（适配整体后端架构：config/db.js + controller层调用）
const { query } = require('../config/db'); // 引入架构统一的数据库查询工具

// ===================== 1. 模拟数据（数据库兜底/测试用，保留原有结构） =====================
const mockCarList = [
  { id: 1, carNo: '京A12345', driver: '张三', phone: '13800138000', status: '空闲', area: '朝阳区', load: '5吨' },
  { id: 2, carNo: '京B67890', driver: '李四', phone: '13900139000', status: '在途', area: '海淀区', load: '8吨' },
  { id: 3, carNo: '京C11223', driver: '王五', phone: '13700137000', status: '维修', area: '丰台区', load: '10吨' },
  { id: 4, carNo: '京D44556', driver: '赵六', phone: '13600136000', status: '空闲', area: '东城区', load: '6吨' }
];

const mockOrderList = [
  { orderId: 'OD20260221001', goodsType: '生鲜', weight: '2吨', area: '朝阳区', urgent: '紧急', status: '待分配' },
  { orderId: 'OD20260221002', goodsType: '标品', weight: '3吨', area: '海淀区', urgent: '普通', status: '待分配' },
  { orderId: 'OD20260221003', goodsType: '大件', weight: '8吨', area: '丰台区', urgent: '紧急', status: '待分配' },
  { orderId: 'OD20260221004', goodsType: '耗材', weight: '1吨', area: '西城区', urgent: '普通', status: '已分配' }
];

// ===================== 2. 私有工具函数（模型层内部使用，适配架构规范） =====================
/**
 * 数据库字段 → 前端返回字段 映射（统一格式，避免前后端字段不一致）
 * @param {Object} dbData 数据库原始数据
 * @param {String} type 类型：car/order
 * @returns {Object} 适配前端的格式
 */
const formatData = (dbData, type) => {
  if (type === 'car') {
    return {
      id: dbData.id,
      carNo: dbData.car_no,    // 库字段car_no → 前端carNo
      driver: dbData.driver,
      phone: dbData.phone,
      status: dbData.status,
      area: dbData.area,
      load: `${dbData.load_capacity}吨` // 库字段load_capacity → 前端load（拼接单位）
    };
  } else if (type === 'order') {
    return {
      orderId: dbData.order_id, // 库字段order_id → 前端orderId
      goodsType: dbData.goods_type, // 库字段goods_type → 前端goodsType
      weight: `${dbData.weight}吨`, // 库字段weight → 前端weight（拼接单位）
      area: dbData.area,
      urgent: dbData.urgent_level, // 库字段urgent_level → 前端urgent
      status: dbData.order_status, // 库字段order_status → 前端status
      carId: dbData.vehicle_id || '', // 库字段vehicle_id → 前端carId
      arriveTime: dbData.expected_arrive_time || '' // 库字段 → 前端arriveTime
    };
  }
};

// ===================== 新增：筛选/下钻工具函数（仅追加，不改动原有） =====================
/**
 * 筛选mock数据（数据库无数据时，保证mock数据也能筛选）
 * @param {Array} mockData mock数组（car/order）
 * @param {Object} filterParams 筛选参数
 * @param {String} type 类型：car/order
 * @returns {Array} 筛选后的mock数据
 */
const filterMockData = (mockData, filterParams, type) => {
  const { area, drillDownLevel, drillDimension } = filterParams;
  let filteredData = [...mockData];

  // 1. 区域筛选（all则不筛选）
  if (area && area !== 'all') {
    filteredData = filteredData.filter(item => item.area === area);
  }

  // 2. 下钻维度筛选（仅适配运单的月度→日度，mock数据简化处理）
  if (drillDownLevel === 'day' && drillDimension) {
    // mock数据无时间字段，简化为：仅保留该维度下的前2条数据（模拟日度细分）
    filteredData = filteredData.slice(0, 2);
  }

  return filteredData;
};

/**
 * 拼接SQL筛选条件（仅追加，不改动原有WHERE is_delete=0）
 * @param {Object} filterParams 筛选参数
 * @returns {String} SQL条件片段
 */
const buildSqlCondition = (filterParams) => {
  const { timeRange, area, drillDownLevel, drillDimension } = filterParams;
  let condition = '';

  // 1. 时间范围筛选（适配数据库的create_time字段）
  if (timeRange) {
    const [startTime, endTime] = timeRange.split('~');
    condition += ` AND create_time BETWEEN '${startTime}' AND '${endTime}'`;
  }

  // 2. 区域筛选
  if (area && area !== 'all') {
    condition += ` AND area = '${area}'`;
  }

  // 3. 下钻层级筛选（月度→日度，适配create_time的日期格式化）
  if (drillDownLevel === 'day' && drillDimension) {
    condition += ` AND DATE_FORMAT(create_time, '%Y-%m') = '${drillDimension}'`;
  }

  return condition;
};

// ===================== 3. 核心业务方法（对外暴露，适配controller层调用） =====================
const VehicleModel = {
  /**
   * 获取运力数据（车辆+运单）
   * @param {Object} filterParams 筛选/下钻参数：{timeRange, area, drillDownLevel, drillDimension} 【新增参数】
   * @returns {Object} 符合架构规范的响应格式：{code, data, msg}
   */
  getCapacityData: async (filterParams = {}) => { // 【修改：新增filterParams参数，默认空对象】
    try {
      // 3.1 拼接SQL筛选条件 【新增】
      const sqlCondition = buildSqlCondition(filterParams);

      // 3.2 查询数据库车辆表（vehicle_info）【修改：追加筛选条件】
      const carSql = `
        SELECT id, car_no, driver, phone, status, area, load_capacity 
        FROM vehicle_info 
        WHERE is_delete = 0 ${sqlCondition}
      `;
      const carResult = await query(carSql);
      // 【修改：mock数据也做筛选】
      const formattedCars = carResult.length > 0 
        ? carResult.map(car => formatData(car, 'car')) 
        : filterMockData(mockCarList, filterParams, 'car'); 

      // 3.3 查询数据库运单表（waybill_main）【修改：追加筛选条件】
      const orderSql = `
        SELECT id, order_id, goods_type, weight, area, urgent_level, order_status, vehicle_id, expected_arrive_time 
        FROM waybill_main 
        WHERE is_delete = 0 ${sqlCondition}
      `;
      const orderResult = await query(orderSql);
      // 【修改：mock数据也做筛选】
      const formattedOrders = orderResult.length > 0 
        ? orderResult.map(order => formatData(order, 'order')) 
        : filterMockData(mockOrderList, filterParams, 'order'); 

      // 3.4 返回适配架构的响应（和原有格式一致，controller层无需修改）
      return {
        code: 200,
        data: { cars: formattedCars, orders: formattedOrders },
        msg: '获取运力数据成功'
      };
    } catch (error) {
      // 3.5 异常处理（架构统一的错误日志+兜底）
      console.error('[VehicleModel] 获取运力数据异常：', error.message);
      // 【修改：异常时mock数据也做筛选】
      return {
        code: 500,
        data: { 
          cars: filterMockData(mockCarList, filterParams, 'car'), 
          orders: filterMockData(mockOrderList, filterParams, 'order') 
        }, 
        msg: `获取运力数据失败：${error.message}`
      };
    }
  },

  /**
   * 分配运单
   * @param {Object} params 分配参数：{carId, orderId, arriveTime}
   * @returns {Object} 符合架构规范的响应格式：{code, data, msg}
   */
  allocateOrder: async (params) => {
    // 3.1 参数校验（模型层基础校验，适配架构规范）
    const { carId, orderId, arriveTime } = params;
    if (!carId || !orderId || !arriveTime) {
      return {
        code: 400,
        data: {},
        msg: '参数错误：车辆ID、运单号、预计到达时间不能为空'
      };
    }

    try {
      // 3.2 数据库事务：同时更新车辆状态+运单分配（保证数据一致性）
      // 注：若需严格事务，可基于db.pool实现，此处简化为连续更新
      // 3.2.1 更新车辆状态为“已分配”
      const updateCarSql = `
        UPDATE vehicle_info 
        SET status = '已分配', update_time = NOW() 
        WHERE id = ? AND is_delete = 0
      `;
      await query(updateCarSql, [carId]);

      // 3.2.2 更新运单为“已分配”，关联车辆ID+预计到达时间
      const updateOrderSql = `
        UPDATE waybill_main 
        SET order_status = '已分配', vehicle_id = ?, expected_arrive_time = ?, update_time = NOW() 
        WHERE order_id = ? AND is_delete = 0
      `;
      await query(updateOrderSql, [carId, arriveTime, orderId]);

      // 3.3 返回成功响应
      return {
        code: 200,
        data: {},
        msg: '运单分配成功'
      };
    } catch (error) {
      // 3.4 异常处理（日志+兜底模拟更新）
      console.error('[VehicleModel] 分配运单异常：', error.message);
      
      // 兜底：更新模拟数据（保证前端能看到状态变化）
      const carIndex = mockCarList.findIndex(car => car.id === carId);
      if (carIndex > -1) mockCarList[carIndex].status = '已分配';
      
      const orderIndex = mockOrderList.findIndex(order => order.orderId === orderId);
      if (orderIndex > -1) {
        mockOrderList[orderIndex].status = '已分配';
        mockOrderList[orderIndex].carId = carId;
        mockOrderList[orderIndex].arriveTime = arriveTime;
      }

      return {
        code: 500,
        data: {},
        msg: `运单分配失败（已兜底模拟更新）：${error.message}`
      };
    }
  }
};

// ===================== 4. 对外暴露（适配routes/controller层调用） =====================
module.exports = VehicleModel;