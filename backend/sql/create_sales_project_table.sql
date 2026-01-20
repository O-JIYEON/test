CREATE TABLE IF NOT EXISTS `sales_project` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `company` VARCHAR(255),
  `project` VARCHAR(255),
  `owner` VARCHAR(255),
  `sales_owner` VARCHAR(255),
  `source` VARCHAR(255),
  `product_line` VARCHAR(255),
  `region` VARCHAR(255),
  `segment` VARCHAR(255),
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);
