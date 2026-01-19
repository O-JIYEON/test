CREATE TABLE IF NOT EXISTS `project` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `start_date` DATE,
  `end_date` DATE,
  `description` TEXT,
  `owner` VARCHAR(255),
  `source` VARCHAR(255),
  `company` VARCHAR(255),
  `amount` DECIMAL(15, 0),
  PRIMARY KEY (`id`)
);
