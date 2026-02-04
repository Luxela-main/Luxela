ALTER TABLE "brands" DROP CONSTRAINT "brands_slug_unique";--> statement-breakpoint
ALTER TABLE "brands" ADD CONSTRAINT "brands_seller_id_slug_unique" UNIQUE("seller_id","slug");