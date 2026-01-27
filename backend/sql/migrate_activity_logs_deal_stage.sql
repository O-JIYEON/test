ALTER TABLE `activity_logs`
  ADD COLUMN `deal_stage` VARCHAR(255) NULL AFTER `sales_owner`;
