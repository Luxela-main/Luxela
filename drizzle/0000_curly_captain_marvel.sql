ALTER TABLE "listings" DROP CONSTRAINT "listings_product_id_products_id_fk";
--> statement-breakpoint
ALTER TABLE "listings" ALTER COLUMN "product_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "listings" DROP COLUMN "stock";