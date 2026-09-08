CREATE TABLE `customer_reset_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`version` text NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_customer_reset_customer` ON `customer_reset_tokens` (`customer_id`);--> statement-breakpoint
CREATE TABLE `customer_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`version` text NOT NULL,
	`browser_session` text NOT NULL,
	`expires` integer NOT NULL,
	`last_seen` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_customer_sessions_customer` ON `customer_sessions` (`customer_id`);--> statement-breakpoint
CREATE INDEX `idx_customer_sessions_expires` ON `customer_sessions` (`expires`);--> statement-breakpoint
CREATE TABLE `customers` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`digest` text NOT NULL,
	`version` text NOT NULL,
	`created_at` integer NOT NULL,
	`privacy_version` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_customers_email` ON `customers` (`email`);--> statement-breakpoint
ALTER TABLE `orders` ADD `customer_id` text;