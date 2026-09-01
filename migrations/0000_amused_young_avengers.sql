CREATE TABLE `blueprint_config` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`protein_floor_g` real DEFAULT 190 NOT NULL,
	`low_calorie_kcal` integer DEFAULT 1850 NOT NULL,
	`high_calorie_kcal` integer DEFAULT 2300 NOT NULL,
	`reset_calorie_kcal` integer DEFAULT 1700 NOT NULL,
	`fluid_target_gallons` real DEFAULT 2 NOT NULL,
	`sodium_min_mg` integer DEFAULT 500 NOT NULL,
	`potassium_min_mg` integer DEFAULT 200 NOT NULL,
	`autoregulation_active` integer DEFAULT false NOT NULL,
	`autoregulation_triggered_at` integer,
	`autoregulation_reason` text,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `daily_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`date` text NOT NULL,
	`day_type` text NOT NULL,
	`target_calories` integer NOT NULL,
	`current_weight_lbs` real,
	`calories_consumed` real DEFAULT 0 NOT NULL,
	`protein_g_consumed` real DEFAULT 0 NOT NULL,
	`fat_g_consumed` real DEFAULT 0 NOT NULL,
	`carbs_g_consumed` real DEFAULT 0 NOT NULL,
	`fluid_gallons` real DEFAULT 0 NOT NULL,
	`distance_km_actual` real DEFAULT 0 NOT NULL,
	`pace_actual` text,
	`electrolytes_replenished` integer DEFAULT false NOT NULL,
	`am_cardio_done` integer DEFAULT false NOT NULL,
	`pm_strength_done` integer DEFAULT false NOT NULL,
	`notes` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `food_library` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`brand` text,
	`category` text,
	`unit_label` text NOT NULL,
	`calories` real NOT NULL,
	`protein_g` real NOT NULL,
	`fat_g` real NOT NULL,
	`carbs_g` real NOT NULL,
	`quick_log` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `meal_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`daily_log_id` text NOT NULL,
	`logged_at` integer NOT NULL,
	`description` text NOT NULL,
	`source` text NOT NULL,
	`calories` real NOT NULL,
	`protein_g` real NOT NULL,
	`fat_g` real NOT NULL,
	`carbs_g` real NOT NULL,
	`raw_input` text
);
--> statement-breakpoint
CREATE TABLE `strength_metrics` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`date` text NOT NULL,
	`lift` text NOT NULL,
	`top_weight_lbs` real NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text,
	`height_inches` real,
	`start_weight_lbs` real,
	`target_weight_lbs` real,
	`age` integer,
	`start_date` text,
	`target_date` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `weekly_schedule` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`day_of_week` integer NOT NULL,
	`label` text NOT NULL,
	`day_type` text NOT NULL,
	`target_calories` integer NOT NULL,
	`am_activity` text,
	`pm_activity` text,
	`distance_km_goal` real
);
