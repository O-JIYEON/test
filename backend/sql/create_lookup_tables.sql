CREATE TABLE IF NOT EXISTS `lookup_categories` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `label` VARCHAR(100) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_lookup_categories_label` (`label`)
);

CREATE TABLE IF NOT EXISTS `lookup_values` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `category_id` INT NOT NULL,
  `label` VARCHAR(100) NOT NULL,
  `department` VARCHAR(100) DEFAULT NULL,
  `probability` DECIMAL(5,2) DEFAULT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_lookup_values_category` (`category_id`),
  UNIQUE KEY `uk_lookup_values_category_label` (`category_id`, `label`),
  CONSTRAINT `fk_lookup_values_category`
    FOREIGN KEY (`category_id`) REFERENCES `lookup_categories` (`id`)
    ON DELETE CASCADE
);
