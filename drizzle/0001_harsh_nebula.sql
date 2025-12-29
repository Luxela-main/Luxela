ALTER TABLE "seller_payment" ALTER COLUMN "preferred_payout_method" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "seller_shipping" ALTER COLUMN "refund_period" DROP NOT NULL;