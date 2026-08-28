CREATE TYPE "public"."domain_status" AS ENUM('active', 'archived');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('running', 'success', 'failed');--> statement-breakpoint
CREATE TYPE "public"."notification_status" AS ENUM('sent', 'failed');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TABLE "domains" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" integer NOT NULL,
	"name" varchar(253) NOT NULL,
	"registrar" varchar(160),
	"expiry_date" date NOT NULL,
	"renew_url" text,
	"note" text,
	"notify_days" integer DEFAULT 30 NOT NULL,
	"status" "domain_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_name" varchar(80) NOT NULL,
	"status" "job_status" NOT NULL,
	"scanned_count" integer DEFAULT 0 NOT NULL,
	"notified_count" integer DEFAULT 0 NOT NULL,
	"failed_count" integer DEFAULT 0 NOT NULL,
	"error_message" text,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "notification_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"domain_id" uuid NOT NULL,
	"owner_id" integer NOT NULL,
	"type" varchar(32) NOT NULL,
	"target_date" date NOT NULL,
	"status" "notification_status" NOT NULL,
	"error_message" text,
	"telegram_message_id" varchar(64),
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"open_id" varchar(128) NOT NULL,
	"name" text,
	"email" varchar(320),
	"login_method" varchar(64),
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_signed_in" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_open_id_unique" UNIQUE("open_id")
);
--> statement-breakpoint
ALTER TABLE "domains" ADD CONSTRAINT "domains_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_domain_id_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "domains_owner_status_idx" ON "domains" USING btree ("owner_id","status");--> statement-breakpoint
CREATE INDEX "domains_expiry_idx" ON "domains" USING btree ("expiry_date");--> statement-breakpoint
CREATE INDEX "job_runs_job_time_idx" ON "job_runs" USING btree ("job_name","started_at");--> statement-breakpoint
CREATE UNIQUE INDEX "notification_dedupe_idx" ON "notification_logs" USING btree ("domain_id","type","target_date");--> statement-breakpoint
CREATE INDEX "notification_owner_idx" ON "notification_logs" USING btree ("owner_id","sent_at");