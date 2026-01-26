ALTER TABLE "seller_business" ADD COLUMN "verification_status" varchar(50) DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "seller_business" ADD COLUMN "verified_first_name" varchar(255);--> statement-breakpoint
ALTER TABLE "seller_business" ADD COLUMN "verified_last_name" varchar(255);--> statement-breakpoint
ALTER TABLE "seller_business" ADD COLUMN "verified_date_of_birth" varchar(20);--> statement-breakpoint
ALTER TABLE "seller_business" ADD COLUMN "verification_country" varchar(100);--> statement-breakpoint
ALTER TABLE "seller_business" ADD COLUMN "verification_date" timestamp;--> statement-breakpoint
ALTER TABLE "seller_business" ADD COLUMN "dojah_response" jsonb;