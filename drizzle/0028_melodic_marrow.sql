CREATE INDEX "idx_listings_status" ON "listings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_listings_type" ON "listings" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_listings_status_type" ON "listings" USING btree ("status","type");--> statement-breakpoint
CREATE INDEX "idx_listings_created_at" ON "listings" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_listings_product_id" ON "listings" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_product_images_product_id" ON "product_images" USING btree ("product_id");