const express = require('express');
const router = express.Router();

// ========== 复用你app.js中的mockData（避免重复定义） ==========
// 注意：如果你的mockData在app.js中定义，需先把mockData导出，或直接复制到这里（二选一）
// 方案1：如果app.js中导出了mockData（推荐），取消下面注释并引入
// const { mockData } = require('../app');

// 方案2：直接复制app.js中的mockData到这里（确保和app.js一致）
const mockData = {
  "manager": {
    "total_order": 2150,
    "finished_order": 2080,
    "exception_order": 70,
    "avg_delivery_time": 8.2,
    "trend_data": { "xAxis": ["1月", "2月", "3月", "4月"], "series": [1200, 1580, 1820, 2150] },
    "pie_data": { "xAxis": ["生鲜配送", "标品配送", "大件配送", "耗材配送"], "series": [650, 980, 320, 200] },
    "exception_order_top5": [
      { orderNo: "WL20260201001", reason: "超时配送", area: "东区" },
      { orderNo: "WL20260201002", reason: "货物破损", area: "西区" },
      { orderNo: "WL20260201003", reason: "地址错误", area: "南区" },
      { orderNo: "WL20260201004", reason: "客户拒收", area: "北区" },
      { orderNo: "WL20260201005", reason: "运力不足", area: "中区" }
    ]
  },
  "dispatcher": {
    "today_transport": 357,
    "unfinished_transport": 28,
    "avg_transport_time": 4.5,
    "trend_data": { "xAxis": ["早班(6-12)", "中班(12-18)", "晚班(18-24)"], "series": [85, 162, 110] },
    "pie_data": { "xAxis": ["厢式车", "冷链车", "平板车"], "series": [200, 100, 57] },
    "car_status": [
      { id:1, carNo: "沪A12345", status: "空闲", driver: "张三", phone: "13800138000", area:"东区", load:"5吨" },
      { id:2, carNo: "沪B67890", status: "在途", driver: "李四", phone: "13900139000", area:"西区", load:"8吨" },
      { id:3, carNo: "沪C11223", status: "维修", driver: "王五", phone: "13700137000", area:"南区", load:"10吨" }
    ],
    "wait_allocate_order": [
      { orderId: "WL20260221001", area: "东区", goodsType: "生鲜", weight:"2吨", urgent: "紧急", status:"待分配" },
      { orderId: "WL20260221002", area: "西区", goodsType: "标品", weight:"3吨", urgent: "普通", status:"待分配" }
    ],
    "track_data": [
      {
        orderId: "WL20260221001",
        status: "配送中",
        points: [
          { from: "仓库A", fromCoord: [121.4737, 31.2304], to: "配送点1", toCoord: [121.5051, 31.2477] },
          { from: "配送点1", fromCoord: [121.5051, 31.2477], to: "配送点2", toCoord: [121.5370, 31.2519] }
        ],
        detail: [
          { time: "2026-02-21 08:00", node: "仓库A出库", status: "待配送", operator: "张三", remark: "生鲜装车完成" },
          { time: "2026-02-21 09:30", node: "配送点1", status: "配送中", operator: "张三", remark: "正在卸货" }
        ]
      }
    ]
  },
  "warehouse": {
    "total_stock": 835,
    "pending_out_stock": 120,
    "warning_stock": 15,
    "stock_turnover": 85,
    "pie_data": { "xAxis": ["库位A(生鲜)", "库位B(标品)", "库位C(大件)", "库位D(耗材)"], "series": [210, 350, 180, 95] },
    "stock_detail": [
      { goodsId:1, goodsName: "生鲜蔬菜", stock: 45, safeStock: 50, status: "预警", warehouse: "库位A" },
      { goodsId:2, goodsName: "标品纸巾", stock: 120, safeStock: 80, status: "正常", warehouse: "库位B" },
      { goodsId:3, goodsName: "大件家电", stock: 30, safeStock: 20, status: "正常", warehouse: "库位C" },
      { goodsId:4, goodsName: "耗材纸箱", stock: 15, safeStock: 20, status: "预警", warehouse: "库位D" }
    ],
    "in_out_record": [
      { id:1, time: "2026-02-21 09:00", type: "入库", goodsName: "生鲜蔬菜", num: 100, operator: "张三" },
      { id:2, time: "2026-02-21 10:30", type: "出库", goodsName: "标品纸巾", num: 50, operator: "李四" }
    ]
  }
};

