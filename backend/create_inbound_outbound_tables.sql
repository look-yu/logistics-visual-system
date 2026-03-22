CREATE TABLE IF NOT EXISTS inbound_outbound_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  record_no VARCHAR(50) UNIQUE NOT NULL,
  record_type ENUM('inbound', 'outbound') NOT NULL,
  order_no VARCHAR(50),
  goods_name VARCHAR(200) NOT NULL,
  goods_type VARCHAR(50),
  quantity DECIMAL(10, 2) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  weight DECIMAL(10, 2),
  volume DECIMAL(10, 2),
  warehouse_name VARCHAR(100),
  warehouse_location VARCHAR(200),
  operator VARCHAR(50),
  vehicle_no VARCHAR(50),
  driver_name VARCHAR(50),
  status ENUM('pending', 'processing', 'completed', 'cancelled') DEFAULT 'pending',
  remark TEXT,
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_record_no (record_no),
  INDEX idx_record_type (record_type),
  INDEX idx_order_no (order_no),
  INDEX idx_status (status),
  INDEX idx_create_time (create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS transport_queue (
  id INT AUTO_INCREMENT PRIMARY KEY,
  queue_no VARCHAR(50) UNIQUE NOT NULL,
  order_no VARCHAR(50) NOT NULL,
  priority ENUM('high', 'normal', 'low') DEFAULT 'normal',
  status ENUM('waiting', 'assigned', 'in_transit', 'completed', 'cancelled') DEFAULT 'waiting',
  goods_name VARCHAR(200),
  goods_type VARCHAR(50),
  quantity DECIMAL(10, 2),
  weight DECIMAL(10, 2),
  volume DECIMAL(10, 2),
  sender_address VARCHAR(200),
  receiver_address VARCHAR(200),
  driver_id INT,
  driver_name VARCHAR(50),
  vehicle_no VARCHAR(50),
  estimated_arrival_time DATETIME,
  actual_arrival_time DATETIME,
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_queue_no (queue_no),
  INDEX idx_order_no (order_no),
  INDEX idx_status (status),
  INDEX idx_priority (priority),
  INDEX idx_create_time (create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO inbound_outbound_records (record_no, record_type, order_no, goods_name, goods_type, quantity, unit, weight, volume, warehouse_name, warehouse_location, operator, vehicle_no, driver_name, status, remark) VALUES
('IN202501001', 'inbound', 'ORD202501001', '电子产品', '电子产品', 100.00, '件', 50.00, 2.50, '北京仓库', '北京市朝阳区', '张三', '京A12345', '李四', 'completed', '正常入库'),
('IN202501002', 'inbound', 'ORD202501002', '生鲜食品', '生鲜食品', 200.00, '箱', 30.00, 1.80, '上海仓库', '上海市浦东新区', '王五', '沪B67890', '赵六', 'processing', '冷链入库'),
('OUT202501001', 'outbound', 'ORD202501003', '普通货物', '普通货物', 150.00, '件', 75.00, 3.00, '广州仓库', '广州市天河区', '李七', '粤C11111', '周八', 'completed', '正常出库'),
('OUT202501002', 'outbound', 'ORD202501004', '危险品', '危险品', 50.00, '桶', 25.00, 1.20, '深圳仓库', '深圳市南山区', '吴九', '粤D22222', '郑十', 'pending', '危险品出库');

INSERT INTO transport_queue (queue_no, order_no, priority, status, goods_name, goods_type, quantity, weight, volume, sender_address, receiver_address, driver_id, driver_name, vehicle_no, estimated_arrival_time) VALUES
('Q202501001', 'ORD202501005', 'high', 'waiting', '贵重物品', '贵重物品', 10.00, 5.00, 0.30, '北京市海淀区', '上海市黄浦区', 1, '李四', '京A12345', DATE_ADD(NOW(), INTERVAL 2 DAY)),
('Q202501002', 'ORD202501006', 'normal', 'assigned', '大件货物', '大件货物', 5.00, 500.00, 10.00, '广州市白云区', '深圳市福田区', 2, '赵六', '沪B67890', DATE_ADD(NOW(), INTERVAL 3 DAY)),
('Q202501003', 'ORD202501007', 'low', 'in_transit', '普通货物', '普通货物', 100.00, 80.00, 4.00, '成都市武侯区', '重庆市渝中区', 3, '周八', '粤C11111', DATE_ADD(NOW(), INTERVAL 1 DAY));
