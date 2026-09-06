-- Release rejected inventory only after an explicit confirmed-unpaid close.
DROP TRIGGER IF EXISTS release_order_stock;
--> statement-breakpoint
CREATE TRIGGER release_order_stock AFTER UPDATE OF status ON orders WHEN NEW.status='failed' AND OLD.status IN ('initializing','pending','review','reconcile','rejected') BEGIN
 UPDATE products SET stock=stock+(SELECT quantity FROM order_lines WHERE order_id=NEW.id AND product_id=products.id) WHERE id IN (SELECT product_id FROM order_lines WHERE order_id=NEW.id);
END;
--> statement-breakpoint
CREATE TABLE `mail_outbox` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`kind` text NOT NULL,
	`status` text NOT NULL,
	`provider_id` text,
	`first_attempt` integer,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_outbox_status_updated` ON `mail_outbox` (`status`,`updated_at`);
--> statement-breakpoint
CREATE TRIGGER enqueue_order_email AFTER UPDATE OF status ON orders WHEN NEW.status IN ('paid','shipped','refunded') AND OLD.status!=NEW.status BEGIN
 INSERT INTO mail_outbox(id,order_id,kind,status,updated_at) VALUES(NEW.id||':'||NEW.status,NEW.id,NEW.status,'ready',NEW.updated_at) ON CONFLICT(id) DO NOTHING;
END;
