CREATE TYPE "public"."audit_action" AS ENUM('create', 'update', 'delete', 'login', 'logout', 'password_change', 'role_change');--> statement-breakpoint
CREATE TYPE "public"."audit_entity" AS ENUM('user', 'order', 'payment', 'refund', 'listing', 'brand', 'buyer', 'seller');--> statement-breakpoint
CREATE TYPE "public"."audit_outcome" AS ENUM('success', 'failure');--> statement-breakpoint
CREATE TYPE "public"."discount_status" AS ENUM('active', 'inactive', 'expired');--> statement-breakpoint
CREATE TYPE "public"."discount_type" AS ENUM('percentage', 'fixed_amount', 'buy_one_get_one', 'free_shipping');--> statement-breakpoint
CREATE TYPE "public"."dispute_resolution" AS ENUM('refund_issued', 'case_closed', 'buyer_compensated', 'seller_warning');--> statement-breakpoint
CREATE TYPE "public"."dispute_status" AS ENUM('open', 'under_review', 'resolved', 'closed');--> statement-breakpoint
CREATE TYPE "public"."escalation_status" AS ENUM('pending', 'triggered', 'resolved', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."inventory_adjustment_reason" AS ENUM('stock_take', 'damaged_goods', 'lost_items', 'theft', 'supplier_return', 'other');--> statement-breakpoint
CREATE TYPE "public"."payment_channel" AS ENUM('web', 'mobile', 'api', 'pos');--> statement-breakpoint
CREATE TYPE "public"."payment_frequency" AS ENUM('weekly', 'bi_weekly', 'monthly', 'quarterly');--> statement-breakpoint
CREATE TYPE "public"."payout_schedule" AS ENUM('immediate', 'daily', 'weekly', 'bi_weekly', 'monthly');--> statement-breakpoint
CREATE TYPE "public"."roles_in_org" AS ENUM('member', 'manager', 'admin', 'owner');--> statement-breakpoint
CREATE TYPE "public"."settlement_status" AS ENUM('pending', 'completed', 'failed', 'in_review');--> statement-breakpoint
CREATE TYPE "public"."sla_priority" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."transaction_status" AS ENUM('pending', 'completed', 'failed', 'reversed');--> statement-breakpoint
CREATE TABLE "escalation_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"trigger" varchar(100) NOT NULL,
	"trigger_value" varchar(255),
	"action" varchar(100) NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sla_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"policy_name" varchar(255) NOT NULL,
	"priority" "sla_priority" NOT NULL,
	"response_time_minutes" integer NOT NULL,
	"resolution_time_minutes" integer NOT NULL,
	"working_hours_only" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sla_tracking" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"sla_metric_id" uuid NOT NULL,
	"response_deadline" timestamp NOT NULL,
	"resolution_deadline" timestamp NOT NULL,
	"response_breached" boolean DEFAULT false NOT NULL,
	"resolution_breached" boolean DEFAULT false NOT NULL,
	"breach_notification_sent_at" timestamp,
	"actual_response_time" integer,
	"actual_resolution_time" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_analytics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" timestamp NOT NULL,
	"total_tickets_created" integer DEFAULT 0,
	"total_tickets_resolved" integer DEFAULT 0,
	"total_tickets_open" integer DEFAULT 0,
	"average_response_time" integer,
	"average_resolution_time" integer,
	"sla_breach_count" integer DEFAULT 0,
	"customer_satisfaction_score" numeric(3, 2),
	"agent_utilization" numeric(5, 2),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid,
	"action_type" varchar(100) NOT NULL,
	"performed_by" uuid NOT NULL,
	"performed_by_role" varchar(50) NOT NULL,
	"old_value" text,
	"new_value" text,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_team_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"role" varchar(100) NOT NULL,
	"department" varchar(100),
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"max_capacity" integer DEFAULT 10 NOT NULL,
	"current_load_count" integer DEFAULT 0 NOT NULL,
	"response_time_average" integer,
	"resolution_rate" numeric(5, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "support_team_members_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "sla_tracking" ADD CONSTRAINT "sla_tracking_ticket_id_support_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."support_tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sla_tracking" ADD CONSTRAINT "sla_tracking_sla_metric_id_sla_metrics_id_fk" FOREIGN KEY ("sla_metric_id") REFERENCES "public"."sla_metrics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_audit_logs" ADD CONSTRAINT "support_audit_logs_ticket_id_support_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."support_tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buyer_account_details" ADD CONSTRAINT "buyer_account_details_buyer_id_unique" UNIQUE("buyer_id");--> statement-breakpoint
ALTER TABLE "buyer_account_details" ADD CONSTRAINT "buyer_account_details_email_unique" UNIQUE("email");--> statement-breakpoint
ALTER TABLE "buyers" ADD CONSTRAINT "buyers_user_id_unique" UNIQUE("user_id");