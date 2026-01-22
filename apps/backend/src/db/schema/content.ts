/**
 * Content Schema
 * 
 * Unified content model for articles, videos, documents, and trainings.
 * Replaces the previous KB (knowledge base) schema.
 */

import { pgTable, pgEnum, uuid, text, timestamp, index, uniqueIndex, primaryKey, jsonb, integer } from 'drizzle-orm/pg-core';
import { users } from './users';
import { storageObjects } from './storage';

// ============================================
// Enums
// ============================================

export const contentKindEnum = pgEnum('content_kind', ['ARTICLE', 'VIDEO', 'DOCUMENT', 'TRAINING']);
export const contentStatusEnum = pgEnum('content_status', ['DRAFT', 'PUBLISHED', 'ARCHIVED']);
export const contentVisibilityEnum = pgEnum('content_visibility', ['ALL_EMPLOYEES', 'ADMINS_ONLY']);

// Asset role enum for type-safe asset role values
export const contentAssetRoleEnum = pgEnum('content_asset_role', [
    'PRIMARY',      // main file for VIDEO/DOCUMENT (or hero image)
    'THUMBNAIL',    // preview image
    'EMBED',        // inline usage in article bodyJson
    'ATTACHMENT',   // downloadable attachment
    'CAPTIONS',     // subtitle file for video
    'POSTER',       // poster image for embedded video
]);

// ============================================
// Content Categories Table
// ============================================

export const contentCategories = pgTable('content_categories', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    slugUniqueIdx: uniqueIndex('content_categories_slug_unique_idx').on(table.slug),
}));

// ============================================
// Content Tags Table
// ============================================

export const contentTags = pgTable('content_tags', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    slugUniqueIdx: uniqueIndex('content_tags_slug_unique_idx').on(table.slug),
}));

// ============================================
// Content Items Table
// ============================================

export const contentItems = pgTable('content_items', {
    id: uuid('id').primaryKey().defaultRandom(),
    kind: contentKindEnum('kind').notNull(),
    status: contentStatusEnum('status').notNull().default('DRAFT'),
    visibility: contentVisibilityEnum('visibility').notNull().default('ALL_EMPLOYEES'),
    title: text('title').notNull(),
    summary: text('summary'),
    categoryId: uuid('category_id').references(() => contentCategories.id, { onDelete: 'set null' }),
    createdByUserId: uuid('created_by_user_id').notNull().references(() => users.id),
    updatedByUserId: uuid('updated_by_user_id').references(() => users.id),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    // Search fields
    searchText: text('search_text'),
    // Note: search_vector (tsvector) would be added via raw SQL migration for FTS
}, (table) => ({
    kindStatusIdx: index('content_items_kind_status_idx').on(table.kind, table.status),
    categoryIdIdx: index('content_items_category_id_idx').on(table.categoryId),
    createdByIdx: index('content_items_created_by_idx').on(table.createdByUserId),
    publishedAtIdx: index('content_items_published_at_idx').on(table.publishedAt),
}));

// ============================================
// Content Item Tags Junction Table
// ============================================

export const contentItemTags = pgTable('content_item_tags', {
    contentItemId: uuid('content_item_id').notNull().references(() => contentItems.id, { onDelete: 'cascade' }),
    tagId: uuid('tag_id').notNull().references(() => contentTags.id, { onDelete: 'cascade' }),
}, (table) => ({
    pk: primaryKey({ columns: [table.contentItemId, table.tagId] }),
    contentItemIdIdx: index('content_item_tags_content_item_id_idx').on(table.contentItemId),
    tagIdIdx: index('content_item_tags_tag_id_idx').on(table.tagId),
}));

// ============================================
// Content Article Bodies Table
// ============================================

export const contentArticleBodies = pgTable('content_article_bodies', {
    contentItemId: uuid('content_item_id')
        .primaryKey()
        .references(() => contentItems.id, { onDelete: 'cascade' }),

    // Source-of-truth: TipTap/ProseMirror JSON document
    // Nullable initially for migration - can be made NOT NULL after backfill
    bodyJson: jsonb('body_json'),

    // Generated export (not authoritative) - useful for export, diffs, fallback rendering
    bodyMarkdown: text('body_markdown').notNull(),

    // For full-text search and previews
    bodyPlaintext: text('body_plaintext'),

    // Schema version for future TipTap/ProseMirror editor migrations
    schemaVersion: integer('schema_version').notNull().default(1),
});

