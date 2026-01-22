/**
 * Ticketing Schema
 * 
 * Defines tables for tickets, messages, attachments, and status history.
 */

import { pgTable, pgEnum, uuid, text, integer, timestamp, index, serial } from 'drizzle-orm/pg-core';
import { users } from './users';
import { storageObjects } from './storage';

// ============================================
// Enums
// ============================================

export const ticketStatusEnum = pgEnum('ticket_status', [
    'OPEN',
    'IN_PROGRESS',
    'WAITING_ON_EMPLOYEE',
    'RESOLVED',
    'CLOSED',
]);

export const ticketPriorityEnum = pgEnum('ticket_priority', [
    'LOW',
    'MEDIUM',
    'HIGH',
    'URGENT',
]);

export const ticketMessageTypeEnum = pgEnum('ticket_message_type', [
    'PUBLIC',
    'INTERNAL',
    'SYSTEM',
]);

// ============================================
// Tickets Table
// ============================================

export const tickets = pgTable('tickets', {
    id: uuid('id').primaryKey().defaultRandom(),
    ticketNumber: serial('ticket_number').notNull().unique(),
    requesterUserId: uuid('requester_user_id').notNull().references(() => users.id),
    assignedToUserId: uuid('assigned_to_user_id').references(() => users.id),
    subject: text('subject').notNull(),
    description: text('description').notNull(),
    status: ticketStatusEnum('status').notNull().default('OPEN'),
    priority: ticketPriorityEnum('priority').notNull().default('MEDIUM'),
    category: text('category'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    closedAt: timestamp('closed_at', { withTimezone: true }),
}, (table) => ({
    ticketNumberIdx: index('tickets_ticket_number_idx').on(table.ticketNumber),
    statusPriorityIdx: index('tickets_status_priority_idx').on(table.status, table.priority),
    assignedToStatusIdx: index('tickets_assigned_to_status_idx').on(table.assignedToUserId, table.status),
    requesterStatusIdx: index('tickets_requester_status_idx').on(table.requesterUserId, table.status),
}));

// ============================================
// Ticket Messages Table
// ============================================

export const ticketMessages = pgTable('ticket_messages', {
    id: uuid('id').primaryKey().defaultRandom(),
    ticketId: uuid('ticket_id').notNull().references(() => tickets.id, { onDelete: 'cascade' }),
    authorUserId: uuid('author_user_id').references(() => users.id), // nullable for SYSTEM messages
    messageType: ticketMessageTypeEnum('message_type').notNull().default('PUBLIC'),
    body: text('body').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    ticketCreatedAtIdx: index('ticket_messages_ticket_created_at_idx').on(table.ticketId, table.createdAt),
}));

// ============================================
// Ticket Attachments Table
// ============================================

export const ticketAttachments = pgTable('ticket_attachments', {
    id: uuid('id').primaryKey().defaultRandom(),
    ticketId: uuid('ticket_id').notNull().references(() => tickets.id, { onDelete: 'cascade' }),
    messageId: uuid('message_id').references(() => ticketMessages.id, { onDelete: 'cascade' }),
    storageObjectId: uuid('storage_object_id').notNull().references(() => storageObjects.id),
    filename: text('filename').notNull(),
    mimeType: text('mime_type').notNull(),
    sizeBytes: integer('size_bytes').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    ticketIdIdx: index('ticket_attachments_ticket_id_idx').on(table.ticketId),
    messageIdIdx: index('ticket_attachments_message_id_idx').on(table.messageId),
}));

// ============================================
// Ticket Status History Table
// ============================================

export const ticketStatusHistory = pgTable('ticket_status_history', {
    id: uuid('id').primaryKey().defaultRandom(),
    ticketId: uuid('ticket_id').notNull().references(() => tickets.id, { onDelete: 'cascade' }),
    fromStatus: ticketStatusEnum('from_status'),
    toStatus: ticketStatusEnum('to_status').notNull(),
    changedByUserId: uuid('changed_by_user_id').references(() => users.id),
    changedAt: timestamp('changed_at', { withTimezone: true }).notNull().defaultNow(),
    note: text('note'),
}, (table) => ({
    ticketIdIdx: index('ticket_status_history_ticket_id_idx').on(table.ticketId),
    changedAtIdx: index('ticket_status_history_changed_at_idx').on(table.changedAt),
}));

// ============================================
// Type Exports
// ============================================

export type TicketStatus = (typeof ticketStatusEnum.enumValues)[number];
export type TicketPriority = (typeof ticketPriorityEnum.enumValues)[number];
export type TicketMessageType = (typeof ticketMessageTypeEnum.enumValues)[number];

export type Ticket = typeof tickets.$inferSelect;
export type NewTicket = typeof tickets.$inferInsert;

export type TicketMessage = typeof ticketMessages.$inferSelect;
export type NewTicketMessage = typeof ticketMessages.$inferInsert;

export type TicketAttachment = typeof ticketAttachments.$inferSelect;
export type NewTicketAttachment = typeof ticketAttachments.$inferInsert;

export type TicketStatusHistory = typeof ticketStatusHistory.$inferSelect;
export type NewTicketStatusHistory = typeof ticketStatusHistory.$inferInsert;
