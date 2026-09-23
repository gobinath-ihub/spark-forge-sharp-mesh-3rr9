export { users } from 'lyzr-architect-pg/schema'

import {
  boolean,
  generateId,
  index,
  integer,
  jsonb,
  numeric,
  ownerUserId,
  pgTable,
  text,
  timestamp,
  timestamps,
  uniqueIndex,
} from 'lyzr-architect-pg/schema'

export const analyses = pgTable('analyses', {
  id: text('id').primaryKey().$defaultFn(generateId),
  title: text('title').notNull(),
  description: text('description'),
  industry: text('industry'),
  audience: text('audience'),
  status: text('status').notNull().default('draft'),
  source_text: text('source_text'),
  analysis_version: integer('analysis_version').notNull().default(1),
  last_analyzed_at: timestamp('last_analyzed_at', { withTimezone: true }),
  owner_user_id: ownerUserId(),
  ...timestamps,
}, (table) => [
  index('analyses_owner_idx').on(table.owner_user_id),
  index('analyses_status_idx').on(table.status),
  index('analyses_title_idx').on(table.title),
])

export const analysis_sources = pgTable('analysis_sources', {
  id: text('id').primaryKey().$defaultFn(generateId),
  analysis_id: text('analysis_id').notNull().references(() => analyses.id, { onDelete: 'cascade' }),
  source_type: text('source_type').notNull(),
  display_name: text('display_name').notNull(),
  asset_id: text('asset_id'),
  mime_type: text('mime_type'),
  file_size: integer('file_size'),
  upload_status: text('upload_status').notNull().default('pending'),
  owner_user_id: ownerUserId(),
  ...timestamps,
}, (table) => [
  index('analysis_sources_owner_idx').on(table.owner_user_id),
  index('analysis_sources_analysis_idx').on(table.analysis_id),
  index('analysis_sources_upload_status_idx').on(table.upload_status),
])

export const analysis_items = pgTable('analysis_items', {
  id: text('id').primaryKey().$defaultFn(generateId),
  analysis_id: text('analysis_id').notNull().references(() => analyses.id, { onDelete: 'cascade' }),
  item_key: text('item_key').notNull(),
  category: text('category'),
  title: text('title').notNull(),
  statement: text('statement').notNull(),
  rationale: text('rationale'),
  evidence_type: text('evidence_type'),
  priority: text('priority'),
  priority_rationale: text('priority_rationale'),
  confidence: numeric('confidence'),
  is_user_edited: boolean('is_user_edited').notNull().default(false),
  sort_order: integer('sort_order').notNull().default(0),
  owner_user_id: ownerUserId(),
  ...timestamps,
}, (table) => [
  index('analysis_items_owner_idx').on(table.owner_user_id),
  index('analysis_items_analysis_idx').on(table.analysis_id),
  uniqueIndex('analysis_items_analysis_key_idx').on(table.analysis_id, table.item_key),
  index('analysis_items_category_idx').on(table.analysis_id, table.category),
  index('analysis_items_priority_idx').on(table.analysis_id, table.priority),
  index('analysis_items_sort_idx').on(table.analysis_id, table.sort_order),
])

export const traceability_links = pgTable('traceability_links', {
  id: text('id').primaryKey().$defaultFn(generateId),
  analysis_id: text('analysis_id').notNull().references(() => analyses.id, { onDelete: 'cascade' }),
  from_item_id: text('from_item_id').notNull().references(() => analysis_items.id, { onDelete: 'cascade' }),
  to_item_id: text('to_item_id').notNull().references(() => analysis_items.id, { onDelete: 'cascade' }),
  link_type: text('link_type').notNull(),
  evidence_note: text('evidence_note'),
  is_inferred: boolean('is_inferred').notNull().default(false),
  owner_user_id: ownerUserId(),
  ...timestamps,
}, (table) => [
  index('traceability_links_owner_idx').on(table.owner_user_id),
  index('traceability_links_analysis_idx').on(table.analysis_id),
  index('traceability_links_from_idx').on(table.from_item_id),
  index('traceability_links_to_idx').on(table.to_item_id),
])

export const analysis_runs = pgTable('analysis_runs', {
  id: text('id').primaryKey().$defaultFn(generateId),
  analysis_id: text('analysis_id').notNull().references(() => analyses.id, { onDelete: 'cascade' }),
  run_type: text('run_type').notNull(),
  status: text('status').notNull().default('pending'),
  requested_sections: jsonb('requested_sections'),
  error_summary: text('error_summary'),
  started_at: timestamp('started_at', { withTimezone: true }),
  completed_at: timestamp('completed_at', { withTimezone: true }),
  owner_user_id: ownerUserId(),
  ...timestamps,
}, (table) => [
  index('analysis_runs_owner_idx').on(table.owner_user_id),
  index('analysis_runs_analysis_idx').on(table.analysis_id),
  index('analysis_runs_status_idx').on(table.status),
])
