CREATE TABLE IF NOT EXISTS `deal` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `company` VARCHAR(255),
  `project` VARCHAR(255),
  `owner` VARCHAR(255),
  `source` VARCHAR(255),
  PRIMARY KEY (`id`)
);
