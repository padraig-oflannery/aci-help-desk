/**
 * Training Schema
 * 
 * Defines tables for training definitions, steps, assignments, and progress tracking.
 */

import { pgTable, pgEnum, uuid, text, integer, boolean, timestamp, index, uniqueIndex, primaryKey, jsonb } from 'drizzle-orm/pg-core';
import { users } from './users';
import { contentItems } from './content';

// ============================================
// Enums
// ============================================

export const trainingCompletionRuleEnum = pgEnum('training_completion_rule', [
    'MANUAL_ACK',
    'ALL_STEPS_VIEWED',
    'ALL_STEPS_COMPLETED',
    'MANUAL_COMPLETE',
]);

export const trainingAssignmentStatusEnum = pgEnum('training_assignment_status', [
    'ASSIGNED',
    'IN_PROGRESS',
    'COMPLETED',
    'OVERDUE',
    'WAIVED',
    'REVOKED',
]);

// ============================================
// Training Definitions Table
// ============================================

export const trainingDefinitions = pgTable('training_definitions', {
    trainingId: uuid('training_id').primaryKey().references(() => contentItems.id, { onDelete: 'cascade' }),
    completionRule: trainingCompletionRuleEnum('completion_rule').notNull().default('MANUAL_ACK'),
    estimatedMinutes: integer('estimated_minutes'),
    version: integer('version').notNull().default(1),
    allowDownloads: boolean('allow_downloads').notNull().default(true),
    requireAcknowledgement: boolean('require_acknowledgement').notNull().default(true),
});

// ============================================
// Training Steps Table
// ============================================

export const trainingSteps = pgTable('training_steps', {
    id: uuid('id').primaryKey().defaultRandom(),
    trainingId: uuid('training_id').notNull().references(() => contentItems.id, { onDelete: 'cascade' }),
    stepIndex: integer('step_index').notNull(),
    contentItemId: uuid('content_item_id').notNull().references(() => contentItems.id),
    isRequired: boolean('is_required').notNull().default(true),
    minViewSeconds: integer('min_view_seconds'),
    requiresAck: boolean('requires_ack').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    trainingStepUniqueIdx: uniqueIndex('training_steps_training_step_unique_idx').on(table.trainingId, table.stepIndex),
    trainingIdIdx: index('training_steps_training_id_idx').on(table.trainingId),
    contentItemIdIdx: index('training_steps_content_item_id_idx').on(table.contentItemId),
}));

// ============================================
// Training Assignments Table
// ============================================

export const trainingAssignments = pgTable('training_assignments', {
    id: uuid('id').primaryKey().defaultRandom(),
    trainingId: uuid('training_id').notNull().references(() => contentItems.id),
    userId: uuid('user_id').notNull().references(() => users.id),
    assignedByUserId: uuid('assigned_by_user_id').references(() => users.id),
    isRequired: boolean('is_required').notNull().default(true),
    dueAt: timestamp('due_at', { withTimezone: true }),
    assignedAt: timestamp('assigned_at', { withTimezone: true }).notNull().defaultNow(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    waivedAt: timestamp('waived_at', { withTimezone: true }),
    waivedByUserId: uuid('waived_by_user_id').references(() => users.id),
    waiveReason: text('waive_reason'),
}, (table) => ({
    // Note: Unique active assignment constraint would be added via raw SQL
    // WHERE revoked_at IS NULL
    userIdRevokedIdx: index('training_assignments_user_id_revoked_idx').on(table.userId, table.revokedAt),
    trainingIdRevokedIdx: index('training_assignments_training_id_revoked_idx').on(table.trainingId, table.revokedAt),
    dueAtIdx: index('training_assignments_due_at_idx').on(table.dueAt),
}));

// ============================================
// Training Assignment Progress Table
// ============================================

export const trainingAssignmentProgress = pgTable('training_assignment_progress', {
    assignmentId: uuid('assignment_id').primaryKey().references(() => trainingAssignments.id, { onDelete: 'cascade' }),
    status: trainingAssignmentStatusEnum('status').notNull().default('ASSIGNED'),
    startedAt: timestamp('started_at', { withTimezone: true }),
    lastActivityAt: timestamp('last_activity_at', { withTimezone: true }),
    firstViewedAt: timestamp('first_viewed_at', { withTimezone: true }),
    acknowledgedAt: timestamp('acknowledged_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    progressPercent: integer('progress_percent').notNull().default(0),
});

// ============================================
// Training Step Progress Table
// ============================================

export const trainingStepProgress = pgTable('training_step_progress', {
    assignmentId: uuid('assignment_id').notNull().references(() => trainingAssignments.id, { onDelete: 'cascade' }),
    stepId: uuid('step_id').notNull().references(() => trainingSteps.id, { onDelete: 'cascade' }),
    firstViewedAt: timestamp('first_viewed_at', { withTimezone: true }),
    lastViewedAt: timestamp('last_viewed_at', { withTimezone: true }),
    acknowledgedAt: timestamp('acknowledged_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    timeSpentSeconds: integer('time_spent_seconds').notNull().default(0),
}, (table) => ({
    pk: primaryKey({ columns: [table.assignmentId, table.stepId] }),
    assignmentIdIdx: index('training_step_progress_assignment_id_idx').on(table.assignmentId),
    stepIdIdx: index('training_step_progress_step_id_idx').on(table.stepId),
}));

// ============================================
// Training Events Table (Audit Trail)
// ============================================

export const trainingEvents = pgTable('training_events', {
    id: uuid('id').primaryKey().defaultRandom(),
    assignmentId: uuid('assignment_id').notNull().references(() => trainingAssignments.id, { onDelete: 'cascade' }),
    eventType: text('event_type').notNull(), // VIEWED, ACKNOWLEDGED, COMPLETED, WAIVED, REVOKED, RESET, OVERRIDE
    eventAt: timestamp('event_at', { withTimezone: true }).notNull().defaultNow(),
    actorUserId: uuid('actor_user_id').references(() => users.id),
    metadata: jsonb('metadata'),
}, (table) => ({
    assignmentIdIdx: index('training_events_assignment_id_idx').on(table.assignmentId),
    eventAtIdx: index('training_events_event_at_idx').on(table.eventAt),
}));

// ============================================
// Type Exports
// ============================================

export type TrainingCompletionRule = (typeof trainingCompletionRuleEnum.enumValues)[number];
export type TrainingAssignmentStatus = (typeof trainingAssignmentStatusEnum.enumValues)[number];

export type TrainingDefinition = typeof trainingDefinitions.$inferSelect;
export type NewTrainingDefinition = typeof trainingDefinitions.$inferInsert;

export type TrainingStep = typeof trainingSteps.$inferSelect;
export type NewTrainingStep = typeof trainingSteps.$inferInsert;

export type TrainingAssignment = typeof trainingAssignments.$inferSelect;
export type NewTrainingAssignment = typeof trainingAssignments.$inferInsert;

export type TrainingAssignmentProgress = typeof trainingAssignmentProgress.$inferSelect;
export type NewTrainingAssignmentProgress = typeof trainingAssignmentProgress.$inferInsert;

export type TrainingStepProgress = typeof trainingStepProgress.$inferSelect;
export type NewTrainingStepProgress = typeof trainingStepProgress.$inferInsert;

export type TrainingEvent = typeof trainingEvents.$inferSelect;
export type NewTrainingEvent = typeof trainingEvents.$inferInsert;
