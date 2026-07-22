CREATE TYPE "public"."session_source" AS ENUM('routine', 'strength', 'minimum');--> statement-breakpoint
CREATE TYPE "public"."traffic_light" AS ENUM('green', 'yellow', 'red');--> statement-breakpoint
CREATE TABLE "participant_preferences" (
	"participant_id" uuid PRIMARY KEY NOT NULL,
	"current_week" integer DEFAULT 1 NOT NULL,
	"reduced_motion" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "participants" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "practice_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"participant_id" uuid NOT NULL,
	"idempotency_key" text NOT NULL,
	"source_type" "session_source" NOT NULL,
	"source_id" text NOT NULL,
	"source_label" text NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"completed_at" timestamp with time zone NOT NULL,
	"duration_seconds" integer NOT NULL,
	"traffic_light" "traffic_light" NOT NULL,
	"pain_before" integer,
	"pain_after" integer,
	"notes" text,
	"items" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "practice_sessions_duration_bounds" CHECK ("practice_sessions"."duration_seconds" between 0 and 14400),
	CONSTRAINT "practice_sessions_pain_before_bounds" CHECK ("practice_sessions"."pain_before" is null or "practice_sessions"."pain_before" between 0 and 10),
	CONSTRAINT "practice_sessions_pain_after_bounds" CHECK ("practice_sessions"."pain_after" is null or "practice_sessions"."pain_after" between 0 and 10)
);
--> statement-breakpoint
CREATE TABLE "symptom_checkins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"participant_id" uuid NOT NULL,
	"idempotency_key" text NOT NULL,
	"zone" "traffic_light" NOT NULL,
	"symptom_id" text,
	"discomfort" integer,
	"note" text,
	"occurred_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "symptom_checkins_discomfort_bounds" CHECK ("symptom_checkins"."discomfort" is null or "symptom_checkins"."discomfort" between 0 and 10)
);
--> statement-breakpoint
ALTER TABLE "participant_preferences" ADD CONSTRAINT "participant_preferences_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_sessions" ADD CONSTRAINT "practice_sessions_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "symptom_checkins" ADD CONSTRAINT "symptom_checkins_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "practice_sessions_participant_idempotency_uidx" ON "practice_sessions" USING btree ("participant_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "practice_sessions_participant_completed_idx" ON "practice_sessions" USING btree ("participant_id","completed_at");--> statement-breakpoint
CREATE INDEX "practice_sessions_source_idx" ON "practice_sessions" USING btree ("source_type","source_id");--> statement-breakpoint
CREATE UNIQUE INDEX "symptom_checkins_participant_idempotency_uidx" ON "symptom_checkins" USING btree ("participant_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "symptom_checkins_participant_occurred_idx" ON "symptom_checkins" USING btree ("participant_id","occurred_at");