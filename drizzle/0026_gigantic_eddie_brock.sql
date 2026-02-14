ALTER TABLE "cart_items" ADD COLUMN "selected_size" text;--> statement-breakpoint
ALTER TABLE "cart_items" ADD COLUMN "selected_color" text;--> statement-breakpoint
ALTER TABLE "cart_items" ADD COLUMN "selected_color_hex" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "selected_size" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "selected_color" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "selected_color_hex" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "quantity" integer DEFAULT 1 NOT NULL;