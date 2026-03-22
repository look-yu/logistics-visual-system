-- 物流可视化系统数据库创建脚本
-- 数据库名：logistics_db
-- 字符集：utf8mb4

-- 创建数据库
CREATE DATABASE IF NOT EXISTS logistics_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE logistics_db;

-- ===================== 1. 用户表 =====================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'manager', 'dispatcher', 'warehouse') NOT NULL DEFAULT 'manager',
  real_name VARCHAR(100),
  phone VARCHAR(20),
  email VARCHAR(100),
  status TINYINT DEFAULT 1 COMMENT '状态：1-正常，0-禁用',
  create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_username (username),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 插入默认用户数据
INSERT INTO users (username, password, role, real_name, phone, email) VALUES
('admin', '123456', 'admin', '系统管理员', '13800138000', 'admin@logistics.com'),
('manager', '123456', 'manager', '全局管理员', '13800138001', 'manager@logistics.com'),
('dispatcher', '123456', 'dispatcher', '调度员', '13800138002', 'dispatcher@logistics.com'),
('warehouse', '123456', 'warehouse', '仓储员', '13800138003', 'warehouse@logistics.com')
ON DUPLICATE KEY UPDATE id=id;

-- ===================== 2. 订单表 =====================
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_no VARCHAR(50) NOT NULL UNIQUE COMMENT '订单号',
  customer_name VARCHAR(100) NOT NULL COMMENT '客户名称',
  sender_address VARCHAR(255) NOT NULL COMMENT '发货地址',
  receiver_address VARCHAR(255) NOT NULL COMMENT '收货地址',
  sender_coord VARCHAR(50) COMMENT '发货坐标',
  receiver_coord VARCHAR(50) COMMENT '收货坐标',
  goods_type VARCHAR(50) COMMENT '商品类型',
  weight DECIMAL(10,2) COMMENT '重量(吨)',
  volume DECIMAL(10,2) COMMENT '体积(立方米)',
  amount DECIMAL(10,2) COMMENT '订单金额',
  status ENUM('pending', 'assigned', 'shipping', 'delivered', 'exception', 'cancelled') DEFAULT 'pending' COMMENT '订单状态',
  exception_reason VARCHAR(255) COMMENT '异常原因',
  create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_order_no (order_no),
  INDEX idx_status (status),
  INDEX idx_create_time (create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单表';

-- 插入测试订单数据
INSERT INTO orders (order_no, customer_name, sender_address, receiver_address, goods_type, weight, amount, status) VALUES
('ORD20260317001', '阿里巴巴', '杭州市余杭区', '上海市浦东新区', '电子产品', 2.0, 1500.00, 'pending'),
('ORD20260317002', '腾讯', '深圳市南山区', '北京市朝阳区', '生鲜', 1.5, 3200.00, 'shipping'),
('ORD20260317003', '京东', '北京市大兴区', '广州市天河区', '日用品', 5.0, 4500.00, 'delivered'),
('ORD20260317004', '字节跳动', '上海市闵行区', '深圳市南山区', '电子产品', 3.0, 2800.00, 'pending'),
('ORD20260317005', '美团', '广州市天河区', '杭州市西湖区', '生鲜', 2.5, 1800.00, 'shipping'),
('ORD20260317006', '顺丰速运', '深圳市福田区', '北京市海淀区', '大件', 8.0, 5500.00, 'delivered'),
('ORD20260317007', '华为技术', '南京市鼓楼区', '成都市武侯区', '电子产品', 1.8, 2200.00, 'pending'),
('ORD20260317008', '小米科技', '北京市朝阳区', '上海市浦东新区', '电子产品', 2.2, 1900.00, 'assigned'),
('ORD20260317009', '网易', '广州市越秀区', '武汉市江汉区', '日用品', 4.5, 3200.00, 'delivered'),
('ORD20260317010', '拼多多', '杭州市西湖区', '深圳市南山区', '生鲜', 3.5, 2500.00, 'pending'),
('ORD20260317011', '滴滴出行', '北京市大兴区', '广州市天河区', '电子产品', 2.0, 2100.00, 'shipping'),
('ORD20260317012', '快手', '上海市浦东新区', '杭州市西湖区', '日用品', 5.5, 4800.00, 'delivered'),
('ORD20260317013', '哔哩哔哩', '深圳市南山区', '北京市朝阳区', '电子产品', 1.5, 1600.00, 'pending')
ON DUPLICATE KEY UPDATE id=id;

-- ===================== 3. 车辆表 =====================
CREATE TABLE IF NOT EXISTS vehicles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  car_no VARCHAR(20) NOT NULL UNIQUE COMMENT '车牌号',
  driver_name VARCHAR(50) NOT NULL COMMENT '司机姓名',
  driver_phone VARCHAR(20) COMMENT '司机电话',
  status ENUM('idle', 'busy', 'maintenance') DEFAULT 'idle' COMMENT '车辆状态',
  current_area VARCHAR(100) COMMENT '当前位置',
  load_capacity DECIMAL(10,2) COMMENT '载重(吨)',
  current_order_id INT COMMENT '当前订单ID',
  create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_car_no (car_no),
  INDEX idx_status (status),
  INDEX idx_current_order (current_order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='车辆表';

-- 插入测试车辆数据
INSERT INTO vehicles (car_no, driver_name, driver_phone, status, current_area, load_capacity) VALUES
('京A12345', '张三', '13800138000', 'idle', '朝阳区', 5.0),
('京B67890', '李四', '13900139000', 'busy', '海淀区', 8.0),
('京C24680', '王五', '13700138001', 'idle', '丰台区', 6.0),
('沪A12345', '赵六', '13600138002', 'maintenance', '浦东新区', 10.0),
('沪B67890', '钱七', '13500139001', 'idle', '闵行区', 12.0),
('粤A12345', '孙八', '13400138003', 'busy', '南山区', 5.0)
ON DUPLICATE KEY UPDATE id=id;

-- ===================== 4. 库存商品表 =====================
CREATE TABLE IF NOT EXISTS inventory_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  goods_name VARCHAR(100) NOT NULL COMMENT '商品名称',
  goods_code VARCHAR(50) UNIQUE COMMENT '商品编码',
  stock_qty INT DEFAULT 0 COMMENT '库存数量',
  safe_stock INT DEFAULT 0 COMMENT '安全库存',
  unit VARCHAR(20) COMMENT '单位',
  category VARCHAR(50) COMMENT '商品分类',
  price DECIMAL(10,2) COMMENT '单价',
  supplier VARCHAR(100) COMMENT '供应商',
  create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_goods_code (goods_code),
  INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='库存商品表';

-- 插入测试库存数据
INSERT INTO inventory_items (goods_name, goods_code, stock_qty, safe_stock, unit, category, price, supplier) VALUES
('进口厘子', 'GOODS001', 120, 100, '箱', '生鲜', 50.00, '浙江水果批发市场'),
('高端笔记本', 'GOODS002', 80, 50, '台', '电子产品', 3500.00, '联想集团'),
('生鲜蔬菜', 'GOODS003', 45, 50, '箱', '生鲜', 30.00, '山东蔬菜基地'),
('耗材纸箱', 'GOODS004', 12, 20, '个', '耗材', 5.00, '包装材料厂'),
('冷链设备', 'GOODS005', 8, 10, '台', '设备', 12000.00, '冷链设备公司'),
('日用品套装', 'GOODS006', 200, 150, '套', '日用品', 80.00, '日用品批发商'),
('电子产品配件', 'GOODS007', 150, 100, '件', '电子产品', 25.00, '电子配件厂'),
('大件家具', 'GOODS008', 30, 20, '件', '大件', 500.00, '家具制造厂'),
('包装材料', 'GOODS009', 500, 300, '卷', '耗材', 15.00, '包装材料厂')
ON DUPLICATE KEY UPDATE id=id;

-- ===================== 5. 库存操作记录表 =====================
CREATE TABLE IF NOT EXISTS inventory_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  operation_type ENUM('inbound', 'outbound') NOT NULL COMMENT '操作类型：inbound-入库，outbound-出库',
  goods_name VARCHAR(100) NOT NULL COMMENT '商品名称',
  quantity INT NOT NULL COMMENT '数量',
  operator VARCHAR(50) COMMENT '操作人',
  remark VARCHAR(255) COMMENT '备注',
  operation_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
  INDEX idx_operation_time (operation_time),
  INDEX idx_goods_name (goods_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='库存操作记录表';

-- 插入测试库存记录
INSERT INTO inventory_logs (operation_type, goods_name, quantity, operator, remark) VALUES
('inbound', '进口厘子', 50, '管理员', '新到货'),
('outbound', '高端笔记本', 30, '配货员', '订单出库'),
('inbound', '生鲜蔬菜', 100, '管理员', '补货'),
('outbound', '耗材纸箱', 200, '配货员', '包装使用'),
('inbound', '日用品套装', 50, '管理员', '批量入库')
ON DUPLICATE KEY UPDATE id=id;

-- ===================== 6. 运输任务表 =====================
CREATE TABLE IF NOT EXISTS transport_tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  task_no VARCHAR(50) NOT NULL UNIQUE COMMENT '任务编号',
  order_id INT NOT NULL COMMENT '订单ID',
  vehicle_id INT NOT NULL COMMENT '车辆ID',
  driver_name VARCHAR(50) COMMENT '司机姓名',
  status ENUM('pending', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending' COMMENT '任务状态',
  start_time TIMESTAMP NULL COMMENT '开始时间',
  end_time TIMESTAMP NULL COMMENT '结束时间',
  create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX idx_task_no (task_no),
  INDEX idx_order_id (order_id),
  INDEX idx_vehicle_id (vehicle_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='运输任务表';

-- 插入测试运输任务
INSERT INTO transport_tasks (task_no, order_id, vehicle_id, driver_name, status) VALUES
('TASK20260317001', 1, 1, '张三', 'completed'),
('TASK20260317002', 2, 2, '李四', 'in_progress'),
('TASK20260317003', 3, 3, '王五', 'pending')
ON DUPLICATE KEY UPDATE id=id;

-- ===================== 7. 运输轨迹表 =====================
CREATE TABLE IF NOT EXISTS transport_track (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL COMMENT '订单ID',
  track_no VARCHAR(50) NOT NULL COMMENT '轨迹编号',
  current_location VARCHAR(255) COMMENT '当前位置',
  progress INT DEFAULT 0 COMMENT '进度(0-100)',
  create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX idx_order_id (order_id),
  INDEX idx_track_no (track_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='运输轨迹表';

-- 插入测试轨迹数据
INSERT INTO transport_track (order_id, track_no, current_location, progress) VALUES
(1, 'TRACK001', '杭州市余杭区', 100),
(2, 'TRACK002', '上海市浦东新区', 100),
(3, 'TRACK003', '深圳市南山区', 100)
ON DUPLICATE KEY UPDATE id=id;

-- ===================== 8. 轨迹点表 =====================
CREATE TABLE IF NOT EXISTS track_point (
  id INT AUTO_INCREMENT PRIMARY KEY,
  track_id INT NOT NULL COMMENT '轨迹ID',
  point_type VARCHAR(20) COMMENT '点类型：start-起点，waypoint-途经点，end-终点',
  location VARCHAR(255) COMMENT '位置',
  coord VARCHAR(50) COMMENT '坐标',
  arrive_time TIMESTAMP NULL COMMENT '到达时间',
  INDEX idx_track_id (track_id),
  INDEX idx_point_type (point_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='轨迹点表';

-- 插入测试轨迹点
INSERT INTO track_point (track_id, point_type, location, coord, arrive_time) VALUES
(1, 'start', '杭州市余杭区', '120.19,30.26', '2026-03-17 08:00:00'),
(1, 'waypoint', '上海市', '121.47,31.23', '2026-03-17 12:00:00'),
(1, 'end', '上海市浦东新区', '121.50,31.22', '2026-03-17 18:00:00'),
(2, 'start', '深圳市南山区', '114.07,22.62', '2026-03-17 09:00:00'),
(2, 'waypoint', '广州市', '113.23,23.16', '2026-03-17 14:00:00'),
(2, 'end', '广州市天河区', '113.32,23.13', '2026-03-17 17:00:00'),
(3, 'start', '北京市大兴区', '116.40,39.90', '2026-03-17 10:00:00'),
(3, 'waypoint', '天津市', '117.20,39.12', '2026-03-17 15:00:00'),
(3, 'end', '广州市天河区', '113.26,23.13', '2026-03-17 20:00:00')
ON DUPLICATE KEY UPDATE id=id;

-- ===================== 9. 轨迹详情表 =====================
CREATE TABLE IF NOT EXISTS track_detail (
  id INT AUTO_INCREMENT PRIMARY KEY,
  track_id INT NOT NULL COMMENT '轨迹ID',
  point_id INT NOT NULL COMMENT '轨迹点ID',
  distance DECIMAL(10,2) COMMENT '距离(公里)',
  duration INT COMMENT '耗时(分钟)',
  speed DECIMAL(10,2) COMMENT '速度(公里/小时)',
  remark VARCHAR(255) COMMENT '备注',
  create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX idx_track_id (track_id),
  INDEX idx_point_id (point_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='轨迹详情表';

-- 插入测试轨迹详情
INSERT INTO track_detail (track_id, point_id, distance, duration, speed, remark) VALUES
(1, 2, 150.5, 240, 37.6, '正常行驶'),
(1, 3, 18.2, 360, 3.0, '市区拥堵'),
(2, 2, 120.8, 300, 24.2, '高速行驶'),
(2, 3, 95.6, 180, 31.9, '正常行驶'),
(3, 2, 80.5, 180, 26.8, '正常行驶'),
(3, 3, 110.3, 300, 22.1, '市区行驶')
ON DUPLICATE KEY UPDATE id=id;

-- ===================== 10. 运单主表 =====================
CREATE TABLE IF NOT EXISTS waybill_main (
  id INT AUTO_INCREMENT PRIMARY KEY,
  waybill_no VARCHAR(50) NOT NULL UNIQUE COMMENT '运单号',
  order_id INT NOT NULL COMMENT '订单ID',
  vehicle_id INT COMMENT '车辆ID',
  shipper VARCHAR(100) COMMENT '发货人',
  consignee VARCHAR(100) COMMENT '收货人',
  goods_info TEXT COMMENT '货物信息',
  freight DECIMAL(10,2) COMMENT '运费',
  status ENUM('pending', 'picked', 'shipped', 'signed', 'cancelled') DEFAULT 'pending' COMMENT '运单状态',
  create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_waybill_no (waybill_no),
  INDEX idx_order_id (order_id),
  INDEX idx_vehicle_id (vehicle_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='运单主表';

-- 插入测试运单数据
INSERT INTO waybill_main (waybill_no, order_id, vehicle_id, shipper, consignee, goods_info, freight, status) VALUES
('WB20260317001', 1, 1, '阿里巴巴', '张三', '电子产品一批', 500.00, 'signed'),
('WB20260317002', 2, 2, '腾讯', '李四', '生鲜冷链', 800.00, 'shipped'),
('WB20260317003', 3, 3, '京东', '王五', '日用品套装', 1200.00, 'pending')
ON DUPLICATE KEY UPDATE id=id;

-- ===================== 11. 商品库存表 =====================
CREATE TABLE IF NOT EXISTS goods_stock (
  id INT AUTO_INCREMENT PRIMARY KEY,
  goods_id INT NOT NULL COMMENT '商品ID',
  warehouse_id INT COMMENT '仓库ID',
  stock_qty INT DEFAULT 0 COMMENT '库存数量',
  frozen_stock INT DEFAULT 0 COMMENT '冻结库存',
  available_stock INT DEFAULT 0 COMMENT '可用库存',
  update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_goods_id (goods_id),
  INDEX idx_warehouse_id (warehouse_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商品库存表';

-- 插入测试商品库存
INSERT INTO goods_stock (goods_id, warehouse_id, stock_qty, frozen_stock, available_stock) VALUES
(1, 1, 100, 0, 100),
(2, 1, 80, 0, 80),
(3, 1, 45, 0, 45),
(4, 1, 12, 0, 12),
(5, 1, 8, 0, 8)
ON DUPLICATE KEY UPDATE id=id;

-- ===================== 12. 出入库记录表 =====================
CREATE TABLE IF NOT EXISTS in_out_record (
  id INT AUTO_INCREMENT PRIMARY KEY,
  record_no VARCHAR(50) NOT NULL UNIQUE COMMENT '记录编号',
  goods_id INT NOT NULL COMMENT '商品ID',
  record_type ENUM('inbound', 'outbound') NOT NULL COMMENT '记录类型：inbound-入库，outbound-出库',
  quantity INT NOT NULL COMMENT '数量',
  operator VARCHAR(50) COMMENT '操作人',
  remark VARCHAR(255) COMMENT '备注',
  create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX idx_record_no (record_no),
  INDEX idx_goods_id (goods_id),
  INDEX idx_record_type (record_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='出入库记录表';

-- 插入测试出入库记录
INSERT INTO in_out_record (record_no, goods_id, record_type, quantity, operator, remark) VALUES
('REC20260317001', 1, 'inbound', 50, '管理员', '新到货'),
('REC20260317002', 2, 'outbound', 30, '配货员', '订单出库'),
('REC20260317003', 3, 'inbound', 100, '管理员', '批量补货'),
('REC20260317004', 4, 'outbound', 200, '配货员', '包装使用'),
('REC20260317005', 5, 'inbound', 50, '管理员', '新到货')
ON DUPLICATE KEY UPDATE id=id;

-- ===================== 数据统计视图 =====================
-- 订单统计视图
CREATE OR REPLACE VIEW v_order_stats AS
SELECT 
  DATE(create_time) as date,
  COUNT(*) as count,
  COALESCE(SUM(amount), 0) as total_amount
FROM orders
GROUP BY DATE(create_time);

-- 库存统计视图
CREATE OR REPLACE VIEW v_inventory_stats AS
SELECT 
  category,
  SUM(stock_qty) as total_stock,
  SUM(CASE WHEN stock_qty < safe_stock THEN 1 ELSE 0 END) as warning_count
FROM inventory_items
GROUP BY category;

-- 车辆统计视图
CREATE OR REPLACE VIEW v_vehicle_stats AS
SELECT 
  status,
  COUNT(*) as count
FROM vehicles
GROUP BY status;

-- ===================== 完成 =====================
SELECT '数据库创建完成！' as message;
SELECT COUNT(*) as total_tables FROM information_schema.tables WHERE table_schema = 'logistics_db';