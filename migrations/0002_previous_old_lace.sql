CREATE TABLE `hydration_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`date` text NOT NULL,
	`logged_at` integer NOT NULL,
	`gallons` real NOT NULL
);
--> statement-breakpoint
CREATE TABLE `run_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`date` text NOT NULL,
	`logged_at` integer NOT NULL,
	`distance_km` real NOT NULL,
	`pace` text
);
--> statement-breakpoint
-- Backfill: hydration/run totals were previously running-total columns with
-- no itemized history. Carry each day's existing total forward as a single
-- entry before dropping those columns, so no logged data is lost.
INSERT INTO `hydration_entries` (`id`, `user_id`, `date`, `logged_at`, `gallons`)
SELECT lower(hex(randomblob(16))), `user_id`, `date`, `created_at`, `fluid_gallons`
FROM `daily_logs` WHERE `fluid_gallons` > 0;
--> statement-breakpoint
INSERT INTO `run_entries` (`id`, `user_id`, `date`, `logged_at`, `distance_km`, `pace`)
SELECT lower(hex(randomblob(16))), `user_id`, `date`, `created_at`, `distance_km_actual`, `pace_actual`
FROM `daily_logs` WHERE `distance_km_actual` > 0;
--> statement-breakpoint
ALTER TABLE `daily_logs` DROP COLUMN `calories_consumed`;--> statement-breakpoint
ALTER TABLE `daily_logs` DROP COLUMN `protein_g_consumed`;--> statement-breakpoint
ALTER TABLE `daily_logs` DROP COLUMN `fat_g_consumed`;--> statement-breakpoint
ALTER TABLE `daily_logs` DROP COLUMN `carbs_g_consumed`;--> statement-breakpoint
ALTER TABLE `daily_logs` DROP COLUMN `fluid_gallons`;--> statement-breakpoint
ALTER TABLE `daily_logs` DROP COLUMN `distance_km_actual`;--> statement-breakpoint
ALTER TABLE `daily_logs` DROP COLUMN `pace_actual`;