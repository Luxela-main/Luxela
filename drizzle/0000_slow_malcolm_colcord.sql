CREATE TYPE "public"."business_type" AS ENUM('individual', 'business');--> statement-breakpoint
CREATE TYPE "public"."delivery_status" AS ENUM('not_shipped', 'in_transit', 'delivered');--> statement-breakpoint
CREATE TYPE "public"."fiat_payout_method" AS ENUM('bank', 'paypal', 'stripe', 'flutterwave');--> statement-breakpoint
CREATE TYPE "public"."id_type" AS ENUM('passport', 'drivers_license', 'voters_card', 'national_id');--> statement-breakpoint
CREATE TYPE "public"."limited_badge" AS ENUM('show_badge', 'do_not_show');--> statement-breakpoint
CREATE TYPE "public"."listing_type" AS ENUM('single', 'collection');--> statement-breakpoint
CREATE TYPE "public"."local_pricing" AS ENUM('fiat', 'cryptocurrency');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('processing', 'shipped', 'delivered', 'canceled', 'returned');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('card', 'bank_transfer', 'paypal', 'stripe', 'flutterwave', 'crypto');--> statement-breakpoint
CREATE TYPE "public"."payout_status" AS ENUM('in_escrow', 'processing', 'paid');--> statement-breakpoint
CREATE TYPE "public"."payout_token" AS ENUM('USDT', 'USDC', 'solana');--> statement-breakpoint
CREATE TYPE "public"."preferred_payout_method" AS ENUM('fiat_currency', 'cryptocurrency', 'both');--> statement-breakpoint
CREATE TYPE "public"."product_category" AS ENUM('men_clothing', 'women_clothing', 'men_shoes', 'women_shoes', 'accessories', 'merch', 'others');--> statement-breakpoint
CREATE TYPE "public"."refund_policy" AS ENUM('no_refunds', 'accept_refunds');--> statement-breakpoint
CREATE TYPE "public"."roles" AS ENUM('buyer', 'seller', 'ADMIN');--> statement-breakpoint
CREATE TYPE "public"."shipping_eta" AS ENUM('48hrs', '72hrs', '5_working_days', '1week');--> statement-breakpoint
CREATE TYPE "public"."shipping_option" AS ENUM('local', 'international', 'both');--> statement-breakpoint
CREATE TYPE "public"."shipping_type" AS ENUM('domestic');--> statement-breakpoint
CREATE TYPE "public"."supply_capacity" AS ENUM('no_max', 'limited');--> statement-breakpoint
CREATE TYPE "public"."target_audience" AS ENUM('male', 'female', 'unisex');--> statement-breakpoint
CREATE TYPE "public"."wallet_type" AS ENUM('phantom', 'solflare', 'backpack', 'wallet_connect');--> statement-breakpoint
CREATE TABLE "buyer_shipping" (
	"id" uuid PRIMARY KEY NOT NULL,
	"buyer_id" uuid NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone_number" varchar(50) NOT NULL,
	"state" varchar(100) NOT NULL,
	"city" varchar(100) NOT NULL,
	"address" text NOT NULL,
	"postal_code" varchar(32) NOT NULL,
	"is_default" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "buyers" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cart_items" (
	"id" uuid PRIMARY KEY NOT NULL,
	"cart_id" uuid NOT NULL,
	"listing_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price_cents" integer NOT NULL,
	"currency" varchar(16) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "carts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"buyer_id" uuid NOT NULL,
	"discount_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discounts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"code" varchar(64) NOT NULL,
	"percent_off" integer,
	"amount_off_cents" integer,
	"active" boolean DEFAULT true NOT NULL,
	"expires_at" timestamp,
	CONSTRAINT "discounts_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "listings" (
	"id" uuid PRIMARY KEY NOT NULL,
	"seller_id" uuid NOT NULL,
	"type" "listing_type" NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"category" "product_category",
	"image" text,
	"price_cents" integer,
	"currency" varchar(16),
	"sizes_json" text,
	"supply_capacity" "supply_capacity",
	"quantity_available" integer,
	"limited_edition_badge" "limited_badge",
	"release_duration" varchar(64),
	"material_composition" text,
	"colors_available" text,
	"additional_target_audience" "target_audience",
	"shipping_option" "shipping_option",
	"eta_domestic" "shipping_eta",
	"eta_international" "shipping_eta",
	"items_json" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY NOT NULL,
	"seller_id" uuid NOT NULL,
	"listing_id" uuid NOT NULL,
	"product_title" varchar(255) NOT NULL,
	"product_category" "product_category" NOT NULL,
	"customer_name" varchar(255) NOT NULL,
	"customer_email" varchar(255) NOT NULL,
	"order_date" timestamp DEFAULT now() NOT NULL,
	"payment_method" "payment_method" NOT NULL,
	"amount_cents" integer NOT NULL,
	"currency" varchar(16) NOT NULL,
	"payout_status" "payout_status" DEFAULT 'in_escrow' NOT NULL,
	"delivery_status" "delivery_status" DEFAULT 'not_shipped' NOT NULL,
	"order_status" "order_status" DEFAULT 'processing' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seller_additional" (
	"id" uuid PRIMARY KEY NOT NULL,
	"seller_id" uuid NOT NULL,
	"product_category" "product_category" NOT NULL,
	"target_audience" "target_audience" NOT NULL,
	"local_pricing" "local_pricing" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seller_business" (
	"id" uuid PRIMARY KEY NOT NULL,
	"seller_id" uuid NOT NULL,
	"brand_name" varchar(255) NOT NULL,
	"business_type" "business_type" NOT NULL,
	"business_address" text NOT NULL,
	"official_email" varchar(255) NOT NULL,
	"phone_number" varchar(50) NOT NULL,
	"country" varchar(100) NOT NULL,
	"social_media" text,
	"full_name" varchar(255) NOT NULL,
	"id_type" "id_type" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seller_payment" (
	"id" uuid PRIMARY KEY NOT NULL,
	"seller_id" uuid NOT NULL,
	"preferred_payout_method" "preferred_payout_method" NOT NULL,
	"fiat_payout_method" "fiat_payout_method",
	"bank_country" varchar(100),
	"account_holder_name" varchar(255),
	"account_number" varchar(50),
	"wallet_type" "wallet_type",
	"wallet_address" varchar(255),
	"preferred_payout_token" "payout_token",
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seller_shipping" (
	"id" uuid PRIMARY KEY NOT NULL,
	"seller_id" uuid NOT NULL,
	"shipping_zone" varchar(255) NOT NULL,
	"city" varchar(255) NOT NULL,
	"shipping_address" text NOT NULL,
	"return_address" text NOT NULL,
	"shipping_type" "shipping_type" NOT NULL,
	"estimated_shipping_time" "shipping_eta" NOT NULL,
	"refund_policy" "refund_policy" NOT NULL,
	"refund_period" "shipping_eta" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sellers" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"oauth_id" varchar(255),
	"name" varchar(255),
	"display_name" varchar(255),
	"email" varchar(255) NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" "roles" DEFAULT 'buyer' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "buyer_shipping" ADD CONSTRAINT "buyer_shipping_buyer_id_buyers_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."buyers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buyers" ADD CONSTRAINT "buyers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_id_carts_id_fk" FOREIGN KEY ("cart_id") REFERENCES "public"."carts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "carts" ADD CONSTRAINT "carts_buyer_id_buyers_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."buyers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "carts" ADD CONSTRAINT "carts_discount_id_discounts_id_fk" FOREIGN KEY ("discount_id") REFERENCES "public"."discounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_additional" ADD CONSTRAINT "seller_additional_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_business" ADD CONSTRAINT "seller_business_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_payment" ADD CONSTRAINT "seller_payment_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_shipping" ADD CONSTRAINT "seller_shipping_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sellers" ADD CONSTRAINT "sellers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;