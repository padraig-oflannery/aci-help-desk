/**
 * Storage Schema
 * 
 * Defines table for Cloudflare R2 storage objects.
 */

import { pgTable, uuid, text, bigint, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';

// ============================================
// Storage Objects Table
// ============================================

export const storageObjects = pgTable('storage_objects', {
    id: uuid('id').primaryKey().defaultRandom(),
    provider: text('provider').notNull().default('cloudflare_r2'),
    bucket: text('bucket').notNull(),
    objectKey: text('object_key').notNull(),
    mimeType: text('mime_type').notNull(),
    sizeBytes: bigint('size_bytes', { mode: 'number' }).notNull(),
    sha256: text('sha256'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    bucketKeyUniqueIdx: uniqueIndex('storage_objects_bucket_key_unique_idx').on(table.bucket, table.objectKey),
    createdAtIdx: index('storage_objects_created_at_idx').on(table.createdAt),
}));

// ============================================
// Type Exports
// ============================================

export type StorageObject = typeof storageObjects.$inferSelect;
export type NewStorageObject = typeof storageObjects.$inferInsert;
