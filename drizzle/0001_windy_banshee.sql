CREATE TABLE `refund_actions` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`transaction_id` text NOT NULL,
	`amount` integer NOT NULL,
	`status` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_refund_transaction` ON `refund_actions` (`transaction_id`);--> statement-breakpoint
CREATE INDEX `idx_refund_order` ON `refund_actions` (`order_id`);
