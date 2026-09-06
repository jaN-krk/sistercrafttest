-- Schema only. Catalog content is imported by the application separately.
CREATE TABLE `audit_log` (
	`id` text PRIMARY KEY NOT NULL,
	`actor` text NOT NULL,
	`action` text NOT NULL,
	`target` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_audit_created` ON `audit_log` (`created_at`);--> statement-breakpoint
CREATE TABLE `cart_items` (
	`session` text NOT NULL,
	`product_id` text NOT NULL,
	`quantity` integer NOT NULL,
	PRIMARY KEY(`session`, `product_id`)
);
--> statement-breakpoint
CREATE TABLE `rate_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `order_lines` (
	`order_id` text NOT NULL,
	`product_id` text NOT NULL,
	`name` text NOT NULL,
	`quantity` integer NOT NULL,
	`price` integer NOT NULL,
	PRIMARY KEY(`order_id`, `product_id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`number` text NOT NULL,
	`session` text NOT NULL,
	`status` text NOT NULL,
	`customer` text NOT NULL,
	`subtotal` integer NOT NULL,
	`shipping` integer NOT NULL,
	`total` integer NOT NULL,
	`token` text,
	`payment_url` text,
	`payment_id` text,
	`payment_data` text,
	`expires` integer,
	`tracking` text,
	`carrier` text,
	`consent` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_orders_number` ON `orders` (`number`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_orders_token` ON `orders` (`token`);--> statement-breakpoint
CREATE INDEX `idx_orders_session_created` ON `orders` (`session`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_orders_status_created` ON `orders` (`status`,`created_at`);--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL,
	`price` integer NOT NULL,
	`stock` integer DEFAULT 0 NOT NULL,
	`active` integer DEFAULT 1 NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `requests` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`email` text NOT NULL,
	`product_id` text,
	`body` text NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_requests_kind_status` ON `requests` (`kind`,`status`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`csrf` text NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_sessions_expires` ON `sessions` (`expires`);--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX idx_orders_one_open_cart ON orders(session) WHERE status IN ('initializing','pending','review','reconcile');
--> statement-breakpoint
CREATE TRIGGER reserve_order_stock BEFORE INSERT ON order_lines BEGIN
 SELECT CASE WHEN NEW.quantity < 1 OR NEW.quantity > 20 THEN RAISE(ABORT,'INVALID_QUANTITY') END;
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM orders WHERE id=NEW.order_id AND status='initializing') THEN RAISE(ABORT,'INVALID_ORDER') END;
 UPDATE products SET stock=stock-NEW.quantity WHERE id=NEW.product_id AND active=1 AND stock>=NEW.quantity AND price=NEW.price;
 SELECT CASE WHEN changes()=0 THEN RAISE(ABORT,'STOCK_CHANGED') END;
END;
--> statement-breakpoint
CREATE TRIGGER release_order_stock AFTER UPDATE OF status ON orders WHEN NEW.status='failed' AND OLD.status IN ('initializing','pending','review','reconcile') BEGIN
 UPDATE products SET stock=stock+(SELECT quantity FROM order_lines WHERE order_id=NEW.id AND product_id=products.id) WHERE id IN (SELECT product_id FROM order_lines WHERE order_id=NEW.id);
END;
--> statement-breakpoint
CREATE TRIGGER clear_paid_cart AFTER UPDATE OF status ON orders WHEN NEW.status='paid' AND OLD.status IN ('initializing','pending','review','reconcile') BEGIN
 DELETE FROM cart_items WHERE session=NEW.session AND product_id IN(SELECT product_id FROM order_lines WHERE order_id=NEW.id);
END;
