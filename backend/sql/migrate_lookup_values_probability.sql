ALTER TABLE `lookup_values`
  ADD COLUMN `probability` DECIMAL(5,2) DEFAULT NULL AFTER `label`;
