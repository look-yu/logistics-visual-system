-- 清空所有表格数据（保留表结构和属性）
-- 执行此脚本将清空所有表的数据，但保留表结构

USE logistics_db;

-- 1. 清空原有可视化数据表
TRUNCATE TABLE logistics_data;

-- 2. 清空仓库基础信息表
TRUNCATE TABLE warehouse;

-- 3. 清空设备类型表
TRUNCATE TABLE device_type;

-- 4. 清空实时库存表
TRUNCATE TABLE inventory;

-- 5. 清空库存分布表
TRUNCATE TABLE inventory_distribution;

-- 6. 清空库存月度走势表
TRUNCATE TABLE inventory_monthly_trend;

-- 7. 清空仓库使用趋势表
TRUNCATE TABLE warehouse_usage_trend;

-- 8. 清空设备表
TRUNCATE TABLE device;

-- 9. 清空设备报警表
TRUNCATE TABLE device_alarm;

-- 验证清空结果
SELECT 'logistics_data 表数据已清空' AS status;
SELECT COUNT(*) AS 'warehouse 表记录数' FROM warehouse;
SELECT COUNT(*) AS 'device_type 表记录数' FROM device_type;
SELECT COUNT(*) AS 'inventory 表记录数' FROM inventory;
SELECT COUNT(*) AS 'inventory_distribution 表记录数' FROM inventory_distribution;
SELECT COUNT(*) AS 'inventory_monthly_trend 表记录数' FROM inventory_monthly_trend;
SELECT COUNT(*) AS 'warehouse_usage_trend 表记录数' FROM warehouse_usage_trend;
SELECT COUNT(*) AS 'device 表记录数' FROM device;
SELECT COUNT(*) AS 'device_alarm 表记录数' FROM device_alarm;

-- 提示：所有表结构已保留，可以重新插入测试数据
