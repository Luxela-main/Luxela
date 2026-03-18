ALTER TABLE "admin_notifications" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "buyer_notifications" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "seller_notifications" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
CREATE INDEX "admin_notifications_deleted_at_idx" ON "admin_notifications" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "buyer_notifications_deleted_at_idx" ON "buyer_notifications" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "seller_notifications_deleted_at_idx" ON "seller_notifications" USING btree ("deleted_at");