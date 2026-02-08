CREATE TABLE "admin_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"setting_key" varchar(255) NOT NULL,
	"setting_value" jsonb NOT NULL,
	"description" text,
	"category" varchar(100) NOT NULL,
	"updated_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admin_settings_setting_key_unique" UNIQUE("setting_key")
);
--> statement-breakpoint
CREATE INDEX "admin_settings_category_idx" ON "admin_settings" USING btree ("category");--> statement-breakpoint
CREATE INDEX "admin_settings_setting_key_idx" ON "admin_settings" USING btree ("setting_key");