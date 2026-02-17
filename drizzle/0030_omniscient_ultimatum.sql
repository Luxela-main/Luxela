CREATE INDEX "idx_brands_seller_id" ON "brands" USING btree ("seller_id");--> statement-breakpoint
CREATE INDEX "idx_brands_rating" ON "brands" USING btree ("rating");--> statement-breakpoint
CREATE INDEX "idx_brands_created_at" ON "brands" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_brands_total_products" ON "brands" USING btree ("total_products");--> statement-breakpoint
CREATE INDEX "idx_buyer_favorites_buyer_id" ON "buyer_favorites" USING btree ("buyer_id");--> statement-breakpoint
CREATE INDEX "idx_buyer_favorites_listing_id" ON "buyer_favorites" USING btree ("listing_id");--> statement-breakpoint
ALTER TABLE "buyer_favorites" ADD CONSTRAINT "buyer_favorites_unique" UNIQUE("buyer_id","listing_id");