/**
 * User & Authentication Schema
 * 
 * Defines tables for users, sessions, and password reset tokens.
 */

import { pgTable, pgEnum, uuid, text, boolean, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';

// ============================================
// Enums
// ============================================

export const userRoleEnum = pgEnum('user_role', ['EMPLOYEE', 'ADMIN', 'SUPER_ADMIN']);

// ============================================
// Users Table
// ============================================

export const users = pgTable('users', {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull(),
    name: text('name').notNull(),
    passwordHash: text('password_hash').notNull(),
    role: userRoleEnum('role').notNull().default('EMPLOYEE'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    emailIdx: uniqueIndex('users_email_unique_idx').on(table.email),
    roleIdx: index('users_role_idx').on(table.role),
}));

// ============================================
// User Sessions Table
// ============================================

export const userSessions = pgTable('user_sessions', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    refreshTokenHash: text('refresh_token_hash').notNull(),
    deviceLabel: text('device_label'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
}, (table) => ({
    userIdExpiresIdx: index('user_sessions_user_id_expires_idx').on(table.userId, table.expiresAt),
    userIdRevokedIdx: index('user_sessions_user_id_revoked_idx').on(table.userId, table.revokedAt),
}));

// ============================================
// Password Reset Tokens Table
// ============================================

export const passwordResetTokens = pgTable('password_reset_tokens', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    usedAt: timestamp('used_at', { withTimezone: true }),
}, (table) => ({
    userIdIdx: index('password_reset_tokens_user_id_idx').on(table.userId),
    tokenHashIdx: index('password_reset_tokens_token_hash_idx').on(table.tokenHash),
}));

// ============================================
// Type Exports
// ============================================

export type UserRole = (typeof userRoleEnum.enumValues)[number];
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type UserSession = typeof userSessions.$inferSelect;
export type NewUserSession = typeof userSessions.$inferInsert;

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type NewPasswordResetToken = typeof passwordResetTokens.$inferInsert;
