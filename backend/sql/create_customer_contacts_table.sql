CREATE TABLE IF NOT EXISTS `customer_contacts` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `customer_id` INT NOT NULL,
  `name` VARCHAR(255),
  `contact` VARCHAR(255),
  `email` VARCHAR(255),
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_customer_contacts_customer`
    FOREIGN KEY (`customer_id`)
    REFERENCES `customers`(`id`)
    ON DELETE CASCADE
);
