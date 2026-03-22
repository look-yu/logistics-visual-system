-- ========================================
-- 司机表
-- ========================================
CREATE TABLE IF NOT EXISTS `drivers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `driver_name` varchar(50) NOT NULL COMMENT '司机姓名',
  `phone` varchar(20) NOT NULL COMMENT '联系电话',
  `id_card` varchar(18) DEFAULT NULL COMMENT '身份证号',
  `license_no` varchar(50) DEFAULT NULL COMMENT '驾驶证号',
  `license_type` varchar(20) DEFAULT NULL COMMENT '驾驶证类型（A1/A2/B1/B2/C1）',
  `license_expire_date` date DEFAULT NULL COMMENT '驾驶证到期日期',
  `address` varchar(255) DEFAULT NULL COMMENT '家庭住址',
  `emergency_contact` varchar(50) DEFAULT NULL COMMENT '紧急联系人',
  `emergency_phone` varchar(20) DEFAULT NULL COMMENT '紧急联系电话',
  `status` enum('active','inactive','on_leave') DEFAULT 'active' COMMENT '状态：在职/离职/请假',
  `hire_date` date DEFAULT NULL COMMENT '入职日期',
  `total_mileage` decimal(10,2) DEFAULT '0.00' COMMENT '总行驶里程（公里）',
  `total_orders` int DEFAULT '0' COMMENT '总运输订单数',
  `rating` decimal(3,2) DEFAULT '5.00' COMMENT '评分（0-5）',
  `avatar` varchar(255) DEFAULT NULL COMMENT '头像URL',
  `create_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_phone` (`phone`),
  KEY `idx_status` (`status`),
  KEY `idx_driver_name` (`driver_name`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='司机信息表';

-- ========================================
-- 运输文档表
-- ========================================
CREATE TABLE IF NOT EXISTS `transport_documents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `document_no` varchar(50) NOT NULL COMMENT '文档编号',
  `document_type` enum('packing_list','delivery_note','invoice','waybill','receipt','other') NOT NULL COMMENT '文档类型：装箱单/发货单/发票/运单/收据/其他',
  `order_id` int DEFAULT NULL COMMENT '关联订单ID',
  `driver_id` int DEFAULT NULL COMMENT '关联司机ID',
  `vehicle_id` int DEFAULT NULL COMMENT '关联车辆ID',
  `document_title` varchar(200) NOT NULL COMMENT '文档标题',
  `file_path` varchar(500) DEFAULT NULL COMMENT '文件存储路径',
  `file_name` varchar(255) DEFAULT NULL COMMENT '文件名',
  `file_size` bigint DEFAULT NULL COMMENT '文件大小（字节）',
  `file_type` varchar(50) DEFAULT NULL COMMENT '文件类型（PDF/Excel/Word等）',
  `status` enum('draft','pending_review','approved','rejected','archived') DEFAULT 'draft' COMMENT '文档状态：草稿/待审核/已批准/已拒绝/已归档',
  `created_by` int DEFAULT NULL COMMENT '创建人ID',
  `reviewed_by` int DEFAULT NULL COMMENT '审核人ID',
  `review_time` timestamp NULL DEFAULT NULL COMMENT '审核时间',
  `review_comment` text DEFAULT NULL COMMENT '审核意见',
  `issue_date` date DEFAULT NULL COMMENT '签发日期',
  `expire_date` date DEFAULT NULL COMMENT '过期日期',
  `is_compliant` tinyint DEFAULT '1' COMMENT '是否合规（1-是，0-否）',
  `compliance_check_result` text DEFAULT NULL COMMENT '合规性检查结果',
  `remark` text DEFAULT NULL COMMENT '备注',
  `create_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_document_no` (`document_no`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_driver_id` (`driver_id`),
  KEY `idx_vehicle_id` (`vehicle_id`),
  KEY `idx_document_type` (`document_type`),
  KEY `idx_status` (`status`),
  KEY `idx_issue_date` (`issue_date`),
  CONSTRAINT `transport_documents_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE SET NULL,
  CONSTRAINT `transport_documents_ibfk_2` FOREIGN KEY (`driver_id`) REFERENCES `drivers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `transport_documents_ibfk_3` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='运输文档表';
