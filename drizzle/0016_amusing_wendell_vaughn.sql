ALTER TABLE "brands" ALTER COLUMN "rating" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "collections" ADD COLUMN "sku" text;--> statement-breakpoint
ALTER TABLE "collections" ADD COLUMN "meta_description" text;--> statement-breakpoint
ALTER TABLE "collections" ADD COLUMN "barcode" text;--> statement-breakpoint
ALTER TABLE "collections" ADD COLUMN "video_url" text;--> statement-breakpoint
ALTER TABLE "collections" ADD COLUMN "care_instructions" text;