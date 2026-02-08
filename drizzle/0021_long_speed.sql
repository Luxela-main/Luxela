CREATE TABLE "buyer_brand_follows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"buyer_id" uuid NOT NULL,
	"brand_id" uuid NOT NULL,
	"followed_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "buyer_brand_follows_unique" UNIQUE("buyer_id","brand_id")
);
--> statement-breakpoint
ALTER TABLE "buyer_brand_follows" ADD CONSTRAINT "buyer_brand_follows_buyer_id_buyers_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."buyers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buyer_brand_follows" ADD CONSTRAINT "buyer_brand_follows_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_buyer_brand_follows_buyer_id" ON "buyer_brand_follows" USING btree ("buyer_id");--> statement-breakpoint
CREATE INDEX "idx_buyer_brand_follows_brand_id" ON "buyer_brand_follows" USING btree ("brand_id");