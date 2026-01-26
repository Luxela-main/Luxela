ALTER TABLE "buyer_account_details" ADD COLUMN "order_updates" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "buyer_account_details" ADD COLUMN "promotional_emails" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "buyer_account_details" ADD COLUMN "security_alerts" boolean DEFAULT true NOT NULL;