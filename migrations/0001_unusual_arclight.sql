CREATE TABLE `workout_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`date` text NOT NULL,
	`logged_at` integer NOT NULL,
	`equipment_type` text NOT NULL,
	`exercise_name` text NOT NULL,
	`weight_lbs` real,
	`sets` integer,
	`reps` integer,
	`notes` text
);
