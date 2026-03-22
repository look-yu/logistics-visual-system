-- ========================================
-- 数据库表结构导出
-- 数据库：logistics_db
-- 导出时间：2026/3/19 19:48:22
-- ========================================

DROP DATABASE IF EXISTS logistics_db;
CREATE DATABASE IF NOT EXISTS logistics_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE logistics_db;

-- ========================================
-- 表名：goods_stock
-- ========================================
CREATE TABLE `goods_stock` (
  `id` int NOT NULL AUTO_INCREMENT,
  `goods_name` varchar(50) NOT NULL COMMENT '商品名称',
  `safe_stock` int NOT NULL COMMENT '安全库存',
  `current_stock` int NOT NULL COMMENT '当前库存',
  `status` varchar(10) DEFAULT '正常' COMMENT '状态：正常/预警/补货中',
  `warehouse_loc` varchar(20) NOT NULL COMMENT '库位（库位A/B/C/D）',
  `is_delete` tinyint DEFAULT '0' COMMENT '软删除',
  `create_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 字段信息：
--   id | int | NO | PRI | null
--   goods_name | varchar(50) | NO |  | null
--   safe_stock | int | NO |  | null
--   current_stock | int | NO |  | null
--   status | varchar(10) | YES |  | 正常
--   warehouse_loc | varchar(20) | NO |  | null
--   is_delete | tinyint | YES |  | 0
--   create_time | timestamp | YES |  | CURRENT_TIMESTAMP
--   update_time | timestamp | YES |  | CURRENT_TIMESTAMP

-- ========================================
-- 表名：in_out_record
-- ========================================
CREATE TABLE `in_out_record` (
  `id` int NOT NULL AUTO_INCREMENT,
  `goods_id` int NOT NULL COMMENT '关联商品ID',
  `operate_time` datetime NOT NULL COMMENT '操作时间',
  `operate_type` varchar(10) NOT NULL COMMENT '操作类型：入库/出库',
  `operate_num` int NOT NULL COMMENT '操作数量',
  `operator` varchar(20) NOT NULL COMMENT '操作人',
  `reason` varchar(100) DEFAULT '' COMMENT '操作原因',
  `is_delete` tinyint DEFAULT '0' COMMENT '软删除',
  `create_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_goods_id` (`goods_id`),
  KEY `idx_operate_time` (`operate_time`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 字段信息：
--   id | int | NO | PRI | null
--   goods_id | int | NO | MUL | null
--   operate_time | datetime | NO | MUL | null
--   operate_type | varchar(10) | NO |  | null
--   operate_num | int | NO |  | null
--   operator | varchar(20) | NO |  | null
--   reason | varchar(100) | YES |  | 
--   is_delete | tinyint | YES |  | 0
--   create_time | timestamp | YES |  | CURRENT_TIMESTAMP
--   update_time | timestamp | YES |  | CURRENT_TIMESTAMP

-- ========================================
-- 表名：inventory_items
-- ========================================
CREATE TABLE `inventory_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `goods_name` varchar(100) NOT NULL,
  `sku_code` varchar(50) DEFAULT NULL,
  `warehouse_id` int NOT NULL,
  `stock_qty` int DEFAULT '0',
  `safe_stock` int DEFAULT '100',
  `unit` varchar(20) DEFAULT '?',
  `location_code` varchar(50) DEFAULT NULL,
  `create_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sku_code` (`sku_code`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 字段信息：
--   id | int | NO | PRI | null
--   goods_name | varchar(100) | NO |  | null
--   sku_code | varchar(50) | YES | UNI | null
--   warehouse_id | int | NO |  | null
--   stock_qty | int | YES |  | 0
--   safe_stock | int | YES |  | 100
--   unit | varchar(20) | YES |  | ?
--   location_code | varchar(50) | YES |  | null
--   create_time | timestamp | YES |  | CURRENT_TIMESTAMP
--   update_time | timestamp | YES |  | CURRENT_TIMESTAMP

-- ========================================
-- 表名：inventory_logs
-- ========================================
CREATE TABLE `inventory_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `goods_id` int NOT NULL,
  `type` enum('inbound','outbound','adjustment') NOT NULL,
  `qty` int NOT NULL,
  `operator_id` int DEFAULT NULL,
  `remark` varchar(255) DEFAULT NULL,
  `create_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `goods_id` (`goods_id`),
  CONSTRAINT `inventory_logs_ibfk_1` FOREIGN KEY (`goods_id`) REFERENCES `inventory_items` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 字段信息：
--   id | int | NO | PRI | null
--   goods_id | int | NO | MUL | null
--   type | enum('inbound','outbound','adjustment') | NO |  | null
--   qty | int | NO |  | null
--   operator_id | int | YES |  | null
--   remark | varchar(255) | YES |  | null
--   create_time | timestamp | YES |  | CURRENT_TIMESTAMP

-- ========================================
-- 表名：orders
-- ========================================
CREATE TABLE `orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_no` varchar(50) NOT NULL,
  `customer_name` varchar(100) NOT NULL,
  `sender_address` varchar(255) NOT NULL,
  `receiver_address` varchar(255) NOT NULL,
  `goods_type` varchar(50) DEFAULT NULL,
  `weight` decimal(10,2) DEFAULT NULL,
  `volume` decimal(10,2) DEFAULT NULL,
  `status` enum('pending','assigned','shipping','delivered','exception','cancelled') DEFAULT 'pending',
  `amount` decimal(10,2) DEFAULT NULL,
  `exception_reason` varchar(255) DEFAULT NULL,
  `create_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_no` (`order_no`)
) ENGINE=InnoDB AUTO_INCREMENT=84 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 字段信息：
--   id | int | NO | PRI | null
--   order_no | varchar(50) | NO | UNI | null
--   customer_name | varchar(100) | NO |  | null
--   sender_address | varchar(255) | NO |  | null
--   receiver_address | varchar(255) | NO |  | null
--   goods_type | varchar(50) | YES |  | null
--   weight | decimal(10,2) | YES |  | null
--   volume | decimal(10,2) | YES |  | null
--   status | enum('pending','assigned','shipping','delivered','exception','cancelled') | YES |  | pending
--   amount | decimal(10,2) | YES |  | null
--   exception_reason | varchar(255) | YES |  | null
--   create_time | timestamp | YES |  | CURRENT_TIMESTAMP
--   update_time | timestamp | YES |  | CURRENT_TIMESTAMP

-- ========================================
-- 表名：track_detail
-- ========================================
CREATE TABLE `track_detail` (
  `id` int NOT NULL AUTO_INCREMENT,
  `track_id` int NOT NULL COMMENT '关联轨迹主表ID',
  `operate_time` datetime NOT NULL COMMENT '操作时间',
  `node_name` varchar(20) NOT NULL COMMENT '节点名称',
  `node_status` varchar(10) NOT NULL COMMENT '节点状态：待配送/配送中/已完成',
  `operator` varchar(20) NOT NULL COMMENT '操作人',
  `remark` varchar(100) DEFAULT '' COMMENT '备注',
  `is_delete` tinyint DEFAULT '0' COMMENT '软删除',
  `create_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_track_id` (`track_id`),
  KEY `idx_operate_time` (`operate_time`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 字段信息：
--   id | int | NO | PRI | null
--   track_id | int | NO | MUL | null
--   operate_time | datetime | NO | MUL | null
--   node_name | varchar(20) | NO |  | null
--   node_status | varchar(10) | NO |  | null
--   operator | varchar(20) | NO |  | null
--   remark | varchar(100) | YES |  | 
--   is_delete | tinyint | YES |  | 0
--   create_time | timestamp | YES |  | CURRENT_TIMESTAMP

-- ========================================
-- 表名：track_point
-- ========================================
CREATE TABLE `track_point` (
  `id` int NOT NULL AUTO_INCREMENT,
  `track_id` int NOT NULL COMMENT '轨迹ID',
  `point_type` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '点类型：start-起点，waypoint-途经点，end-终点',
  `location` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '位置',
  `coord` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '坐标',
  `arrive_time` timestamp NULL DEFAULT NULL COMMENT '到达时间',
  PRIMARY KEY (`id`),
  KEY `idx_track_id` (`track_id`),
  KEY `idx_point_type` (`point_type`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='轨迹点表';

-- 字段信息：
--   id | int | NO | PRI | null
--   track_id | int | NO | MUL | null
--   point_type | varchar(20) | YES | MUL | null
--   location | varchar(255) | YES |  | null
--   coord | varchar(50) | YES |  | null
--   arrive_time | timestamp | YES |  | null

-- ========================================
-- 表名：transport_tasks
-- ========================================
CREATE TABLE `transport_tasks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `task_no` varchar(50) NOT NULL,
  `order_id` int NOT NULL,
  `vehicle_id` int NOT NULL,
  `route_plan` json DEFAULT NULL,
  `start_time` datetime DEFAULT NULL,
  `end_time` datetime DEFAULT NULL,
  `cost` decimal(10,2) DEFAULT '0.00',
  `status` enum('pending','in_transit','completed','failed') DEFAULT 'pending',
  `create_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `task_no` (`task_no`),
  KEY `order_id` (`order_id`),
  KEY `vehicle_id` (`vehicle_id`),
  CONSTRAINT `transport_tasks_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`),
  CONSTRAINT `transport_tasks_ibfk_2` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 字段信息：
--   id | int | NO | PRI | null
--   task_no | varchar(50) | NO | UNI | null
--   order_id | int | NO | MUL | null
--   vehicle_id | int | NO | MUL | null
--   route_plan | json | YES |  | null
--   start_time | datetime | YES |  | null
--   end_time | datetime | YES |  | null
--   cost | decimal(10,2) | YES |  | 0.00
--   status | enum('pending','in_transit','completed','failed') | YES |  | pending
--   create_time | timestamp | YES |  | CURRENT_TIMESTAMP
--   update_time | timestamp | YES |  | CURRENT_TIMESTAMP

-- ========================================
-- 表名：transport_track
-- ========================================
CREATE TABLE `transport_track` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` varchar(20) NOT NULL COMMENT '关联运单号',
  `track_status` varchar(10) NOT NULL COMMENT '轨迹状态：待配送/配送中/已完成',
  `is_delete` tinyint DEFAULT '0' COMMENT '软删除',
  `create_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_order_id` (`order_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 字段信息：
--   id | int | NO | PRI | null
--   order_id | varchar(20) | NO | MUL | null
--   track_status | varchar(10) | NO |  | null
--   is_delete | tinyint | YES |  | 0
--   create_time | timestamp | YES |  | CURRENT_TIMESTAMP
--   update_time | timestamp | YES |  | CURRENT_TIMESTAMP

-- ========================================
-- 表名：users
-- ========================================
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `real_name` varchar(50) DEFAULT NULL,
  `role` enum('admin','manager','dispatcher','warehouse') DEFAULT 'manager',
  `status` tinyint DEFAULT '1',
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `avatar` varchar(255) DEFAULT NULL,
  `last_login` timestamp NULL DEFAULT NULL,
  `create_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 字段信息：
--   id | int | NO | PRI | null
--   username | varchar(50) | NO | UNI | null
--   password | varchar(255) | NO |  | null
--   real_name | varchar(50) | YES |  | null
--   role | enum('admin','manager','dispatcher','warehouse') | YES |  | manager
--   status | tinyint | YES |  | 1
--   phone | varchar(20) | YES |  | null
--   email | varchar(100) | YES |  | null
--   avatar | varchar(255) | YES |  | null
--   last_login | timestamp | YES |  | null
--   create_time | timestamp | YES |  | CURRENT_TIMESTAMP
--   update_time | timestamp | YES |  | CURRENT_TIMESTAMP

-- ========================================
-- 表名：vehicle_info
-- ========================================
CREATE TABLE `vehicle_info` (
  `id` int NOT NULL AUTO_INCREMENT,
  `car_no` varchar(20) NOT NULL COMMENT '车牌号',
  `driver` varchar(20) NOT NULL COMMENT '司机姓名',
  `phone` varchar(11) NOT NULL COMMENT '司机电话',
  `status` varchar(10) DEFAULT '空闲' COMMENT '状态：空闲/在途/维修/已分配',
  `area` varchar(20) NOT NULL COMMENT '所属区域',
  `load_capacity` decimal(5,1) NOT NULL COMMENT '载重（吨）',
  `is_delete` tinyint DEFAULT '0' COMMENT '软删除',
  `create_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_car_no` (`car_no`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 字段信息：
--   id | int | NO | PRI | null
--   car_no | varchar(20) | NO | UNI | null
--   driver | varchar(20) | NO |  | null
--   phone | varchar(11) | NO |  | null
--   status | varchar(10) | YES |  | 空闲
--   area | varchar(20) | NO |  | null
--   load_capacity | decimal(5,1) | NO |  | null
--   is_delete | tinyint | YES |  | 0
--   create_time | timestamp | YES |  | CURRENT_TIMESTAMP
--   update_time | timestamp | YES |  | CURRENT_TIMESTAMP

-- ========================================
-- 表名：vehicles
-- ========================================
CREATE TABLE `vehicles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `car_no` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '车牌号',
  `driver_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '司机姓名',
  `driver_phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '司机电话',
  `status` enum('idle','busy','maintenance') COLLATE utf8mb4_unicode_ci DEFAULT 'idle' COMMENT '车辆状态',
  `current_area` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '当前位置',
  `load_capacity` decimal(10,2) DEFAULT NULL COMMENT '载重(吨)',
  `current_order_id` int DEFAULT NULL COMMENT '当前订单ID',
  `create_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `car_no` (`car_no`),
  KEY `idx_car_no` (`car_no`),
  KEY `idx_status` (`status`),
  KEY `idx_current_order` (`current_order_id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='车辆表';

-- 字段信息：
--   id | int | NO | PRI | null
--   car_no | varchar(20) | NO | UNI | null
--   driver_name | varchar(50) | NO |  | null
--   driver_phone | varchar(20) | YES |  | null
--   status | enum('idle','busy','maintenance') | YES | MUL | idle
--   current_area | varchar(100) | YES |  | null
--   load_capacity | decimal(10,2) | YES |  | null
--   current_order_id | int | YES | MUL | null
--   create_time | timestamp | YES |  | CURRENT_TIMESTAMP
--   update_time | timestamp | YES |  | CURRENT_TIMESTAMP

-- ========================================
-- 表名：waybill_main
-- ========================================
CREATE TABLE `waybill_main` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` varchar(20) NOT NULL COMMENT '运单号',
  `goods_type` varchar(10) NOT NULL COMMENT '货物类型：生鲜/标品/大件/耗材',
  `weight` decimal(5,1) NOT NULL COMMENT '重量（吨）',
  `area` varchar(20) NOT NULL COMMENT '配送区域',
  `urgent_level` varchar(10) NOT NULL COMMENT '紧急程度：紧急/普通',
  `order_status` varchar(10) DEFAULT '待分配' COMMENT '运单状态',
  `vehicle_id` int DEFAULT NULL COMMENT '关联车辆ID',
  `expected_arrive_time` datetime DEFAULT NULL COMMENT '预计到达时间',
  `is_delete` tinyint DEFAULT '0' COMMENT '软删除',
  `create_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_order_id` (`order_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 字段信息：
--   id | int | NO | PRI | null
--   order_id | varchar(20) | NO | UNI | null
--   goods_type | varchar(10) | NO |  | null
--   weight | decimal(5,1) | NO |  | null
--   area | varchar(20) | NO |  | null
--   urgent_level | varchar(10) | NO |  | null
--   order_status | varchar(10) | YES |  | 待分配
--   vehicle_id | int | YES |  | null
--   expected_arrive_time | datetime | YES |  | null
--   is_delete | tinyint | YES |  | 0
--   create_time | timestamp | YES |  | CURRENT_TIMESTAMP
--   update_time | timestamp | YES |  | CURRENT_TIMESTAMP

