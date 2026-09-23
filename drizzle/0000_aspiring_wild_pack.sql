CREATE TABLE "analyses" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"industry" text,
	"audience" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"source_text" text,
	"analysis_version" integer DEFAULT 1 NOT NULL,
	"last_analyzed_at" timestamp with time zone,
	"owner_user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analysis_items" (
	"id" text PRIMARY KEY NOT NULL,
	"analysis_id" text NOT NULL,
	"item_key" text NOT NULL,
	"category" text,
	"title" text NOT NULL,
	"statement" text NOT NULL,
	"rationale" text,
	"evidence_type" text,
	"priority" text,
	"priority_rationale" text,
	"confidence" numeric,
	"is_user_edited" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"owner_user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analysis_runs" (
	"id" text PRIMARY KEY NOT NULL,
	"analysis_id" text NOT NULL,
	"run_type" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"requested_sections" jsonb,
	"error_summary" text,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"owner_user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analysis_sources" (
	"id" text PRIMARY KEY NOT NULL,
	"analysis_id" text NOT NULL,
	"source_type" text NOT NULL,
	"display_name" text NOT NULL,
	"asset_id" text,
	"mime_type" text,
	"file_size" integer,
	"upload_status" text DEFAULT 'pending' NOT NULL,
	"owner_user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "traceability_links" (
	"id" text PRIMARY KEY NOT NULL,
	"analysis_id" text NOT NULL,
	"from_item_id" text NOT NULL,
	"to_item_id" text NOT NULL,
	"link_type" text NOT NULL,
	"evidence_note" text,
	"is_inferred" boolean DEFAULT false NOT NULL,
	"owner_user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "_users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "analysis_items" ADD CONSTRAINT "analysis_items_analysis_id_analyses_id_fk" FOREIGN KEY ("analysis_id") REFERENCES "public"."analyses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analysis_runs" ADD CONSTRAINT "analysis_runs_analysis_id_analyses_id_fk" FOREIGN KEY ("analysis_id") REFERENCES "public"."analyses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analysis_sources" ADD CONSTRAINT "analysis_sources_analysis_id_analyses_id_fk" FOREIGN KEY ("analysis_id") REFERENCES "public"."analyses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "traceability_links" ADD CONSTRAINT "traceability_links_analysis_id_analyses_id_fk" FOREIGN KEY ("analysis_id") REFERENCES "public"."analyses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "traceability_links" ADD CONSTRAINT "traceability_links_from_item_id_analysis_items_id_fk" FOREIGN KEY ("from_item_id") REFERENCES "public"."analysis_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "traceability_links" ADD CONSTRAINT "traceability_links_to_item_id_analysis_items_id_fk" FOREIGN KEY ("to_item_id") REFERENCES "public"."analysis_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "analyses_owner_idx" ON "analyses" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "analyses_status_idx" ON "analyses" USING btree ("status");--> statement-breakpoint
CREATE INDEX "analyses_title_idx" ON "analyses" USING btree ("title");--> statement-breakpoint
CREATE INDEX "analysis_items_owner_idx" ON "analysis_items" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "analysis_items_analysis_idx" ON "analysis_items" USING btree ("analysis_id");--> statement-breakpoint
CREATE UNIQUE INDEX "analysis_items_analysis_key_idx" ON "analysis_items" USING btree ("analysis_id","item_key");--> statement-breakpoint
CREATE INDEX "analysis_items_category_idx" ON "analysis_items" USING btree ("analysis_id","category");--> statement-breakpoint
CREATE INDEX "analysis_items_priority_idx" ON "analysis_items" USING btree ("analysis_id","priority");--> statement-breakpoint
CREATE INDEX "analysis_items_sort_idx" ON "analysis_items" USING btree ("analysis_id","sort_order");--> statement-breakpoint
CREATE INDEX "analysis_runs_owner_idx" ON "analysis_runs" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "analysis_runs_analysis_idx" ON "analysis_runs" USING btree ("analysis_id");--> statement-breakpoint
CREATE INDEX "analysis_runs_status_idx" ON "analysis_runs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "analysis_sources_owner_idx" ON "analysis_sources" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "analysis_sources_analysis_idx" ON "analysis_sources" USING btree ("analysis_id");--> statement-breakpoint
CREATE INDEX "analysis_sources_upload_status_idx" ON "analysis_sources" USING btree ("upload_status");--> statement-breakpoint
CREATE INDEX "traceability_links_owner_idx" ON "traceability_links" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "traceability_links_analysis_idx" ON "traceability_links" USING btree ("analysis_id");--> statement-breakpoint
CREATE INDEX "traceability_links_from_idx" ON "traceability_links" USING btree ("from_item_id");--> statement-breakpoint
CREATE INDEX "traceability_links_to_idx" ON "traceability_links" USING btree ("to_item_id");--> statement-breakpoint
CREATE UNIQUE INDEX "_users_email_unique" ON "_users" USING btree ("email");