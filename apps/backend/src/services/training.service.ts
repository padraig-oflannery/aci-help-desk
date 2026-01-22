/**
 * Training Service
 * 
 * Business logic for training definitions, assignments, and progress tracking.
 */

import { eq, and, isNull, desc, asc, sql } from 'drizzle-orm';
import {
    db,
    contentItems,
    trainingDefinitions,
    trainingSteps,
    trainingAssignments,
    trainingAssignmentProgress,
    trainingStepProgress,
    trainingEvents,
} from '../db';
import type {
    TrainingDefinition,
    TrainingStep,
    TrainingCompletionRule,
    TrainingAssignmentStatus,
} from '../db/schema/training';

// ============================================
// Training Definitions
// ============================================

export async function getTrainingDefinition(trainingId: string): Promise<TrainingDefinition | null> {
    const [definition] = await db
        .select()
        .from(trainingDefinitions)
        .where(eq(trainingDefinitions.trainingId, trainingId))
        .limit(1);
    return definition || null;
}

export async function createTrainingDefinition(data: {
    trainingId: string;
    completionRule?: TrainingCompletionRule;
    estimatedMinutes?: number;
    allowDownloads?: boolean;
    requireAcknowledgement?: boolean;
}) {
    const [definition] = await db.insert(trainingDefinitions).values(data).returning();
    return definition;
}

export async function updateTrainingDefinition(trainingId: string, data: {
    completionRule?: TrainingCompletionRule;
    estimatedMinutes?: number;
    allowDownloads?: boolean;
    requireAcknowledgement?: boolean;
}) {
    const [definition] = await db
        .update(trainingDefinitions)
        .set(data)
        .where(eq(trainingDefinitions.trainingId, trainingId))
        .returning();
    return definition;
}

// ============================================
// Training Steps
// ============================================

export async function getTrainingSteps(trainingId: string): Promise<TrainingStep[]> {
    return db
        .select()
        .from(trainingSteps)
        .where(eq(trainingSteps.trainingId, trainingId))
        .orderBy(asc(trainingSteps.stepIndex));
}

export async function addTrainingStep(data: {
    trainingId: string;
    stepIndex: number;
    contentItemId: string;
    isRequired?: boolean;
    minViewSeconds?: number;
    requiresAck?: boolean;
}) {
    const [step] = await db.insert(trainingSteps).values(data).returning();
    return step;
}

export async function updateTrainingStep(stepId: string, data: {
    stepIndex?: number;
    contentItemId?: string;
    isRequired?: boolean;
    minViewSeconds?: number;
    requiresAck?: boolean;
}) {
    const [step] = await db
        .update(trainingSteps)
        .set(data)
        .where(eq(trainingSteps.id, stepId))
        .returning();
    return step;
}

export async function deleteTrainingStep(stepId: string) {
    await db.delete(trainingSteps).where(eq(trainingSteps.id, stepId));
}

// ============================================
// Training Assignments
// ============================================

export async function getActiveAssignmentsForUser(userId: string) {
    return db
        .select({
            assignment: trainingAssignments,
            progress: trainingAssignmentProgress,
            training: contentItems,
        })
        .from(trainingAssignments)
        .innerJoin(trainingAssignmentProgress, eq(trainingAssignments.id, trainingAssignmentProgress.assignmentId))
        .innerJoin(contentItems, eq(trainingAssignments.trainingId, contentItems.id))
        .where(
            and(
                eq(trainingAssignments.userId, userId),
                isNull(trainingAssignments.revokedAt)
            )
        )
        .orderBy(
            asc(trainingAssignments.dueAt),
            desc(trainingAssignments.assignedAt)
        );
}

export async function getAssignmentById(assignmentId: string) {
    const [result] = await db
        .select({
            assignment: trainingAssignments,
            progress: trainingAssignmentProgress,
            training: contentItems,
        })
        .from(trainingAssignments)
        .innerJoin(trainingAssignmentProgress, eq(trainingAssignments.id, trainingAssignmentProgress.assignmentId))
        .innerJoin(contentItems, eq(trainingAssignments.trainingId, contentItems.id))
        .where(eq(trainingAssignments.id, assignmentId))
        .limit(1);
    return result || null;
}

export async function createAssignment(data: {
    trainingId: string;
    userId: string;
    assignedByUserId?: string;
    isRequired?: boolean;
    dueAt?: Date;
}) {
    // Create assignment
    const [assignment] = await db.insert(trainingAssignments).values(data).returning();

    // Create progress record
    await db.insert(trainingAssignmentProgress).values({
        assignmentId: assignment.id,
        status: 'ASSIGNED',
        progressPercent: 0,
    });

    // Log event
    await db.insert(trainingEvents).values({
        assignmentId: assignment.id,
        eventType: 'ASSIGNED',
        actorUserId: data.assignedByUserId,
    });

    return assignment;
}

export async function revokeAssignment(assignmentId: string, actorUserId?: string) {
    await db
        .update(trainingAssignments)
        .set({ revokedAt: new Date() })
        .where(eq(trainingAssignments.id, assignmentId));

    await db
        .update(trainingAssignmentProgress)
        .set({ status: 'REVOKED' })
        .where(eq(trainingAssignmentProgress.assignmentId, assignmentId));

    await db.insert(trainingEvents).values({
        assignmentId,
        eventType: 'REVOKED',
        actorUserId,
    });
}

