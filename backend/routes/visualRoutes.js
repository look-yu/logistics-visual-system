const express = require('express');
const router = express.Router();

const UserController = require('../controllers/UserController');
const OrderController = require('../controllers/OrderController');
const VehicleController = require('../controllers/VehicleController');
const ReportController = require('../controllers/ReportController');
const PriceController = require('../controllers/PriceController');
const CustomerController = require('../controllers/CustomerController');
const ServiceRequestController = require('../controllers/ServiceRequestController');
const ShipmentPlanController = require('../controllers/ShipmentPlanController');
const TransportQueueController = require('../controllers/TransportQueueController');
const AuthController = require('../controllers/AuthController');

// ========== 用户管理路由 ==========
router.post('/login', UserController.login);
router.get('/users', UserController.getUserList);
router.post('/users', UserController.register);
router.put('/users/:id', UserController.updateUser);
router.delete('/users/:id', UserController.deleteUser);

// ========== 订单管理路由 ==========
router.get('/orders', OrderController.getOrderList);
router.post('/orders', OrderController.createOrder);
router.post('/orders/customer', OrderController.customerCreateOrder);
router.get('/orders/:id', OrderController.getOrderDetail);
router.put('/orders/:id/status', OrderController.updateOrderStatus);
router.put('/orders/:id/sign', OrderController.signOrder);
router.put('/orders/:id/cancel', OrderController.cancelOrder);
router.get('/orders/:id/driver', OrderController.getOrderDriver);

// ========== 客户认证路由 ==========
router.post('/auth/register', AuthController.register);
router.post('/auth/login', AuthController.login);
router.put('/auth/customers/:id/password', AuthController.updatePassword);

// ========== 价格管理路由 ==========
router.get('/price/config', PriceController.getPriceConfig);
router.put('/price/config', PriceController.updatePriceConfig);
router.post('/price/calculate', PriceController.calculateOrderPrice);

// ========== 运输管理路由 ==========
router.get('/vehicles', VehicleController.getVehicleList);
router.post('/transport/schedule', VehicleController.scheduleVehicle);
router.get('/transport/tasks', VehicleController.getTaskList);
router.put('/transport/tasks/:id/status', VehicleController.updateTaskStatus);

// ========== 客户管理路由 ==========
router.get('/customers', CustomerController.getCustomerList);
router.get('/customers/:id', CustomerController.getCustomerDetail);
router.post('/customers', CustomerController.createCustomer);
router.put('/customers/:id', CustomerController.updateCustomer);
router.delete('/customers/:id', CustomerController.deleteCustomer);
router.get('/customers/stats', CustomerController.getCustomerStats);

// ========== 服务请求路由 ==========
router.get('/service-requests', ServiceRequestController.getServiceRequestList);
router.get('/service-requests/:id', ServiceRequestController.getServiceRequestDetail);
router.post('/service-requests', ServiceRequestController.createServiceRequest);
router.put('/service-requests/:id', ServiceRequestController.updateServiceRequest);
router.delete('/service-requests/:id', ServiceRequestController.deleteServiceRequest);
router.post('/service-requests/:id/handle', ServiceRequestController.handleServiceRequest);
router.get('/service-requests/stats', ServiceRequestController.getServiceRequestStats);

// ========== 装运计划路由 ==========
router.get('/shipment-plans', ShipmentPlanController.getShipmentPlanList);
router.get('/shipment-plans/:id', ShipmentPlanController.getShipmentPlanDetail);
router.post('/shipment-plans', ShipmentPlanController.createShipmentPlan);
router.put('/shipment-plans/:id', ShipmentPlanController.updateShipmentPlan);
router.delete('/shipment-plans/:id', ShipmentPlanController.deleteShipmentPlan);
router.post('/shipment-plans/:id/confirm', ShipmentPlanController.confirmShipmentPlan);
router.post('/shipment-plans/:id/start', ShipmentPlanController.startShipmentPlan);
router.post('/shipment-plans/:id/complete', ShipmentPlanController.completeShipmentPlan);
router.get('/shipment-plans/stats', ShipmentPlanController.getShipmentPlanStats);

