CREATE TABLE IF NOT EXISTS `lead` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `customer_id` INT NOT NULL,
  `content` TEXT,
  `lead_status` VARCHAR(255),
  `next_action_date` DATE,
  `next_action_content` TEXT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);