export async function waiveAssignment(
    assignmentId: string,
    waivedByUserId: string,
    reason?: string
) {
    await db
        .update(trainingAssignments)
        .set({
            waivedAt: new Date(),
            waivedByUserId,
            waiveReason: reason,
        })
        .where(eq(trainingAssignments.id, assignmentId));

    await db
        .update(trainingAssignmentProgress)
        .set({ status: 'WAIVED' })
        .where(eq(trainingAssignmentProgress.assignmentId, assignmentId));

    await db.insert(trainingEvents).values({
        assignmentId,
        eventType: 'WAIVED',
        actorUserId: waivedByUserId,
        metadata: reason ? { reason } : null,
    });
}

// ============================================
// Progress Tracking
// ============================================

export async function updateAssignmentProgress(
    assignmentId: string,
    data: Partial<{
        status: TrainingAssignmentStatus;
        startedAt: Date;
        lastActivityAt: Date;
        firstViewedAt: Date;
        acknowledgedAt: Date;
        completedAt: Date;
        progressPercent: number;
    }>
) {
    const [progress] = await db
        .update(trainingAssignmentProgress)
        .set(data)
        .where(eq(trainingAssignmentProgress.assignmentId, assignmentId))
        .returning();
    return progress;
}

export async function getStepProgress(assignmentId: string) {
    return db
        .select()
        .from(trainingStepProgress)
        .where(eq(trainingStepProgress.assignmentId, assignmentId));
}

export async function updateStepProgress(
    assignmentId: string,
    stepId: string,
    data: Partial<{
        firstViewedAt: Date;
        lastViewedAt: Date;
        acknowledgedAt: Date;
        completedAt: Date;
        timeSpentSeconds: number;
    }>
) {
    // Upsert step progress
    await db
        .insert(trainingStepProgress)
        .values({
            assignmentId,
            stepId,
            ...data,
            timeSpentSeconds: data.timeSpentSeconds ?? 0,
        })
        .onConflictDoUpdate({
            target: [trainingStepProgress.assignmentId, trainingStepProgress.stepId],
            set: data,
        });
}

export async function markStepViewed(assignmentId: string, stepId: string) {
    const now = new Date();
    await updateStepProgress(assignmentId, stepId, {
        firstViewedAt: now,
        lastViewedAt: now,
    });

    // Also update assignment progress
    await updateAssignmentProgress(assignmentId, {
        lastActivityAt: now,
        firstViewedAt: now,
    });

    // Log event
    await db.insert(trainingEvents).values({
        assignmentId,
        eventType: 'VIEWED',
        metadata: { stepId },
    });
}

export async function markStepCompleted(assignmentId: string, stepId: string) {
    await updateStepProgress(assignmentId, stepId, {
        completedAt: new Date(),
    });

    await db.insert(trainingEvents).values({
        assignmentId,
        eventType: 'STEP_COMPLETED',
        metadata: { stepId },
    });
}

export async function acknowledgeTraining(assignmentId: string, userId: string) {
    const now = new Date();

    await updateAssignmentProgress(assignmentId, {
        acknowledgedAt: now,
        lastActivityAt: now,
    });

    await db.insert(trainingEvents).values({
        assignmentId,
        eventType: 'ACKNOWLEDGED',
        actorUserId: userId,
    });
}

export async function completeTraining(assignmentId: string, userId: string) {
    const now = new Date();

    await updateAssignmentProgress(assignmentId, {
        status: 'COMPLETED',
        completedAt: now,
        progressPercent: 100,
    });

    await db.insert(trainingEvents).values({
        assignmentId,
        eventType: 'COMPLETED',
        actorUserId: userId,
    });
}

// ============================================
// Statistics
// ============================================

export async function getTrainingStats(trainingId: string) {
    const [stats] = await db
        .select({
            totalAssigned: sql<number>`count(*)::int`,
            completed: sql<number>`count(*) filter (where ${trainingAssignmentProgress.status} = 'COMPLETED')::int`,
            inProgress: sql<number>`count(*) filter (where ${trainingAssignmentProgress.status} = 'IN_PROGRESS')::int`,
            overdue: sql<number>`count(*) filter (where ${trainingAssignmentProgress.status} = 'OVERDUE')::int`,
        })
        .from(trainingAssignments)
        .innerJoin(trainingAssignmentProgress, eq(trainingAssignments.id, trainingAssignmentProgress.assignmentId))
        .where(
            and(
                eq(trainingAssignments.trainingId, trainingId),
                isNull(trainingAssignments.revokedAt)
            )
        );

    return stats;
}

export async function getUserTrainingStats(userId: string) {
    const [stats] = await db
        .select({
            totalAssigned: sql<number>`count(*)::int`,
            completed: sql<number>`count(*) filter (where ${trainingAssignmentProgress.status} = 'COMPLETED')::int`,
            inProgress: sql<number>`count(*) filter (where ${trainingAssignmentProgress.status} = 'IN_PROGRESS')::int`,
            overdue: sql<number>`count(*) filter (where ${trainingAssignmentProgress.status} = 'OVERDUE')::int`,
        })
        .from(trainingAssignments)
        .innerJoin(trainingAssignmentProgress, eq(trainingAssignments.id, trainingAssignmentProgress.assignmentId))
        .where(
            and(
                eq(trainingAssignments.userId, userId),
                isNull(trainingAssignments.revokedAt)
            )
        );

    return stats;
}
