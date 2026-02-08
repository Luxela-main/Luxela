CREATE TYPE "public"."notification_category" AS ENUM('order_confirmed', 'order_processing', 'shipment_ready', 'in_transit', 'out_for_delivery', 'delivered', 'delivery_failed', 'return_request', 'refund_processed', 'review_request', 'product_back_in_stock', 'price_drop', 'dispute', 'payment_failed', 'system_alert', 'urgent_ticket', 'sla_breach', 'escalation', 'team_capacity', 'new_reply');--> statement-breakpoint
CREATE TYPE "public"."notification_severity" AS ENUM('info', 'warning', 'critical');--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'listing_approved';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'listing_rejected';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'listing_revision_requested';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'dispute_opened';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'dispute_resolved';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'return_initiated';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'return_completed';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'payment_processed';--> statement-breakpoint
CREATE TABLE "admin_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_id" uuid NOT NULL,
	"type" "notification_category" NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"severity" "notification_severity" NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"is_starred" boolean DEFAULT false NOT NULL,
	"related_entity_id" uuid,
	"related_entity_type" varchar(50),
	"action_url" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "buyer_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"buyer_id" uuid NOT NULL,
	"type" "notification_category" NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"is_starred" boolean DEFAULT false NOT NULL,
	"related_entity_id" uuid,
	"related_entity_type" varchar(50),
	"action_url" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seller_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seller_id" uuid NOT NULL,
	"type" "notification_category" NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"severity" "notification_severity" NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"is_starred" boolean DEFAULT false NOT NULL,
	"related_entity_id" uuid,
	"related_entity_type" varchar(50),
	"action_url" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admin_notifications" ADD CONSTRAINT "admin_notifications_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buyer_notifications" ADD CONSTRAINT "buyer_notifications_buyer_id_buyers_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."buyers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_notifications" ADD CONSTRAINT "seller_notifications_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admin_notifications_admin_id_idx" ON "admin_notifications" USING btree ("admin_id");--> statement-breakpoint
CREATE INDEX "admin_notifications_is_read_idx" ON "admin_notifications" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "admin_notifications_created_at_idx" ON "admin_notifications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "buyer_notifications_buyer_id_idx" ON "buyer_notifications" USING btree ("buyer_id");--> statement-breakpoint
CREATE INDEX "buyer_notifications_is_read_idx" ON "buyer_notifications" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "buyer_notifications_created_at_idx" ON "buyer_notifications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "seller_notifications_seller_id_idx" ON "seller_notifications" USING btree ("seller_id");--> statement-breakpoint
CREATE INDEX "seller_notifications_is_read_idx" ON "seller_notifications" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "seller_notifications_created_at_idx" ON "seller_notifications" USING btree ("created_at");