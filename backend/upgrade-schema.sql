-- 物流系统功能增强 - 数据库扩展脚本 (无BOM UTF8)
USE logistics_db;

-- 1. 用户管理模块
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  real_name VARCHAR(50),
  role ENUM('admin', 'manager', 'dispatcher', 'warehouse') DEFAULT 'manager',
  status TINYINT DEFAULT 1,
  phone VARCHAR(20),
  email VARCHAR(100),
  avatar VARCHAR(255),
  last_login TIMESTAMP NULL,
  create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. 订单管理模块
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_no VARCHAR(50) NOT NULL UNIQUE,
  customer_name VARCHAR(100) NOT NULL,
  sender_address VARCHAR(255) NOT NULL,
  receiver_address VARCHAR(255) NOT NULL,
  goods_type VARCHAR(50),
  weight DECIMAL(10,2),
  volume DECIMAL(10,2),
  status ENUM('pending', 'assigned', 'shipping', 'delivered', 'exception', 'cancelled') DEFAULT 'pending',
  amount DECIMAL(10,2),
  exception_reason VARCHAR(255),
  create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. 车辆与运输管理
CREATE TABLE IF NOT EXISTS vehicles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  car_no VARCHAR(20) NOT NULL UNIQUE,
  car_type VARCHAR(50),
  load_capacity DECIMAL(10,2),
  status ENUM('idle', 'busy', 'maintenance', 'offline') DEFAULT 'idle',
  driver_name VARCHAR(50),
  driver_phone VARCHAR(20),
  current_location VARCHAR(255),
  create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS transport_tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  task_no VARCHAR(50) NOT NULL UNIQUE,
  order_id INT NOT NULL,
  vehicle_id INT NOT NULL,
  route_plan JSON,
  start_time DATETIME,
  end_time DATETIME,
  cost DECIMAL(10,2) DEFAULT 0,
  status ENUM('pending', 'in_transit', 'completed', 'failed') DEFAULT 'pending',
  create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. 仓储管理模块增强
CREATE TABLE IF NOT EXISTS inventory_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  goods_name VARCHAR(100) NOT NULL,
  sku_code VARCHAR(50) UNIQUE,
  warehouse_id INT NOT NULL,
  stock_qty INT DEFAULT 0,
  safe_stock INT DEFAULT 100,
  unit VARCHAR(20) DEFAULT '件',
  location_code VARCHAR(50),
  create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS inventory_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  goods_id INT NOT NULL,
  type ENUM('inbound', 'outbound', 'adjustment') NOT NULL,
  qty INT NOT NULL,
  operator_id INT,
  remark VARCHAR(255),
  create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (goods_id) REFERENCES inventory_items(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
