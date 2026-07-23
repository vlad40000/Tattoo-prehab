CREATE TABLE "account_imports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"participant_id" uuid NOT NULL,
	"import_key" text NOT NULL,
	"sessions_imported" integer DEFAULT 0 NOT NULL,
	"checkins_imported" integer DEFAULT 0 NOT NULL,
	"imported_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "account_imports_session_count_bounds" CHECK ("account_imports"."sessions_imported" between 0 and 200),
	CONSTRAINT "account_imports_checkin_count_bounds" CHECK ("account_imports"."checkins_imported" between 0 and 200)
);
--> statement-breakpoint
ALTER TABLE "participants" ADD COLUMN "clerk_user_id" text;--> statement-breakpoint
ALTER TABLE "participants" ADD COLUMN "claimed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "account_imports" ADD CONSTRAINT "account_imports_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "account_imports_participant_key_uidx" ON "account_imports" USING btree ("participant_id","import_key");--> statement-breakpoint
CREATE INDEX "account_imports_participant_imported_idx" ON "account_imports" USING btree ("participant_id","imported_at");--> statement-breakpoint
CREATE UNIQUE INDEX "participants_clerk_user_uidx" ON "participants" USING btree ("clerk_user_id");