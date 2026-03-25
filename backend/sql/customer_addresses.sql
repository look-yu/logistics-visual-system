CREATE TABLE IF NOT EXISTS customer_addresses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  customer_id INT NOT NULL,
  receiver_name VARCHAR(100) NOT NULL COMMENT '收货人姓名',
  phone VARCHAR(20) NOT NULL COMMENT '联系电话',
  province VARCHAR(50) NOT NULL COMMENT '省份',
  city VARCHAR(50) NOT NULL COMMENT '城市',
  district VARCHAR(50) NOT NULL COMMENT '区县',
  detail_address VARCHAR(200) NOT NULL COMMENT '详细地址',
  is_default TINYINT(1) DEFAULT 0 COMMENT '是否默认地址',
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_customer_id (customer_id),
  INDEX idx_is_default (customer_id, is_default)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='客户收货地址表';
