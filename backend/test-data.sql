-- 1. 创建数据库（先执行）
CREATE DATABASE IF NOT EXISTS logistics_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 2. 使用数据库
USE logistics_db;

-- 3. 创建原有数据表格（保留不动）
CREATE TABLE IF NOT EXISTS logistics_data (
  id INT AUTO_INCREMENT PRIMARY KEY,
  role VARCHAR(20) NOT NULL COMMENT '角色：manager/dispatcher/warehouse',
  data JSON NOT NULL COMMENT '角色对应的可视化数据',
  create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. 插入原有测试数据（保留不动）
INSERT INTO logistics_data (role, data) VALUES 
('manager', '{
  "total_order": 2150,
  "finished_order": 2080,
  "exception_order": 70,
  "avg_delivery_time": 8.2,
  "trend_data": {"xAxis":["1月","2月","3月","4月"],"series":[1200,1580,1820,2150]},
  "pie_data": {"xAxis":["生鲜配送","标品配送","大件配送","耗材配送"],"series":[650,980,320,200]}
}'),
('dispatcher', '{
  "today_transport": 357,
  "unfinished_transport": 28,
  "avg_transport_time": 4.5,
  "trend_data": {"xAxis":["早班(6-12)","中班(12-18)","晚班(18-24)"],"series":[85,162,110]}
}'),
('warehouse', '{
  "total_stock": 835,
  "pending_out_stock": 120,
  "warning_stock": 15,
  "stock_turnover": 85,
  "pie_data": {"xAxis":["库位A(生鲜)","库位B(标品)","库位C(大件)","库位D(耗材)"],"series":[210,350,180,95]}
}')
ON DUPLICATE KEY UPDATE data = VALUES(data);

-- ===================== 新增可视化看板所需表（核心） =====================
-- 5. 仓库基础信息表（支撑区域库存占比、数据概况）
CREATE TABLE IF NOT EXISTS warehouse (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '仓库ID',
  warehouse_code VARCHAR(20) NOT NULL COMMENT '仓库编码',
  warehouse_name VARCHAR(50) NOT NULL COMMENT '仓库名称',
  area_code ENUM('A','B','C','D') NOT NULL COMMENT '区域编码',
  total_area DECIMAL(10,2) NOT NULL COMMENT '总面积(㎡)',
  total_pallet INT NOT NULL COMMENT '总托盘数',
  is_delete TINYINT DEFAULT 0 COMMENT '软删除：0-未删 1-已删',
  create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_warehouse_code (warehouse_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='仓库及区域信息表';

-- 6. 设备类型表（支撑设备渗透率模块）
CREATE TABLE IF NOT EXISTS device_type (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '设备类型ID',
  type_code VARCHAR(20) NOT NULL COMMENT '类型编码：storage/handling/sorting/robot/transport',
  type_name VARCHAR(30) NOT NULL COMMENT '类型名称：存储设备/搬运设备/分拣设备/物流机器人/物流运输',
  penetration_rate DECIMAL(5,2) NOT NULL COMMENT '渗透率(%)',
  create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_type_code (type_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='设备类型与渗透率表';

-- 7. 实时库存表（支撑实时数据、数据概况模块）
CREATE TABLE IF NOT EXISTS inventory (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '库存ID',
  warehouse_id INT NOT NULL COMMENT '关联仓库ID',
  real_stock INT NOT NULL COMMENT '实存量',
  in_stock INT NOT NULL COMMENT '入库量',
  out_stock INT NOT NULL COMMENT '出库量',
  car_arrive INT NOT NULL COMMENT '到车数',
  total_stock BIGINT NOT NULL COMMENT '总库存量',
  total_in_stock BIGINT NOT NULL COMMENT '总入库量',
  total_out_stock BIGINT NOT NULL COMMENT '总出库量',
  avg_turnover_days DECIMAL(5,1) NOT NULL COMMENT '平均周转天数',
  stat_time DATETIME NOT NULL COMMENT '统计时间',
  create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_warehouse_id (warehouse_id),
  KEY idx_stat_time (stat_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='实时库存与概况数据表';

-- 8. 库存分布表（支撑库存天数分布模块）
CREATE TABLE IF NOT EXISTS inventory_distribution (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '分布ID',
  warehouse_id INT NOT NULL COMMENT '关联仓库ID',
  day_range VARCHAR(20) NOT NULL COMMENT '天数区间：<30天/30-60天/60-180天/180-360天/>360天',
  proportion DECIMAL(5,2) NOT NULL COMMENT '占比(%)',
  stat_time DATETIME NOT NULL COMMENT '统计时间',
  create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_warehouse_id (warehouse_id),
  KEY idx_stat_time (stat_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='库存天数分布表';

-- 9. 库存月度走势表（支撑本年度库存走势模块）
CREATE TABLE IF NOT EXISTS inventory_monthly_trend (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '走势ID',
  warehouse_id INT NOT NULL COMMENT '关联仓库ID',
  month TINYINT NOT NULL COMMENT '月份(1-12)',
  in_stock DECIMAL(10,2) NOT NULL COMMENT '入库量(万吨)',
  out_stock DECIMAL(10,2) NOT NULL COMMENT '出库量(万吨)',
  stock DECIMAL(10,2) NOT NULL COMMENT '库存量(万吨)',
  year YEAR NOT NULL COMMENT '年份',
  create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_warehouse_month_year (warehouse_id, month, year),
  KEY idx_month (month)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='库存月度走势表';

-- 10. 仓库使用趋势表（支撑仓库使用趋势模块）
CREATE TABLE IF NOT EXISTS warehouse_usage_trend (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '趋势ID',
  warehouse_id INT NOT NULL COMMENT '关联仓库ID',
  month TINYINT NOT NULL COMMENT '月份(1-12)',
  turnover_days DECIMAL(5,1) NOT NULL COMMENT '库存周转天数',
  turnover_rate DECIMAL(5,2) NOT NULL COMMENT '仓库周转率(%)',
  usage_rate DECIMAL(5,2) NOT NULL COMMENT '仓库使用率(%)',
  year YEAR NOT NULL COMMENT '年份',
  create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_warehouse_month_year (warehouse_id, month, year),
  KEY idx_month (month)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='仓库使用趋势表';

-- 11. 设备表（支撑库存设备状态模块）
CREATE TABLE IF NOT EXISTS device (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '设备ID',
  device_type_id INT NOT NULL COMMENT '关联设备类型ID',
  device_model VARCHAR(30) NOT NULL COMMENT '设备型号',
  status ENUM('online','offline','exception') NOT NULL COMMENT '状态：在线/离线/异常',
  total_num INT NOT NULL COMMENT '总设备数',
  online_num INT NOT NULL COMMENT '在线数',
  offline_num INT NOT NULL COMMENT '离线数',
  exception_num INT NOT NULL COMMENT '异常数',
  is_delete TINYINT DEFAULT 0 COMMENT '软删除：0-未删 1-已删',
  create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_device_type_id (device_type_id),
  KEY idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='设备与状态统计表';

-- 12. 设备报警表（支撑设备报警列表模块）
CREATE TABLE IF NOT EXISTS device_alarm (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '报警ID',
  device_id INT NOT NULL COMMENT '关联设备ID',
  alarm_content VARCHAR(100) NOT NULL COMMENT '报警内容',
  alarm_time DATETIME NOT NULL COMMENT '报警时间',
  power_status VARCHAR(20) NOT NULL COMMENT '电量状态：满电/正常/低电/没电',
  process_status ENUM('unhandled','handled') DEFAULT 'unhandled' COMMENT '处理状态：未处理/已处理',
  create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_device_id (device_id),
  KEY idx_alarm_time (alarm_time),
  KEY idx_process_status (process_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='设备报警记录表';

-- ===================== 插入可视化看板测试数据（贴合图片指标） =====================
-- 13. 插入仓库数据
INSERT INTO warehouse (warehouse_code, warehouse_name, area_code, total_area, total_pallet) VALUES
('WH001', '主仓库', 'A', 4832.00, 444332),
('WH001-A', '主仓库A区', 'A', 2416.00, 222166),
('WH001-B', '主仓库B区', 'B', 1208.00, 111083),
('WH001-C', '主仓库C区', 'C', 724.80, 66650),
('WH001-D', '主仓库D区', 'D', 483.20, 44433);

-- 14. 插入设备类型与渗透率（贴合图片）
INSERT INTO device_type (type_code, type_name, penetration_rate) VALUES
('storage', '存储设备', 60.00),
('handling', '搬运设备', 50.00),
('sorting', '分拣设备', 40.00),
('robot', '物流机器人', 30.00),
('transport', '物流运输', 20.00);

-- 15. 插入实时库存数据（贴合图片：实存量5061、入库2101、出库4031、到车5101）
INSERT INTO inventory (warehouse_id, real_stock, in_stock, out_stock, car_arrive, total_stock, total_in_stock, total_out_stock, avg_turnover_days, stat_time) VALUES
(1, 5061, 2101, 4031, 5101, 234444332, 120000000, 98000000, 30.0, NOW());

-- 16. 插入库存分布数据（贴合图片占比）
INSERT INTO inventory_distribution (warehouse_id, day_range, proportion, stat_time) VALUES
(1, '<30天', 95.13, NOW()),
(1, '30-60天', 1.38, NOW()),
(1, '60-180天', 0.11, NOW()),
(1, '180-360天', 0.30, NOW()),
(1, '>360天', 3.08, NOW());

-- 17. 插入2026年库存月度走势（贴合图片趋势）
INSERT INTO inventory_monthly_trend (warehouse_id, month, in_stock, out_stock, stock, year) VALUES
(1, 1, 5.2, 4.8, 10.5, 2026),
(1, 2, 5.5, 5.1, 10.9, 2026),
(1, 3, 5.8, 5.3, 11.4, 2026),
(1, 4, 6.1, 5.6, 11.9, 2026),
(1, 5, 6.3, 5.8, 12.4, 2026),
(1, 6, 6.5, 6.0, 12.9, 2026),
(1, 7, 6.7, 6.2, 13.4, 2026),
(1, 8, 6.9, 6.4, 13.9, 2026),
(1, 9, 7.1, 6.6, 14.4, 2026),
(1, 10, 7.3, 6.8, 14.9, 2026),
(1, 11, 7.5, 7.0, 15.4, 2026),
(1, 12, 7.7, 7.2, 15.9, 2026);

-- 18. 插入2026年仓库使用趋势
INSERT INTO warehouse_usage_trend (warehouse_id, month, turnover_days, turnover_rate, usage_rate, year) VALUES
(1, 1, 28.5, 85.00, 80.00, 2026),
(1, 2, 29.0, 84.50, 81.00, 2026),
(1, 3, 29.5, 84.00, 82.00, 2026),
(1, 4, 30.0, 83.50, 83.00, 2026),
(1, 5, 30.5, 83.00, 84.00, 2026),
(1, 6, 31.0, 82.50, 85.00, 2026),
(1, 7, 31.5, 82.00, 86.00, 2026),
(1, 8, 32.0, 81.50, 87.00, 2026),
(1, 9, 32.5, 81.00, 88.00, 2026),
(1, 10, 33.0, 80.50, 89.00, 2026),
(1, 11, 33.5, 80.00, 90.00, 2026),
(1, 12, 34.0, 79.50, 91.00, 2026);

-- 19. 插入设备状态数据（贴合图片：总88、在线58、离线20、异常10）
INSERT INTO device (device_type_id, device_model, status, total_num, online_num, offline_num, exception_num) VALUES
(1, '货架-重型', 'online', 88, 58, 20, 10);

-- 20. 插入设备报警示例数据
INSERT INTO device_alarm (device_id, alarm_content, alarm_time, power_status, process_status) VALUES
(1, '电量低于20%，请及时充电', '2026-02-22 08:30:00', '低电', 'unhandled'),
(1, '设备传感器异常，无法定位', '2026-02-22 09:15:00', '正常', 'unhandled'),
(1, '设备运行温度过高', '2026-02-22 10:20:00', '正常', 'handled');

-- ===================== 查询验证（可选） =====================
-- 验证原有表
SELECT * FROM logistics_data;
-- 验证新增仓库表
SELECT * FROM warehouse;
-- 验证实时库存
SELECT * FROM inventory;
-- 验证设备报警
SELECT * FROM device_alarm;