ALTER TYPE "public"."fiat_payout_method" ADD VALUE 'wise' BEFORE 'other';--> statement-breakpoint
ALTER TABLE "collections" DROP COLUMN "sku";--> statement-breakpoint
ALTER TABLE "collections" DROP COLUMN "meta_description";--> statement-breakpoint
ALTER TABLE "collections" DROP COLUMN "barcode";--> statement-breakpoint
ALTER TABLE "collections" DROP COLUMN "video_url";--> statement-breakpoint
ALTER TABLE "collections" DROP COLUMN "care_instructions";