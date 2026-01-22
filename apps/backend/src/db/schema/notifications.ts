/**
 * Notifications Schema
 * 
 * Defines tables for user notifications.
 */

import { pgTable, uuid, text, timestamp, index, jsonb } from 'drizzle-orm/pg-core';
import { users } from './users';

// ============================================
// Notifications Table
// ============================================

export const notifications = pgTable('notifications', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').notNull(), // TICKET_UPDATED, TRAINING_DUE, TRAINING_COMPLETED, KB_PUBLISHED, etc.
    title: text('title').notNull(),
    body: text('body'),
    link: jsonb('link'), // e.g., {screen: "ticket", id: "..."}
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    readAt: timestamp('read_at', { withTimezone: true }),
}, (table) => ({
    userIdReadAtIdx: index('notifications_user_id_read_at_idx').on(table.userId, table.readAt),
    userIdCreatedAtIdx: index('notifications_user_id_created_at_idx').on(table.userId, table.createdAt),
}));

// ============================================
// Type Exports
// ============================================

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
