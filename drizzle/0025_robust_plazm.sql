ALTER TYPE "public"."payout_status" ADD VALUE 'refunded';--> statement-breakpoint
ALTER TABLE "buyers" ADD COLUMN "tsara_customer_id" varchar(255);--> statement-breakpoint
ALTER TABLE "buyers" ADD CONSTRAINT "buyers_tsara_customer_id_unique" UNIQUE("tsara_customer_id");