ALTER TABLE "seller_business" ADD COLUMN "id_number" varchar(50);--> statement-breakpoint
ALTER TABLE "seller_business" ADD COLUMN "id_verified" boolean DEFAULT false NOT NULL;