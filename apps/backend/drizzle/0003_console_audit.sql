CREATE TABLE "console_audit" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"username" varchar(64) NOT NULL,
	"command" text NOT NULL,
	"status" varchar(24) NOT NULL,
	"risk" varchar(20) NOT NULL,
	"output_preview" text,
	"duration_ms" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "console_audit" ADD CONSTRAINT "console_audit_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