// ========== 运输队列路由 ==========
router.get('/reports/dashboard', ReportController.getDashboardData);
router.get('/reports/order-trend', ReportController.getOrderTrend);

const ReportModel = require('../models/ReportModel');

// ========== 辅助函数：生成随机变动数据 ==========
const randomChange = (val, range = 0.1) => {
  const delta = val * range;
  return Math.round(val + (Math.random() * delta * 2 - delta));
};

// ========== 原有接口（已升级为动态模拟） ==========
// 接口1：获取角色数据
router.get('/get_role_data', async (req, res) => {
  const { role = 'manager', month, dimension = 'order' } = req.query;
  
  try {
    if (role === 'manager') {
      // 从真实数据库获取管理层数据
      const days = month ? null : 7;
      const orderStats = await ReportModel.getOrderStats(days, month ? parseInt(month) : null);
      const coreIndicators = await ReportModel.getCoreIndicators();
      const exceptionOrders = await ReportModel.getExceptionOrders();
      const orderTypeDistribution = await ReportModel.getOrderTypeDistribution();
      
      const data = {
        core_indicators: coreIndicators || {
          total_order_num: '0',
          total_order_trend: '0%',
          finish_order_num: '0',
          finish_order_trend: '0%',
          exception_order_num: '0',
          exception_order_trend: '0%',
          avg_delivery_time: '0h',
          avg_delivery_trend: '0%'
        },
        trend_data: {
          xAxis: orderStats.length > 0 ? orderStats.map(i => {
            const dateStr = i.date ? String(i.date) : '';
            return dateStr.split('-').pop() + '日';
          }) : [],
          series: dimension === 'amount' 
            ? (orderStats.length > 0 ? orderStats.map(i => (i.total_amount / 1000).toFixed(1)) : [])
            : (orderStats.length > 0 ? orderStats.map(i => i.count) : [])
        },
        pie_data: orderTypeDistribution,
        exception_order_top5: exceptionOrders.length > 0 ? exceptionOrders : []
      };
      return res.json({ code: 200, data, msg: "success" });
    }

    if (role === 'dispatcher') {
      const coreIndicators = await ReportModel.getDispatcherCoreIndicators();
      const waitAllocateOrders = await ReportModel.getWaitAllocateOrders();
      const activeVehicles = await ReportModel.getActiveVehicles();
      const taskProgress = await ReportModel.getTaskProgress();
      const orderStatusStats = await ReportModel.getOrderStatusStats();
      const customerGrowth = await ReportModel.getCustomerGrowth();
      const provinceOrderStats = await ReportModel.getProvinceOrderStats();
      
      const data = {
        core_indicators: coreIndicators || {
          today_transport_num: '0',
          today_transport_trend: '0%',
          unfinished_order_num: '0',
          unfinished_order_trend: '0%',
          avg_delivery_time: '0h',
          avg_delivery_trend: '0%'
        },
        wait_allocate_order: waitAllocateOrders.length > 0 ? waitAllocateOrders : [],
        active_vehicles: activeVehicles,
        task_progress: taskProgress,
        order_status_stats: orderStatusStats,
        customer_growth: customerGrowth,
        province_order_stats: provinceOrderStats
      };
      return res.json({ code: 200, data, msg: "success" });
    }

    res.json({ code: 404, msg: "未找到该角色的数据" });
  } catch (err) {
    console.error('获取角色数据失败：', err);
    res.json({ code: 500, msg: "服务器内部错误" });
  }
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
// 1. 获取运力调度数据（使用真实数据）
router.get('/dispatcher/capacity', async (req, res) => {
  const db = require('../config/db');
  
  try {
    // 1. 获取所有车辆信息
    const [vehicles] = await db.query(`
      SELECT 
        id,
        car_no as carNo,
        driver_name as driver,
        driver_phone as phone,
        status,
        current_area as area,
        load_capacity as load
      FROM vehicles
      ORDER BY id ASC
    `);
    
    // 2. 获取待分配订单
    const [orders] = await db.query(`
      SELECT 
        id as orderId,
        order_no as orderNo,
        customer_name,
        sender_address,
        receiver_address,
        goods_type,
        weight,
        amount,
        status
      FROM orders
      WHERE status IN ('pending', 'assigned')
      ORDER BY create_time ASC
    `);
    
    res.json({
      code: 200,
      msg: "success",
      data: {
        cars: vehicles,
        orders: orders
      }
    });
  } catch (err) {
    console.error('获取运力调度数据失败:', err);
    res.json({
      code: 500,
      msg: "获取运力调度数据失败",
      data: {
        cars: [],
        orders: []
      }
    });
  }
});

// 2. 分配运单接口（关联真实订单）
router.post('/dispatcher/allocate', async (req, res) => {
  const { orderId, carId } = req.body;
  const db = require('../config/db');
  
  if (!orderId || !carId) {
    return res.json({
      code: 400,
      msg: "参数不完整",
      data: {}
    });
  }
  
  const connection = await db.pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // 1. 更新订单状态为已分配
    await connection.query(
      'UPDATE orders SET status = ? WHERE id = ?',
      ['assigned', orderId]
    );
    
    // 2. 创建运输任务
    const [taskResult] = await connection.query(
      'INSERT INTO transport_tasks (task_no, order_id, vehicle_id, status) VALUES (?, ?, ?, ?)',
      [`TASK${Date.now()}`, orderId, carId, 'pending']
    );
    
    // 3. 更新车辆状态为忙碌
    await connection.query(
      'UPDATE vehicles SET status = ?, current_order_id = ? WHERE id = ?',
      ['busy', orderId, carId]
    );
    
    await connection.commit();
    
    res.json({
      code: 200,
      msg: "运单分配成功",
      data: {
        taskId: taskResult.insertId,
        orderId: orderId,
        carId: carId
      }
    });
  } catch (err) {
    await connection.rollback();
    console.error('分配运单失败:', err);
    res.json({
      code: 500,
      msg: "分配运单失败：" + err.message,
      data: {}
    });
  } finally {
    connection.release();
  }
});

// 3. 获取运输轨迹数据（使用真实订单数据）
router.get('/dispatcher/track', async (req, res) => {
  const { orderId } = req.query;
  const db = require('../config/db');
  
  try {
    let sql = `
      SELECT 
        o.id as orderId,
        o.order_no,
        o.sender_coord as fromCoord,
        o.receiver_coord as toCoord,
        o.sender_address,
        o.receiver_address,
        o.status,
        o.customer_name,
        v.car_no as vehicleNo,
        v.driver_name as driverName
      FROM orders o
      LEFT JOIN transport_tasks t ON o.id = t.order_id
      LEFT JOIN vehicles v ON t.vehicle_id = v.id
      WHERE o.sender_coord IS NOT NULL 
        AND o.receiver_coord IS NOT NULL
    `;
    let params = [];
    
    if (orderId) {
      sql += ' AND o.id = ?';
      params.push(orderId);
    }
    
    sql += ' ORDER BY o.create_time DESC';
    
    const [rows] = await db.query(sql, params);
    
    const tracks = rows.map(row => ({
      orderId: row.orderId,
      orderNo: row.order_no,
      fromCoord: row.fromCoord ? row.fromCoord.split(',').map(c => parseFloat(c.trim())) : null,
      toCoord: row.toCoord ? row.toCoord.split(',').map(c => parseFloat(c.trim())) : null,
      senderAddress: row.sender_address,
      receiverAddress: row.receiver_address,
      status: row.status,
      customerName: row.customer_name,
      vehicleNo: row.vehicleNo,
      driverName: row.driverName
    }));
    
    res.json({
      code: 200,
      msg: "success",
      data: { tracks }
    });
  } catch (err) {
    console.error('获取运输轨迹失败:', err);
    res.json({
      code: 500,
      msg: "获取运输轨迹失败",
      data: { tracks: [] }
    });
  }
});

// 导出路由（必须保留）
module.exports = router;