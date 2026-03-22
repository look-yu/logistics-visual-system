USE logistics_db;

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE inventory_logs;
TRUNCATE TABLE inventory_items;
TRUNCATE TABLE transport_tasks;
TRUNCATE TABLE vehicles;
TRUNCATE TABLE orders;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO users (username, password, real_name, role, status) VALUES 
('admin', '123456', '系统管理员', 'admin', 1),
('manager1', '123456', '王经理', 'manager', 1),
('dispatcher1', '123456', '李调度', 'dispatcher', 1),
('warehouse1', '123456', '张仓管', 'warehouse', 1);

INSERT INTO vehicles (car_no, car_type, load_capacity, status, driver_name, driver_phone) VALUES 
('沪A11111', '中型厢式车', 5.0, 'idle', '赵师傅', '13800138001'),
('沪A22222', '大型平板车', 10.0, 'busy', '钱师傅', '13800138002'),
('沪B33333', '冷链运输车', 3.0, 'idle', '孙师傅', '13800138003'),
('沪B44444', '小型面包车', 1.5, 'busy', '李师傅', '13800138004'),
('沪C55555', '重型集装箱', 20.0, 'idle', '周师傅', '13800138005'),
('沪C66666', '中型厢式车', 5.0, 'maintenance', '吴师傅', '13800138006');

INSERT INTO orders (order_no, customer_name, sender_address, receiver_address, goods_type, weight, amount, status, create_time) VALUES 
('ORD20260310001', '阿里巴巴', '杭州市', '上海市', '电子产品', 500.0, 5000.0, 'delivered', '2026-03-10 10:00:00'),
('ORD20260310002', '腾讯', '深圳市', '北京市', '服务器', 1200.0, 15000.0, 'delivered', '2026-03-10 14:00:00'),
('ORD20260311001', '京东', '北京市', '上海市', '日用品', 300.0, 2000.0, 'delivered', '2026-03-11 09:00:00'),
('ORD20260311002', '美团', '上海市', '南京市', '生鲜', 100.0, 1000.0, 'delivered', '2026-03-11 11:00:00'),
('ORD20260312001', '顺丰', '深圳市', '广州市', '快递', 50.0, 500.0, 'delivered', '2026-03-12 08:00:00'),
('ORD20260312002', '华为', '东莞市', '西安市', '通信设备', 2000.0, 25000.0, 'delivered', '2026-03-12 16:00:00'),
('ORD20260313001', '小米', '北京市', '武汉市', '手机', 200.0, 8000.0, 'delivered', '2026-03-13 10:30:00'),
('ORD20260314001', '拼多多', '上海市', '成都市', '百货', 800.0, 3500.0, 'delivered', '2026-03-14 13:20:00'),
('ORD20260315001', '网易', '广州市', '杭州市', '周边', 150.0, 1200.0, 'delivered', '2026-03-15 15:45:00'),
('ORD20260316001', '字节跳动', '北京市', '上海市', '办公用品', 120.0, 900.0, 'shipping', '2026-03-16 09:00:00'),
('ORD20260316002', '百度', '北京市', '大连市', '硬件', 600.0, 6000.0, 'assigned', '2026-03-16 11:30:00'),
('ORD20260316003', '小红书', '上海市', '杭州市', '化妆品', 40.0, 1500.0, 'pending', '2026-03-16 14:00:00');

INSERT INTO transport_tasks (task_no, order_id, vehicle_id, cost, status, start_time) VALUES 
('TASK20260316001', 10, 2, 800.0, 'in_transit', '2026-03-16 10:00:00'),
('TASK20260316002', 11, 4, 300.0, 'pending', NULL);

INSERT INTO inventory_items (goods_name, sku_code, warehouse_id, stock_qty, safe_stock, location_code) VALUES 
('生鲜蔬菜', 'SKU_VEG_001', 1, 30, 50, 'A-01-01'),
('冷冻肉类', 'SKU_MEAT_002', 1, 120, 100, 'A-02-01'),
('瓶装矿泉水', 'SKU_WAT_003', 1, 500, 200, 'B-01-05'),
('家用抽纸', 'SKU_PAP_004', 1, 80, 150, 'B-02-02'),
('办公笔记本', 'SKU_OFF_005', 1, 45, 20, 'C-01-10'),
('洗手液', 'SKU_CLN_006', 1, 15, 30, 'C-02-04');

INSERT INTO inventory_logs (goods_id, type, qty, operator_id, remark) VALUES 
(1, 'outbound', 20, 4, '超市配送'),
(2, 'inbound', 50, 4, '工厂入库'),
(3, 'outbound', 100, 4, '仓库调拨'),
(4, 'outbound', 30, 4, '线上订单'),
(6, 'outbound', 5, 4, '办公领用');