// ============================================
// Content Document Text Table (for FTS)
// ============================================

export const contentDocumentText = pgTable('content_document_text', {
    contentItemId: uuid('content_item_id').primaryKey().references(() => contentItems.id, { onDelete: 'cascade' }),
    extractedText: text('extracted_text').notNull(),
    extractedAt: timestamp('extracted_at', { withTimezone: true }).notNull().defaultNow(),
});

// ============================================
// Content Assets Table
// ============================================

export const contentAssets = pgTable('content_assets', {
    id: uuid('id').primaryKey().defaultRandom(),

    contentItemId: uuid('content_item_id')
        .notNull()
        .references(() => contentItems.id, { onDelete: 'cascade' }),

    storageObjectId: uuid('storage_object_id')
        .notNull()
        .references(() => storageObjects.id),

    // Type-safe asset role using enum
    assetRole: contentAssetRoleEnum('asset_role').notNull(),

    filename: text('filename').notNull(),

    // Optional but useful for embeds and accessibility
    altText: text('alt_text'),
    caption: text('caption'),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    contentItemRoleIdx: index('content_assets_item_role_idx').on(table.contentItemId, table.assetRole),
    storageObjectIdx: index('content_assets_storage_object_idx').on(table.storageObjectId),
}));

// ============================================
// Type Exports
// ============================================

export type ContentKind = (typeof contentKindEnum.enumValues)[number];
export type ContentStatus = (typeof contentStatusEnum.enumValues)[number];
export type ContentVisibility = (typeof contentVisibilityEnum.enumValues)[number];
export type ContentAssetRole = (typeof contentAssetRoleEnum.enumValues)[number];

export type ContentCategory = typeof contentCategories.$inferSelect;
export type NewContentCategory = typeof contentCategories.$inferInsert;

export type ContentTag = typeof contentTags.$inferSelect;
export type NewContentTag = typeof contentTags.$inferInsert;

export type ContentItem = typeof contentItems.$inferSelect;
export type NewContentItem = typeof contentItems.$inferInsert;

export type ContentItemTag = typeof contentItemTags.$inferSelect;
export type NewContentItemTag = typeof contentItemTags.$inferInsert;

export type ContentArticleBody = typeof contentArticleBodies.$inferSelect;
export type NewContentArticleBody = typeof contentArticleBodies.$inferInsert;

export type ContentDocumentText = typeof contentDocumentText.$inferSelect;
export type NewContentDocumentText = typeof contentDocumentText.$inferInsert;

export type ContentAsset = typeof contentAssets.$inferSelect;
export type NewContentAsset = typeof contentAssets.$inferInsert;

// ============================================
// TipTap JSON Types (for reference)
// ============================================

/**
 * TipTap/ProseMirror document structure for article bodies.
 * 
 * Image nodes should reference assets by ID:
 * {
 *   "type": "image",
 *   "attrs": {
 *     "assetId": "uuid-of-content-asset",
 *     "alt": "Description for accessibility",
 *     "title": "Optional title"
 *   }
 * }
 * 
 * Video nodes should reference assets by ID:
 * {
 *   "type": "video",
 *   "attrs": {
 *     "assetId": "uuid-of-content-asset",
 *     "posterAssetId": "uuid-of-poster-asset (optional)",
 *     "controls": true
 *   }
 * }
 * 
 * On read, the API resolves assetIds to signed/public URLs from storageObjects.
 */
export interface TipTapDocument {
    type: 'doc';
    content: TipTapNode[];
}

export interface TipTapNode {
    type: string;
    attrs?: Record<string, unknown>;
    content?: TipTapNode[];
    marks?: TipTapMark[];
    text?: string;
}

export interface TipTapMark {
    type: string;
    attrs?: Record<string, unknown>;
}

