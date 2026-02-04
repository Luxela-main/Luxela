-- Drop the old seller_payment table
DROP TABLE IF EXISTS "seller_payment" CASCADE;

-- Create seller_payment_config table (payout preferences)
CREATE TABLE "seller_payment_config" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "seller_id" uuid NOT NULL UNIQUE,
  "preferred_payout_method" preferred_payout_method NOT NULL,
  "payout_schedule" payout_schedule DEFAULT 'weekly' NOT NULL,
  "minimum_payout_threshold" numeric(15, 2) DEFAULT '0' NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  FOREIGN KEY ("seller_id") REFERENCES "sellers"("id") ON DELETE CASCADE
);

-- Create seller_payout_methods table (fiat and digital payment methods)
CREATE TABLE "seller_payout_methods" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "seller_id" uuid NOT NULL,
  "method_type" fiat_payout_method NOT NULL,
  "is_default" boolean DEFAULT false NOT NULL,
  "is_verified" boolean DEFAULT false NOT NULL,
  "verification_token" varchar(255),
  
  -- Bank Transfer Details
  "bank_country" varchar(100),
  "bank_name" varchar(255),
  "bank_code" varchar(100),
  "account_holder_name" varchar(255),
  "account_number" varchar(255),
  "account_type" varchar(50),
  "swift_code" varchar(50),
  "iban" varchar(50),
  
  -- Digital Payment Service Details
  "email" varchar(255),
  "account_id" varchar(255),
  
  -- Mobile Money Details
  "phone_number" varchar(50),
  "mobile_money_provider" varchar(100),
  
  -- Metadata
  "metadata" jsonb,
  "last_used_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  
  FOREIGN KEY ("seller_id") REFERENCES "sellers"("id") ON DELETE CASCADE
);

-- Create seller_crypto_payout_methods table (cryptocurrency wallets)
CREATE TABLE "seller_crypto_payout_methods" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "seller_id" uuid NOT NULL,
  "wallet_type" wallet_type NOT NULL,
  "blockchain_network" varchar(100) NOT NULL,
  "wallet_address" varchar(255) NOT NULL,
  "payout_token" payout_token NOT NULL,
  "is_default" boolean DEFAULT false NOT NULL,
  "is_verified" boolean DEFAULT false NOT NULL,
  "verification_signature" text,
  "last_used_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  
  FOREIGN KEY ("seller_id") REFERENCES "sellers"("id") ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX "seller_payment_config_seller_id_idx" ON "seller_payment_config"("seller_id");
CREATE INDEX "seller_payout_methods_seller_id_idx" ON "seller_payout_methods"("seller_id");
CREATE INDEX "seller_payout_methods_is_verified_idx" ON "seller_payout_methods"("is_verified");
CREATE INDEX "seller_payout_methods_is_default_idx" ON "seller_payout_methods"("is_default");
CREATE INDEX "seller_crypto_payout_methods_seller_id_idx" ON "seller_crypto_payout_methods"("seller_id");
CREATE INDEX "seller_crypto_payout_methods_is_verified_idx" ON "seller_crypto_payout_methods"("is_verified");
CREATE INDEX "seller_crypto_payout_methods_is_default_idx" ON "seller_crypto_payout_methods"("is_default");