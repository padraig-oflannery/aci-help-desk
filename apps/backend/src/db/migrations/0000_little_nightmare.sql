CREATE TYPE "public"."content_asset_role" AS ENUM('PRIMARY', 'THUMBNAIL', 'EMBED', 'ATTACHMENT', 'CAPTIONS', 'POSTER');--> statement-breakpoint
CREATE TYPE "public"."content_kind" AS ENUM('ARTICLE', 'VIDEO', 'DOCUMENT', 'TRAINING');--> statement-breakpoint
CREATE TYPE "public"."content_status" AS ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."content_visibility" AS ENUM('ALL_EMPLOYEES', 'ADMINS_ONLY');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('EMPLOYEE', 'ADMIN', 'SUPER_ADMIN');--> statement-breakpoint
CREATE TYPE "public"."training_assignment_status" AS ENUM('ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE', 'WAIVED', 'REVOKED');--> statement-breakpoint
CREATE TYPE "public"."training_completion_rule" AS ENUM('MANUAL_ACK', 'ALL_STEPS_VIEWED', 'ALL_STEPS_COMPLETED', 'MANUAL_COMPLETE');--> statement-breakpoint
CREATE TYPE "public"."ticket_message_type" AS ENUM('PUBLIC', 'INTERNAL', 'SYSTEM');--> statement-breakpoint
CREATE TYPE "public"."ticket_priority" AS ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT');--> statement-breakpoint
CREATE TYPE "public"."ticket_status" AS ENUM('OPEN', 'IN_PROGRESS', 'WAITING_ON_EMPLOYEE', 'RESOLVED', 'CLOSED');--> statement-breakpoint
CREATE TABLE "content_article_bodies" (
	"content_item_id" uuid PRIMARY KEY NOT NULL,
	"body_json" jsonb,
	"body_markdown" text NOT NULL,
	"body_plaintext" text,
	"schema_version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content_item_id" uuid NOT NULL,
	"storage_object_id" uuid NOT NULL,
	"asset_role" "content_asset_role" NOT NULL,
	"filename" text NOT NULL,
	"alt_text" text,
	"caption" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_document_text" (
	"content_item_id" uuid PRIMARY KEY NOT NULL,
	"extracted_text" text NOT NULL,
	"extracted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_item_tags" (
	"content_item_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "content_item_tags_content_item_id_tag_id_pk" PRIMARY KEY("content_item_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "content_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "content_kind" NOT NULL,
	"status" "content_status" DEFAULT 'DRAFT' NOT NULL,
	"visibility" "content_visibility" DEFAULT 'ALL_EMPLOYEES' NOT NULL,
	"title" text NOT NULL,
	"summary" text,
	"category_id" uuid,
	"created_by_user_id" uuid NOT NULL,
	"updated_by_user_id" uuid,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"search_text" text
);
--> statement-breakpoint
CREATE TABLE "content_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "user_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"refresh_token_hash" text NOT NULL,
	"device_label" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "user_role" DEFAULT 'EMPLOYEE' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "storage_objects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text DEFAULT 'cloudflare_r2' NOT NULL,
	"bucket" text NOT NULL,
	"object_key" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" bigint NOT NULL,
	"sha256" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "training_assignment_progress" (
	"assignment_id" uuid PRIMARY KEY NOT NULL,
	"status" "training_assignment_status" DEFAULT 'ASSIGNED' NOT NULL,
	"started_at" timestamp with time zone,
	"last_activity_at" timestamp with time zone,
	"first_viewed_at" timestamp with time zone,
	"acknowledged_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"progress_percent" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "training_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"training_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"assigned_by_user_id" uuid,
	"is_required" boolean DEFAULT true NOT NULL,
	"due_at" timestamp with time zone,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone,
	"waived_at" timestamp with time zone,
	"waived_by_user_id" uuid,
	"waive_reason" text
);
--> statement-breakpoint
CREATE TABLE "training_definitions" (
	"training_id" uuid PRIMARY KEY NOT NULL,
	"completion_rule" "training_completion_rule" DEFAULT 'MANUAL_ACK' NOT NULL,
	"estimated_minutes" integer,
	"version" integer DEFAULT 1 NOT NULL,
	"allow_downloads" boolean DEFAULT true NOT NULL,
	"require_acknowledgement" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "training_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assignment_id" uuid NOT NULL,
	"event_type" text NOT NULL,
	"event_at" timestamp with time zone DEFAULT now() NOT NULL,
	"actor_user_id" uuid,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "training_step_progress" (
	"assignment_id" uuid NOT NULL,
	"step_id" uuid NOT NULL,
	"first_viewed_at" timestamp with time zone,
	"last_viewed_at" timestamp with time zone,
	"acknowledged_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"time_spent_seconds" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "training_step_progress_assignment_id_step_id_pk" PRIMARY KEY("assignment_id","step_id")
);
--> statement-breakpoint
CREATE TABLE "training_steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"training_id" uuid NOT NULL,
	"step_index" integer NOT NULL,
	"content_item_id" uuid NOT NULL,
	"is_required" boolean DEFAULT true NOT NULL,
	"min_view_seconds" integer,
	"requires_ack" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ticket_attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"message_id" uuid,
	"storage_object_id" uuid NOT NULL,
	"filename" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ticket_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"author_user_id" uuid,
	"message_type" "ticket_message_type" DEFAULT 'PUBLIC' NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ticket_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"from_status" "ticket_status",
	"to_status" "ticket_status" NOT NULL,
	"changed_by_user_id" uuid,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"note" text
);
--> statement-breakpoint
CREATE TABLE "tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_number" serial NOT NULL,
	"requester_user_id" uuid NOT NULL,
	"assigned_to_user_id" uuid,
	"subject" text NOT NULL,
	"description" text NOT NULL,
	"status" "ticket_status" DEFAULT 'OPEN' NOT NULL,
	"priority" "ticket_priority" DEFAULT 'MEDIUM' NOT NULL,
	"category" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"closed_at" timestamp with time zone,
	CONSTRAINT "tickets_ticket_number_unique" UNIQUE("ticket_number")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"link" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"read_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "content_article_bodies" ADD CONSTRAINT "content_article_bodies_content_item_id_content_items_id_fk" FOREIGN KEY ("content_item_id") REFERENCES "public"."content_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_assets" ADD CONSTRAINT "content_assets_content_item_id_content_items_id_fk" FOREIGN KEY ("content_item_id") REFERENCES "public"."content_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_assets" ADD CONSTRAINT "content_assets_storage_object_id_storage_objects_id_fk" FOREIGN KEY ("storage_object_id") REFERENCES "public"."storage_objects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_document_text" ADD CONSTRAINT "content_document_text_content_item_id_content_items_id_fk" FOREIGN KEY ("content_item_id") REFERENCES "public"."content_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_item_tags" ADD CONSTRAINT "content_item_tags_content_item_id_content_items_id_fk" FOREIGN KEY ("content_item_id") REFERENCES "public"."content_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_item_tags" ADD CONSTRAINT "content_item_tags_tag_id_content_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."content_tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_items" ADD CONSTRAINT "content_items_category_id_content_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."content_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_items" ADD CONSTRAINT "content_items_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_items" ADD CONSTRAINT "content_items_updated_by_user_id_users_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_assignment_progress" ADD CONSTRAINT "training_assignment_progress_assignment_id_training_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."training_assignments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_assignments" ADD CONSTRAINT "training_assignments_training_id_content_items_id_fk" FOREIGN KEY ("training_id") REFERENCES "public"."content_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_assignments" ADD CONSTRAINT "training_assignments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_assignments" ADD CONSTRAINT "training_assignments_assigned_by_user_id_users_id_fk" FOREIGN KEY ("assigned_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_assignments" ADD CONSTRAINT "training_assignments_waived_by_user_id_users_id_fk" FOREIGN KEY ("waived_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_definitions" ADD CONSTRAINT "training_definitions_training_id_content_items_id_fk" FOREIGN KEY ("training_id") REFERENCES "public"."content_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_events" ADD CONSTRAINT "training_events_assignment_id_training_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."training_assignments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_events" ADD CONSTRAINT "training_events_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_step_progress" ADD CONSTRAINT "training_step_progress_assignment_id_training_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."training_assignments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_step_progress" ADD CONSTRAINT "training_step_progress_step_id_training_steps_id_fk" FOREIGN KEY ("step_id") REFERENCES "public"."training_steps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_steps" ADD CONSTRAINT "training_steps_training_id_content_items_id_fk" FOREIGN KEY ("training_id") REFERENCES "public"."content_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_steps" ADD CONSTRAINT "training_steps_content_item_id_content_items_id_fk" FOREIGN KEY ("content_item_id") REFERENCES "public"."content_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_attachments" ADD CONSTRAINT "ticket_attachments_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_attachments" ADD CONSTRAINT "ticket_attachments_message_id_ticket_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."ticket_messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_attachments" ADD CONSTRAINT "ticket_attachments_storage_object_id_storage_objects_id_fk" FOREIGN KEY ("storage_object_id") REFERENCES "public"."storage_objects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_messages" ADD CONSTRAINT "ticket_messages_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_messages" ADD CONSTRAINT "ticket_messages_author_user_id_users_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_status_history" ADD CONSTRAINT "ticket_status_history_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_status_history" ADD CONSTRAINT "ticket_status_history_changed_by_user_id_users_id_fk" FOREIGN KEY ("changed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_requester_user_id_users_id_fk" FOREIGN KEY ("requester_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_assigned_to_user_id_users_id_fk" FOREIGN KEY ("assigned_to_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "content_assets_item_role_idx" ON "content_assets" USING btree ("content_item_id","asset_role");--> statement-breakpoint
CREATE INDEX "content_assets_storage_object_idx" ON "content_assets" USING btree ("storage_object_id");--> statement-breakpoint
CREATE UNIQUE INDEX "content_categories_slug_unique_idx" ON "content_categories" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "content_item_tags_content_item_id_idx" ON "content_item_tags" USING btree ("content_item_id");--> statement-breakpoint
CREATE INDEX "content_item_tags_tag_id_idx" ON "content_item_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "content_items_kind_status_idx" ON "content_items" USING btree ("kind","status");--> statement-breakpoint
CREATE INDEX "content_items_category_id_idx" ON "content_items" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "content_items_created_by_idx" ON "content_items" USING btree ("created_by_user_id");--> statement-breakpoint
CREATE INDEX "content_items_published_at_idx" ON "content_items" USING btree ("published_at");--> statement-breakpoint
CREATE UNIQUE INDEX "content_tags_slug_unique_idx" ON "content_tags" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "password_reset_tokens_user_id_idx" ON "password_reset_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "password_reset_tokens_token_hash_idx" ON "password_reset_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "user_sessions_user_id_expires_idx" ON "user_sessions" USING btree ("user_id","expires_at");--> statement-breakpoint
CREATE INDEX "user_sessions_user_id_revoked_idx" ON "user_sessions" USING btree ("user_id","revoked_at");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE UNIQUE INDEX "storage_objects_bucket_key_unique_idx" ON "storage_objects" USING btree ("bucket","object_key");--> statement-breakpoint
CREATE INDEX "storage_objects_created_at_idx" ON "storage_objects" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "training_assignments_user_id_revoked_idx" ON "training_assignments" USING btree ("user_id","revoked_at");--> statement-breakpoint
CREATE INDEX "training_assignments_training_id_revoked_idx" ON "training_assignments" USING btree ("training_id","revoked_at");--> statement-breakpoint
CREATE INDEX "training_assignments_due_at_idx" ON "training_assignments" USING btree ("due_at");--> statement-breakpoint
CREATE INDEX "training_events_assignment_id_idx" ON "training_events" USING btree ("assignment_id");--> statement-breakpoint
CREATE INDEX "training_events_event_at_idx" ON "training_events" USING btree ("event_at");--> statement-breakpoint
CREATE INDEX "training_step_progress_assignment_id_idx" ON "training_step_progress" USING btree ("assignment_id");--> statement-breakpoint
CREATE INDEX "training_step_progress_step_id_idx" ON "training_step_progress" USING btree ("step_id");--> statement-breakpoint
CREATE UNIQUE INDEX "training_steps_training_step_unique_idx" ON "training_steps" USING btree ("training_id","step_index");--> statement-breakpoint
CREATE INDEX "training_steps_training_id_idx" ON "training_steps" USING btree ("training_id");--> statement-breakpoint
CREATE INDEX "training_steps_content_item_id_idx" ON "training_steps" USING btree ("content_item_id");--> statement-breakpoint
CREATE INDEX "ticket_attachments_ticket_id_idx" ON "ticket_attachments" USING btree ("ticket_id");--> statement-breakpoint
CREATE INDEX "ticket_attachments_message_id_idx" ON "ticket_attachments" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "ticket_messages_ticket_created_at_idx" ON "ticket_messages" USING btree ("ticket_id","created_at");--> statement-breakpoint
CREATE INDEX "ticket_status_history_ticket_id_idx" ON "ticket_status_history" USING btree ("ticket_id");--> statement-breakpoint
CREATE INDEX "ticket_status_history_changed_at_idx" ON "ticket_status_history" USING btree ("changed_at");--> statement-breakpoint
CREATE INDEX "tickets_ticket_number_idx" ON "tickets" USING btree ("ticket_number");--> statement-breakpoint
CREATE INDEX "tickets_status_priority_idx" ON "tickets" USING btree ("status","priority");--> statement-breakpoint
CREATE INDEX "tickets_assigned_to_status_idx" ON "tickets" USING btree ("assigned_to_user_id","status");--> statement-breakpoint
CREATE INDEX "tickets_requester_status_idx" ON "tickets" USING btree ("requester_user_id","status");--> statement-breakpoint
CREATE INDEX "notifications_user_id_read_at_idx" ON "notifications" USING btree ("user_id","read_at");--> statement-breakpoint
CREATE INDEX "notifications_user_id_created_at_idx" ON "notifications" USING btree ("user_id","created_at");