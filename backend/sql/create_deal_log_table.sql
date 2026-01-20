CREATE TABLE IF NOT EXISTS `deal_log` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `deal_id` INT NOT NULL,
  `stage` VARCHAR(255),
  `expected_amount` DECIMAL(15, 0),
  `probability` DECIMAL(5, 2),
  `weighted_amount` DECIMAL(15, 0),
  `expected_close_date` DATE,
  `actual_close_date` DATE,
  `action_status` VARCHAR(255),
  `next_action_date` DATE,
  `next_action_content` TEXT,
  `risk` VARCHAR(255),
  `priority` VARCHAR(255),
  `forecast` VARCHAR(255),
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_deal_log_deal_id` (`deal_id`)
);
