-- Add unit_price column to goods_stock table
ALTER TABLE goods_stock 
ADD COLUMN unit_price DECIMAL(10,2) DEFAULT 0.00 
AFTER current_stock;

-- Update existing data with unit prices
UPDATE goods_stock SET unit_price = 15.50 WHERE goods_name = '生鲜-蔬菜';
UPDATE goods_stock SET unit_price = 25.00 WHERE goods_name = '标品-日用品';
UPDATE goods_stock SET unit_price = 1200.00 WHERE goods_name = '大件-家电';
UPDATE goods_stock SET unit_price = 5.00 WHERE goods_name = '耗材-包装';