// ========== 原有接口（保留，不修改） ==========
// 接口1：获取角色数据
router.get('/get_role_data', (req, res) => {
  const { role = 'manager' } = req.query;
  res.json({
    code: 200,
    msg: "success",
    data: mockData[role] || mockData.manager
  });
});

// 接口2：切换角色
router.post('/change_role', (req, res) => {
  const { role } = req.body;
  res.json({
    code: 200,
    msg: `切换为${role}成功`,
    data: { current_role: role || 'manager' }
  });
});

// ========== 新增：调度员功能路由（仅添加，不修改原有） ==========
// 1. 获取运力调度数据
router.get('/dispatcher/capacity', (req, res) => {
  res.json({
    code: 200,
    msg: "success",
    data: {
      cars: mockData.dispatcher.car_status,
      orders: mockData.dispatcher.wait_allocate_order
    }
  });
});

// 2. 分配运单接口
router.post('/dispatcher/allocate', (req, res) => {
  const { orderId, carId } = req.body;
  // 模拟更新状态
  const car = mockData.dispatcher.car_status.find(item => item.id === carId);
  if (car) car.status = "已分配";
  const order = mockData.dispatcher.wait_allocate_order.find(item => item.orderId === orderId);
  if (order) order.status = "已分配";
  
  res.json({
    code: 200,
    msg: "运单分配成功",
    data: {}
  });
});

// 3. 获取运输轨迹数据
router.get('/dispatcher/track', (req, res) => {
  const { orderId } = req.query;
  let tracks = mockData.dispatcher.track_data;
  if (orderId) {
    tracks = tracks.filter(item => item.orderId === orderId);
  }
  res.json({
    code: 200,
    msg: "success",
    data: { tracks }
  });
});

// ========== 新增：仓储员功能路由（仅添加，不修改原有） ==========
// 1. 获取库存数据
router.get('/warehouse/stock', (req, res) => {
  res.json({
    code: 200,
    msg: "success",
    data: {
      goods: mockData.warehouse.stock_detail,
      stock: mockData.warehouse.stock_detail,
      inOutRecord: mockData.warehouse.in_out_record
    }
  });
});

// 2. 提交出入库登记
router.post('/warehouse/inout', (req, res) => {
  const { goodsId, num, type, operator } = req.body;
  // 模拟更新库存
  const goods = mockData.warehouse.stock_detail.find(item => item.goodsId === goodsId);
  if (goods) {
    if (type === "入库") {
      goods.stock = Number(goods.stock) + Number(num);
    } else {
      goods.stock = Number(goods.stock) - Number(num);
    }
    // 更新状态
    goods.status = goods.stock < goods.safeStock ? "预警" : "正常";
  }
  // 新增记录
  mockData.warehouse.in_out_record.unshift({
    id: Date.now(),
    time: new Date().toLocaleString(),
    goodsName: goods?.goodsName || "",
    type,
    num,
    operator
  });
  
  res.json({
    code: 200,
    msg: `${type}登记成功`,
    data: {}
  });
});

// 3. 补货提醒接口
router.post('/warehouse/replenish', (req, res) => {
  const { goodsId } = req.body;
  const goods = mockData.warehouse.stock_detail.find(item => item.goodsId === goodsId);
  if (goods) goods.status = "补货中";
  
  res.json({
    code: 200,
    msg: "补货提醒发送成功",
    data: {}
  });
});

// 导出路由（必须保留）
module.exports = router;