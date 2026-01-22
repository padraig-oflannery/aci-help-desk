/**
 * Tickets Routes
 * 
 * Employee ticket endpoints.
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../../middleware/auth';
import * as ticketsService from '../../services/tickets.service';
import * as storageService from '../../services/storage.service';
import { getSignedUploadUrl, getSignedDownloadUrl, generateStorageKey } from '../../lib/s3';
import '../../lib/jwt'; // Import to apply Fastify type extension

// ============================================
// Request Schemas
// ============================================

const createTicketSchema = z.object({
    subject: z.string().min(1).max(500),
    category: z.string().optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional().default('MEDIUM'),
    description: z.string().min(1),
});

const addMessageSchema = z.object({
    body: z.string().min(1),
});

const uploadAttachmentSchema = z.object({
    filename: z.string().min(1),
    contentType: z.string().min(1),
    size: z.number().int().positive().max(10 * 1024 * 1024), // 10MB max
});

// ============================================
// Route Registration
// ============================================

export async function ticketsRoutes(app: FastifyInstance) {
    // All routes require authentication
    app.addHook('preHandler', authenticate);

    // POST /tickets - Create a new ticket
    app.post('/tickets', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const body = createTicketSchema.parse(request.body);

            const ticket = await ticketsService.createTicket({
                ...body,
                requesterUserId: request.user!.userId,
            });

            return reply.code(201).send(ticket);
        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.code(400).send({ error: 'Invalid request', details: error.errors });
            }
            throw error;
        }
    });

    // GET /tickets - List user's tickets
    app.get('/tickets', async (request: FastifyRequest, _reply: FastifyReply) => {
        const query = request.query as { status?: string; page?: string; pageSize?: string };

        const result = await ticketsService.getUserTickets(request.user!.userId, {
            status: query.status as any,
            page: query.page ? parseInt(query.page) : 1,
            pageSize: query.pageSize ? parseInt(query.pageSize) : 20,
        });

        return result;
    });

    // GET /tickets/:id - Get ticket details
    app.get('/tickets/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        const { id } = request.params;

        const ticket = await ticketsService.getTicketWithDetails(id);

        if (!ticket) {
            return reply.code(404).send({ error: 'Ticket not found' });
        }

        // Check if user owns the ticket or is admin
        if (ticket.requesterUserId !== request.user!.userId && request.user!.role === 'EMPLOYEE') {
            return reply.code(403).send({ error: 'Access denied' });
        }

        return ticket;
    });

    // POST /tickets/:id/messages - Add message to ticket
    app.post('/tickets/:id/messages', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        try {
            const { id } = request.params;
            const body = addMessageSchema.parse(request.body);

            const ticket = await ticketsService.getTicketById(id);

            if (!ticket) {
                return reply.code(404).send({ error: 'Ticket not found' });
            }

            // Check if user owns the ticket or is admin
            if (ticket.requesterUserId !== request.user!.userId && request.user!.role === 'EMPLOYEE') {
                return reply.code(403).send({ error: 'Access denied' });
            }

            const messageType = request.user!.role === 'EMPLOYEE' ? 'PUBLIC' : 'PUBLIC';

            const message = await ticketsService.addTicketMessage({
                ticketId: id,
                authorUserId: request.user!.userId,
                body: body.body,
                messageType,
            });

            return reply.code(201).send(message);
        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.code(400).send({ error: 'Invalid request', details: error.errors });
            }
            throw error;
        }
    });

    // POST /tickets/:id/attachments/upload-url - Get signed upload URL
    app.post('/tickets/:id/attachments/upload-url', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        try {
            const { id } = request.params;
            const body = uploadAttachmentSchema.parse(request.body);

            const ticket = await ticketsService.getTicketById(id);

            if (!ticket) {
                return reply.code(404).send({ error: 'Ticket not found' });
            }

            // Check if user owns the ticket or is admin
            if (ticket.requesterUserId !== request.user!.userId && request.user!.role === 'EMPLOYEE') {
                return reply.code(403).send({ error: 'Access denied' });
            }

            const objectKey = generateStorageKey(`tickets/${id}`, body.filename);
            const uploadUrl = await getSignedUploadUrl(objectKey, body.contentType);

            // Create storage object record
            const storageObject = await storageService.createStorageObject({
                bucket: 'helpdesk',
                objectKey,
                mimeType: body.contentType,
                sizeBytes: body.size,
            });

            // Create attachment record
            const attachment = await ticketsService.addTicketAttachment({
                ticketId: id,
                storageObjectId: storageObject.id,
                filename: body.filename,
                mimeType: body.contentType,
                sizeBytes: body.size,
            });

            return { uploadUrl, attachment };
        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.code(400).send({ error: 'Invalid request', details: error.errors });
            }
            throw error;
        }
    });

    // GET /tickets/:id/attachments/:attachmentId/download - Get download URL
    app.get('/tickets/:id/attachments/:attachmentId/download', async (
        request: FastifyRequest<{ Params: { id: string; attachmentId: string } }>,
        reply: FastifyReply
    ) => {
        const { id, attachmentId } = request.params;

        const ticket = await ticketsService.getTicketById(id);

        if (!ticket) {
            return reply.code(404).send({ error: 'Ticket not found' });
        }

        // Check if user owns the ticket or is admin
        if (ticket.requesterUserId !== request.user!.userId && request.user!.role === 'EMPLOYEE') {
            return reply.code(403).send({ error: 'Access denied' });
        }

        const attachments = await ticketsService.getTicketAttachments(id);
        const attachment = attachments.find(a => a.id === attachmentId);

        if (!attachment) {
            return reply.code(404).send({ error: 'Attachment not found' });
        }

        // Get storage object to get the key
        const storageObject = await storageService.getStorageObjectById(attachment.storageObjectId);
        if (!storageObject) {
            return reply.code(404).send({ error: 'Attachment file not found' });
        }

        const url = await getSignedDownloadUrl(storageObject.objectKey);

        return { url, filename: attachment.filename, mimeType: attachment.mimeType };
    });
}
