CREATE TABLE IF NOT EXISTS `lead` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `lead_code` VARCHAR(20) UNIQUE,
  `customer_id` INT NOT NULL,
  `contact_id` INT,
  `customer_owner` VARCHAR(255),
  `source` VARCHAR(255),
  `product_line` VARCHAR(255),
  `region` VARCHAR(255),
  `segment` VARCHAR(255),
  `content` TEXT,
  `lead_status` VARCHAR(255),
  `next_action_date` DATE,
  `next_action_content` TEXT,
  `deleted_at` DATETIME,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);
