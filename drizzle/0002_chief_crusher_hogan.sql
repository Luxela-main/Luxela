ALTER TABLE "notifications" DROP CONSTRAINT "notifications_buyer_id_buyers_id_fk";
--> statement-breakpoint
ALTER TABLE "notifications" ALTER COLUMN "seller_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" DROP COLUMN "buyer_id";