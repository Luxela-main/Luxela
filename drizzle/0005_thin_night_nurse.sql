CREATE TABLE "scheduled_payouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seller_id" uuid NOT NULL,
	"amount_cents" integer NOT NULL,
	"currency" varchar(16) DEFAULT 'NGN' NOT NULL,
	"payout_method_id" varchar(255) NOT NULL,
	"schedule" "payout_schedule" NOT NULL,
	"scheduled_date" timestamp,
	"frequency" varchar(50),
	"status" varchar(32) DEFAULT 'pending' NOT NULL,
	"last_processed_at" timestamp,
	"next_scheduled_at" timestamp,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sellers" ADD COLUMN "payout_methods" text;--> statement-breakpoint
ALTER TABLE "scheduled_payouts" ADD CONSTRAINT "scheduled_payouts_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE cascade ON UPDATE no action;