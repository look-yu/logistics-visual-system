ALTER TABLE orders ADD COLUMN customer_id INT AFTER order_no;
ALTER TABLE orders ADD INDEX idx_customer_id (customer_id);
