CREATE TABLE IF NOT EXISTS `goals` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `period_type` ENUM('year','month') NOT NULL,
  `period_start` DATE NOT NULL,
  `amount` BIGINT DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_goals_period` (`period_type`, `period_start`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
