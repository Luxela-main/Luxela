ALTER TYPE "public"."notification_category" ADD VALUE 'listing_approved';--> statement-breakpoint
ALTER TYPE "public"."notification_category" ADD VALUE 'listing_rejected';--> statement-breakpoint
ALTER TYPE "public"."notification_category" ADD VALUE 'listing_revision_requested';--> statement-breakpoint
ALTER TYPE "public"."notification_category" ADD VALUE 'order_update';--> statement-breakpoint
ALTER TYPE "public"."notification_category" ADD VALUE 'order_pending';--> statement-breakpoint
ALTER TYPE "public"."notification_category" ADD VALUE 'shipment_due';--> statement-breakpoint
ALTER TYPE "public"."notification_category" ADD VALUE 'dispute_open';--> statement-breakpoint
ALTER TYPE "public"."notification_category" ADD VALUE 'new_review';--> statement-breakpoint
ALTER TYPE "public"."notification_category" ADD VALUE 'low_inventory';--> statement-breakpoint
ALTER TYPE "public"."notification_category" ADD VALUE 'order_canceled';--> statement-breakpoint
ALTER TYPE "public"."notification_category" ADD VALUE 'payment_success';--> statement-breakpoint
ALTER TYPE "public"."notification_category" ADD VALUE 'refund_initiated';--> statement-breakpoint
ALTER TYPE "public"."notification_category" ADD VALUE 'return_initiated';--> statement-breakpoint
ALTER TYPE "public"."notification_category" ADD VALUE 'return_completed';--> statement-breakpoint
ALTER TYPE "public"."notification_category" ADD VALUE 'dispute_resolved';--> statement-breakpoint
ALTER TYPE "public"."notification_category" ADD VALUE 'listing_update';