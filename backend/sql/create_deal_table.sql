CREATE TABLE IF NOT EXISTS `deal` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `deal_code` VARCHAR(20) UNIQUE,
  `lead_id` INT NOT NULL,
  `project_name` VARCHAR(255),
  `stage` VARCHAR(255),
  `expected_amount` BIGINT,
  `expected_close_date` DATE,
  `won_date` DATE,
  `next_action_date` DATE,
  `next_action_content` TEXT,
  `loss_reason` TEXT,
  `deleted_at` DATETIME,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);
