CREATE INDEX "idx_buyer_account_details_buyer_id" ON "buyer_account_details" USING btree ("buyer_id");--> statement-breakpoint
CREATE INDEX "idx_seller_business_seller_id" ON "seller_business" USING btree ("seller_id");--> statement-breakpoint
CREATE INDEX "idx_sellers_user_id" ON "sellers" USING btree ("user_id");