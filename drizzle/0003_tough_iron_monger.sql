ALTER TABLE mail_outbox ADD COLUMN payload text;
--> statement-breakpoint
CREATE TABLE notification_outbox (
 id text PRIMARY KEY NOT NULL,
 source_id text NOT NULL,
 kind text NOT NULL,
 status text NOT NULL DEFAULT 'ready',
 payload text,
 provider_id text,
 first_attempt integer,
 updated_at integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX idx_notifications_status_updated ON notification_outbox(status,updated_at);
--> statement-breakpoint
CREATE TRIGGER enqueue_request_notification AFTER INSERT ON requests BEGIN
 INSERT INTO notification_outbox(id,source_id,kind,updated_at) VALUES('request:'||NEW.id,NEW.id,'request',NEW.created_at) ON CONFLICT(id) DO NOTHING;
END;
--> statement-breakpoint
CREATE TRIGGER enqueue_owner_order_notification AFTER UPDATE OF status ON orders WHEN NEW.status IN ('paid','shipped','delivered','refunded') AND OLD.status!=NEW.status BEGIN
 INSERT INTO notification_outbox(id,source_id,kind,updated_at) VALUES('order:'||NEW.id||':'||NEW.status,NEW.id,NEW.status,NEW.updated_at) ON CONFLICT(id) DO NOTHING;
END;
