CREATE TABLE IF NOT EXISTS `activity_logs` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `lead_id` INT,
  `deal_id` INT,
  `activity_date` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `manager` VARCHAR(255),
  `sales_owner` VARCHAR(255),
  `deal_stage` VARCHAR(255),
  `next_action_date` DATE,
  `next_action_content` TEXT,
  `deleted_at` DATETIME,
  PRIMARY KEY (`id`)
);
