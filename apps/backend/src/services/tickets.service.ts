/**
 * Tickets Service
 * 
 * Business logic for tickets, messages, and attachments.
 */

import { eq, and, desc, asc, sql, gte } from 'drizzle-orm';
import {
    db,
    tickets,
    ticketMessages,
    ticketAttachments,
    ticketStatusHistory,
    users,
} from '../db';
import type {
    Ticket,
    TicketStatus,
    TicketPriority,
} from '../db/schema/tickets';

// ============================================
// Tickets
// ============================================

interface TicketFilters {
    status?: TicketStatus;
    priority?: TicketPriority;
    category?: string;
    assignedToUserId?: string;
    requesterUserId?: string;
    page?: number;
    pageSize?: number;
}

export async function getTickets(filters: TicketFilters = {}) {
    const { status, priority, category, assignedToUserId, requesterUserId, page = 1, pageSize = 20 } = filters;
    const offset = (page - 1) * pageSize;

    let query = db.select().from(tickets);
    const conditions = [];

    if (status) {
        conditions.push(eq(tickets.status, status));
    }

    if (priority) {
        conditions.push(eq(tickets.priority, priority));
    }

    if (category) {
        conditions.push(eq(tickets.category, category));
    }

    if (assignedToUserId) {
        conditions.push(eq(tickets.assignedToUserId, assignedToUserId));
    }

    if (requesterUserId) {
        conditions.push(eq(tickets.requesterUserId, requesterUserId));
    }

    if (conditions.length > 0) {
        query = query.where(and(...conditions)) as typeof query;
    }

    const items = await query
        .orderBy(desc(tickets.createdAt))
        .limit(pageSize)
        .offset(offset);

    return items;
}

export async function getTicketById(id: string): Promise<Ticket | null> {
    const [ticket] = await db.select().from(tickets).where(eq(tickets.id, id)).limit(1);
    return ticket || null;
}

export async function getTicketByNumber(ticketNumber: number): Promise<Ticket | null> {
    const [ticket] = await db.select().from(tickets).where(eq(tickets.ticketNumber, ticketNumber)).limit(1);
    return ticket || null;
}

export async function getTicketWithDetails(id: string) {
    const ticket = await getTicketById(id);
    if (!ticket) return null;

    // Get requester info
    const [requester] = await db
        .select({
            id: users.id,
            name: users.name,
            email: users.email,
        })
        .from(users)
        .where(eq(users.id, ticket.requesterUserId))
        .limit(1);

    // Get assignee info
    let assignee = null;
    if (ticket.assignedToUserId) {
        const [a] = await db
            .select({
                id: users.id,
                name: users.name,
                email: users.email,
            })
            .from(users)
            .where(eq(users.id, ticket.assignedToUserId))
            .limit(1);
        assignee = a;
    }

    // Get messages
    const messages = await getTicketMessages(id);

    // Get attachments
    const attachments = await getTicketAttachments(id);

    return {
        ...ticket,
        requester,
        assignee,
        messages,
        attachments,
    };
}

export async function createTicket(data: {
    subject: string;
    description: string;
    category?: string;
    priority?: TicketPriority;
    requesterUserId: string;
}) {
    // Create ticket
    const [ticket] = await db.insert(tickets).values({
        ...data,
        status: 'OPEN',
    }).returning();

    // Create initial message from description
    await db.insert(ticketMessages).values({
        ticketId: ticket.id,
        authorUserId: data.requesterUserId,
        body: data.description,
        messageType: 'PUBLIC',
    });

    // Log status history
    await db.insert(ticketStatusHistory).values({
        ticketId: ticket.id,
        toStatus: 'OPEN',
        changedByUserId: data.requesterUserId,
    });

    return ticket;
}

export async function updateTicket(id: string, data: {
    status?: TicketStatus;
    priority?: TicketPriority;
    category?: string;
    assignedToUserId?: string | null;
}, changedByUserId: string) {
    const current = await getTicketById(id);
    if (!current) return null;

    const updateData: Record<string, unknown> = {
        ...data,
        updatedAt: new Date(),
    };

    // Handle status changes
    if (data.status && data.status !== current.status) {
        if (data.status === 'CLOSED') {
            updateData.closedAt = new Date();
        }

        // Log status change
        await db.insert(ticketStatusHistory).values({
            ticketId: id,
            fromStatus: current.status,
            toStatus: data.status,
            changedByUserId,
        });
    }

    const [ticket] = await db.update(tickets).set(updateData).where(eq(tickets.id, id)).returning();
    return ticket;
}

// ============================================
// Messages
// ============================================

export async function getTicketMessages(ticketId: string) {
    const messages = await db
        .select({
            id: ticketMessages.id,
            ticketId: ticketMessages.ticketId,
            body: ticketMessages.body,
            messageType: ticketMessages.messageType,
            createdAt: ticketMessages.createdAt,
            authorUserId: ticketMessages.authorUserId,
            author: {
                id: users.id,
                name: users.name,
            },
        })
        .from(ticketMessages)
        .leftJoin(users, eq(ticketMessages.authorUserId, users.id))
        .where(eq(ticketMessages.ticketId, ticketId))
        .orderBy(asc(ticketMessages.createdAt));

    return messages;
}

export async function addTicketMessage(data: {
    ticketId: string;
    authorUserId?: string;
    body: string;
    messageType?: 'PUBLIC' | 'INTERNAL' | 'SYSTEM';
}) {
    const [message] = await db.insert(ticketMessages).values({
        ...data,
        messageType: data.messageType || 'PUBLIC',
    }).returning();

    // Update ticket's updatedAt
    await db.update(tickets).set({ updatedAt: new Date() }).where(eq(tickets.id, data.ticketId));

    return message;
}

// ============================================
// Attachments
// ============================================

export async function getTicketAttachments(ticketId: string) {
    return db.select().from(ticketAttachments).where(eq(ticketAttachments.ticketId, ticketId));
}

export async function addTicketAttachment(data: {
    ticketId: string;
    messageId?: string;
    storageObjectId: string;
    filename: string;
    mimeType: string;
    sizeBytes: number;
}) {
    const [attachment] = await db.insert(ticketAttachments).values(data).returning();
    return attachment;
}

// ============================================
// Statistics
// ============================================

export async function getTicketStats() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [stats] = await db
        .select({
            total: sql<number>`count(*)::int`,
            open: sql<number>`count(*) filter (where ${tickets.status} = 'OPEN')::int`,
            inProgress: sql<number>`count(*) filter (where ${tickets.status} = 'IN_PROGRESS')::int`,
            waitingOnEmployee: sql<number>`count(*) filter (where ${tickets.status} = 'WAITING_ON_EMPLOYEE')::int`,
            resolved: sql<number>`count(*) filter (where ${tickets.status} = 'RESOLVED')::int`,
            closed: sql<number>`count(*) filter (where ${tickets.status} = 'CLOSED')::int`,
        })
        .from(tickets);

    const [recentStats] = await db
        .select({
            createdLast30Days: sql<number>`count(*)::int`,
            resolvedLast30Days: sql<number>`count(*) filter (where ${tickets.status} in ('RESOLVED', 'CLOSED'))::int`,
        })
        .from(tickets)
        .where(gte(tickets.createdAt, thirtyDaysAgo));

    return {
        ...stats,
        ...recentStats,
    };
}

export async function getUserTickets(userId: string, filters: TicketFilters = {}) {
    return getTickets({ ...filters, requesterUserId: userId });
}
