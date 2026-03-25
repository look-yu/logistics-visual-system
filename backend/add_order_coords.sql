-- 为orders表添加坐标字段
USE logistics_db;

ALTER TABLE orders 
ADD COLUMN sender_coord VARCHAR(50) DEFAULT NULL COMMENT '发货地坐标（经度,纬度）',
ADD COLUMN receiver_coord VARCHAR(50) DEFAULT NULL COMMENT '收货地坐标（经度,纬度）';

-- 更新订单坐标
UPDATE orders SET 
  sender_coord = '116.4074,39.9042',
  receiver_coord = '121.4737,31.2304'
WHERE order_no = 'ORD20260310001';

UPDATE orders SET 
  sender_coord = '114.0579,22.5431',
  receiver_coord = '116.4074,39.9042'
WHERE order_no = 'ORD20260310002';

UPDATE orders SET 
  sender_coord = '116.4074,39.9042',
  receiver_coord = '121.4737,31.2304'
WHERE order_no = 'ORD20260311001';

UPDATE orders SET 
  sender_coord = '121.4737,31.2304',
  receiver_coord = '118.7969,32.0603'
WHERE order_no = 'ORD20260311002';

UPDATE orders SET 
  sender_coord = '114.0579,22.5431',
  receiver_coord = '113.2644,23.1291'
WHERE order_no = 'ORD20260312001';

UPDATE orders SET 
  sender_coord = '113.7518,23.0207',
  receiver_coord = '108.9398,34.3416'
WHERE order_no = 'ORD20260312002';

UPDATE orders SET 
  sender_coord = '116.4074,39.9042',
  receiver_coord = '114.3054,30.5931'
WHERE order_no = 'ORD20260313001';

UPDATE orders SET 
  sender_coord = '121.4737,31.2304',
  receiver_coord = '104.0665,30.5723'
WHERE order_no = 'ORD20260314001';

UPDATE orders SET 
  sender_coord = '113.2644,23.1291',
  receiver_coord = '120.1551,30.2741'
WHERE order_no = 'ORD20260315001';

UPDATE orders SET 
  sender_coord = '116.4074,39.9042',
  receiver_coord = '121.4737,31.2304'
WHERE order_no = 'ORD20260316001';

UPDATE orders SET 
  sender_coord = '116.4074,39.9042',
  receiver_coord = '121.6147,38.9140'
WHERE order_no = 'ORD20260316002';

UPDATE orders SET 
  sender_coord = '121.4737,31.2304',
  receiver_coord = '120.1551,30.2741'
WHERE order_no = 'ORD20260316003';

SELECT '订单坐标更新完成' AS message;
