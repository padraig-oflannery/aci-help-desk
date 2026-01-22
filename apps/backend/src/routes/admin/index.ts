/**
 * Admin Routes
 * 
 * Admin-only endpoints for Content, Tickets, and User management.
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { authenticate, requireAdmin } from '../../middleware/auth';
import * as contentService from '../../services/content.service';
import * as trainingService from '../../services/training.service';
import * as ticketsService from '../../services/tickets.service';
import * as authService from '../../services/auth.service';
import { getSignedUploadUrl, generateStorageKey } from '../../lib/s3';
import { hashPassword, generateToken } from '../../lib/crypto';
import { sendWelcomeEmail } from '../../lib/email';
import { db, users } from '../../db';
import { eq } from 'drizzle-orm';

// ============================================
// Request Schemas
// ============================================

const createContentItemSchema = z.object({
    kind: z.enum(['ARTICLE', 'VIDEO', 'DOCUMENT', 'TRAINING']),
    title: z.string().min(1).max(500),
    summary: z.string().max(1000).optional(),
    categoryId: z.string().uuid().optional(),
    tagIds: z.array(z.string().uuid()).optional(),
    status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional().default('DRAFT'),
    visibility: z.enum(['ALL_EMPLOYEES', 'ADMINS_ONLY']).optional().default('ALL_EMPLOYEES'),
    bodyMarkdown: z.string().optional(),
    bodyJson: z.object({
        type: z.literal('doc'),
        content: z.array(z.any()),
    }).optional(),
});

const updateContentItemSchema = createContentItemSchema.partial();

const createCategorySchema = z.object({
    name: z.string().min(1).max(255),
    slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/),
});

const createTagSchema = z.object({
    name: z.string().min(1).max(255),
    slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/),
});

const updateTicketSchema = z.object({
    status: z.enum(['OPEN', 'IN_PROGRESS', 'WAITING_ON_EMPLOYEE', 'RESOLVED', 'CLOSED']).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    category: z.string().optional(),
    assignedToUserId: z.string().uuid().nullable().optional(),
});

const createUserSchema = z.object({
    name: z.string().min(1).max(255),
    email: z.string().email(),
    role: z.enum(['EMPLOYEE', 'ADMIN', 'SUPER_ADMIN']).optional().default('EMPLOYEE'),
});

const updateUserSchema = z.object({
    name: z.string().min(1).max(255).optional(),
    email: z.string().email().optional(),
    role: z.enum(['EMPLOYEE', 'ADMIN', 'SUPER_ADMIN']).optional(),
    isActive: z.boolean().optional(),
});

const addInternalNoteSchema = z.object({
    body: z.string().min(1),
});

const uploadUrlSchema = z.object({
    filename: z.string().min(1),
    contentType: z.string().min(1),
    prefix: z.string().optional().default('content'),
});

const createTrainingDefinitionSchema = z.object({
    trainingId: z.string().uuid(),
    completionRule: z.enum(['MANUAL_ACK', 'ALL_STEPS_VIEWED', 'ALL_STEPS_COMPLETED', 'MANUAL_COMPLETE']).optional(),
    estimatedMinutes: z.number().int().positive().optional(),
    allowDownloads: z.boolean().optional(),
    requireAcknowledgement: z.boolean().optional(),
});

const assignTrainingSchema = z.object({
    trainingId: z.string().uuid(),
    userId: z.string().uuid(),
    isRequired: z.boolean().optional(),
    dueAt: z.string().datetime().optional(),
});

// ============================================
// Route Registration
// ============================================

export async function adminRoutes(app: FastifyInstance) {
    // All routes require admin auth
    app.addHook('preHandler', async (request, reply) => {
        await authenticate(request, reply);
        if (reply.sent) return;
        await requireAdmin(request, reply);
    });

    // ============================================
    // Content Management
    // ============================================

    // GET /admin/content - List all content items (including drafts)
    app.get('/admin/content', async (request: FastifyRequest) => {
        const query = request.query as { status?: string; kind?: string; page?: string; pageSize?: string };

        return contentService.getContentItems({
            status: query.status as any,
            kind: query.kind as any,
            page: query.page ? parseInt(query.page) : 1,
            pageSize: query.pageSize ? parseInt(query.pageSize) : 20,
        }, true);
    });

    // GET /admin/content/:id - Get a single content item with details
    app.get('/admin/content/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        const { id } = request.params;

        const item = await contentService.getContentItemWithDetails(id, true);

        if (!item) {
            return reply.code(404).send({ error: 'Content item not found' });
        }

        return item;
    });

    // POST /admin/content - Create content item
    app.post('/admin/content', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const body = createContentItemSchema.parse(request.body);

            const item = await contentService.createContentItem({
                ...body,
                createdByUserId: request.user!.userId,
            });

            return reply.code(201).send(item);
        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.code(400).send({ error: 'Invalid request', details: error.errors });
            }
            throw error;
        }
    });

    // PATCH /admin/content/:id - Update content item
    app.patch('/admin/content/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        try {
            const { id } = request.params;
            const body = updateContentItemSchema.parse(request.body);

            const item = await contentService.updateContentItem(id, {
                ...body,
                updatedByUserId: request.user!.userId,
            });

            if (!item) {
                return reply.code(404).send({ error: 'Item not found' });
            }

            return item;
        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.code(400).send({ error: 'Invalid request', details: error.errors });
            }
            throw error;
        }
    });

    // DELETE /admin/content/:id - Delete content item
    app.delete('/admin/content/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        const { id } = request.params;

        const item = await contentService.getContentItemById(id);
        if (!item) {
            return reply.code(404).send({ error: 'Item not found' });
        }

        await contentService.deleteContentItem(id);
        return { success: true };
    });

    // POST /admin/content/:id/publish - Publish content item
    app.post('/admin/content/:id/publish', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        const { id } = request.params;

        const item = await contentService.updateContentItem(id, {
            status: 'PUBLISHED',
            updatedByUserId: request.user!.userId,
        });

        if (!item) {
            return reply.code(404).send({ error: 'Item not found' });
        }

        return item;
    });

    // POST /admin/content/upload-url - Get signed upload URL
    app.post('/admin/content/upload-url', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const body = uploadUrlSchema.parse(request.body);

            const storageKey = generateStorageKey(body.prefix, body.filename);
            const uploadUrl = await getSignedUploadUrl(storageKey, body.contentType);

            return { uploadUrl, storageKey };
        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.code(400).send({ error: 'Invalid request', details: error.errors });
            }
            throw error;
        }
    });

    // ============================================
    // Content Asset Management
    // ============================================

    // POST /admin/content/:id/assets - Add asset to content item
    app.post('/admin/content/:id/assets', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        try {
            const { id } = request.params;
            const body = z.object({
                storageObjectId: z.string().uuid(),
                assetRole: z.enum(['PRIMARY', 'THUMBNAIL', 'EMBED', 'ATTACHMENT', 'CAPTIONS', 'POSTER']),
                filename: z.string().min(1),
                altText: z.string().optional(),
                caption: z.string().optional(),
            }).parse(request.body);

            // Verify content item exists
            const item = await contentService.getContentItemById(id);
            if (!item) {
                return reply.code(404).send({ error: 'Content item not found' });
            }

            const asset = await contentService.addContentAsset({
                contentItemId: id,
                ...body,
            });

            // Get the asset with URL
            const assetWithUrl = await contentService.getContentAssetWithUrl(asset.id);

            return reply.code(201).send(assetWithUrl);
        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.code(400).send({ error: 'Invalid request', details: error.errors });
            }
            throw error;
        }
    });

    // GET /admin/content/:id/assets - Get all assets for content item
    app.get('/admin/content/:id/assets', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        const { id } = request.params;

        const item = await contentService.getContentItemById(id);
        if (!item) {
            return reply.code(404).send({ error: 'Content item not found' });
        }

        return contentService.getContentAssetsWithUrls(id);
    });

    // DELETE /admin/content/:contentId/assets/:assetId - Delete an asset
    app.delete('/admin/content/:contentId/assets/:assetId', async (
        request: FastifyRequest<{ Params: { contentId: string; assetId: string } }>,
        reply: FastifyReply
    ) => {
        const { contentId, assetId } = request.params;

        const item = await contentService.getContentItemById(contentId);
        if (!item) {
            return reply.code(404).send({ error: 'Content item not found' });
        }

        // Delete asset with full storage cleanup
        await contentService.deleteContentAssetWithStorage(assetId);

        return { success: true };
    });

    // POST /admin/content/:id/sync-assets - Sync assets with body content (cleanup orphans)
    app.post('/admin/content/:id/sync-assets', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        const { id } = request.params;

        // Get the content item with body
        const item = await contentService.getContentItemWithDetails(id, false);
        if (!item) {
            return reply.code(404).send({ error: 'Content item not found' });
        }

        console.log(`[sync-assets] Content ${id}, bodyJson exists:`, !!item.bodyJson);

        // Sync assets and delete orphans
        const deletedAssetIds = await contentService.syncContentAssets(id, item.bodyJson as any);

        console.log(`[sync-assets] Deleted ${deletedAssetIds.length} orphaned assets:`, deletedAssetIds);

        return {
            success: true,
            deletedAssetIds,
            deletedCount: deletedAssetIds.length,
        };
    });


    // Categories
    app.get('/admin/content/categories', async () => {
        return contentService.getCategories();
    });

    app.post('/admin/content/categories', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const body = createCategorySchema.parse(request.body);
            const category = await contentService.createCategory(body);
            return reply.code(201).send(category);
        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.code(400).send({ error: 'Invalid request', details: error.errors });
            }
            throw error;
        }
    });

    app.patch('/admin/content/categories/:id', async (request: FastifyRequest<{ Params: { id: string } }>, _reply: FastifyReply) => {
        const { id } = request.params;
        const body = createCategorySchema.partial().parse(request.body);
        const category = await contentService.updateCategory(id, body);
        return category;
    });

    app.delete('/admin/content/categories/:id', async (request: FastifyRequest<{ Params: { id: string } }>) => {
        await contentService.deleteCategory(request.params.id);
        return { success: true };
    });

    // Tags
    app.get('/admin/content/tags', async () => {
        return contentService.getTags();
    });

    app.post('/admin/content/tags', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const body = createTagSchema.parse(request.body);
            const tag = await contentService.createTag(body);
            return reply.code(201).send(tag);
        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.code(400).send({ error: 'Invalid request', details: error.errors });
            }
            throw error;
        }
    });

    app.patch('/admin/content/tags/:id', async (request: FastifyRequest<{ Params: { id: string } }>, _reply: FastifyReply) => {
        const { id } = request.params;
        const body = createTagSchema.partial().parse(request.body);
        const tag = await contentService.updateTag(id, body);
        return tag;
    });

    app.delete('/admin/content/tags/:id', async (request: FastifyRequest<{ Params: { id: string } }>) => {
        await contentService.deleteTag(request.params.id);
        return { success: true };
    });

    // ============================================
    // Training Management
    // ============================================

    // POST /admin/training/definitions - Create training definition
    app.post('/admin/training/definitions', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const body = createTrainingDefinitionSchema.parse(request.body);
            const definition = await trainingService.createTrainingDefinition(body);
            return reply.code(201).send(definition);
        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.code(400).send({ error: 'Invalid request', details: error.errors });
            }
            throw error;
        }
    });

    // POST /admin/training/assignments - Assign training to user
    app.post('/admin/training/assignments', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const body = assignTrainingSchema.parse(request.body);
            const assignment = await trainingService.createAssignment({
                ...body,
                assignedByUserId: request.user!.userId,
                dueAt: body.dueAt ? new Date(body.dueAt) : undefined,
            });
            return reply.code(201).send(assignment);
        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.code(400).send({ error: 'Invalid request', details: error.errors });
            }
            throw error;
        }
    });

    // DELETE /admin/training/assignments/:id - Revoke training assignment
    app.delete('/admin/training/assignments/:id', async (request: FastifyRequest<{ Params: { id: string } }>) => {
        await trainingService.revokeAssignment(request.params.id, request.user!.userId);
        return { success: true };
    });

    // POST /admin/training/assignments/:id/waive - Waive training
    app.post('/admin/training/assignments/:id/waive', async (request: FastifyRequest<{ Params: { id: string } }>, _reply: FastifyReply) => {
        const { reason } = request.body as { reason?: string };
        await trainingService.waiveAssignment(request.params.id, request.user!.userId, reason);
        return { success: true };
    });

    // GET /admin/training/:trainingId/stats - Get training statistics
    app.get('/admin/training/:trainingId/stats', async (request: FastifyRequest<{ Params: { trainingId: string } }>) => {
        return trainingService.getTrainingStats(request.params.trainingId);
    });

    // ============================================
    // Ticket Management
    // ============================================

    // GET /admin/tickets - List all tickets
    app.get('/admin/tickets', async (request: FastifyRequest) => {
        const query = request.query as { status?: string; priority?: string; category?: string; assignedToUserId?: string; page?: string; pageSize?: string };

        return ticketsService.getTickets({
            status: query.status as any,
            priority: query.priority as any,
            category: query.category,
            assignedToUserId: query.assignedToUserId,
            page: query.page ? parseInt(query.page) : 1,
            pageSize: query.pageSize ? parseInt(query.pageSize) : 20,
        });
    });

    // GET /admin/tickets/stats - Get ticket statistics
    app.get('/admin/tickets/stats', async () => {
        return ticketsService.getTicketStats();
    });

    // PATCH /admin/tickets/:id - Update ticket
    app.patch('/admin/tickets/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        try {
            const { id } = request.params;
            const body = updateTicketSchema.parse(request.body);

            const ticket = await ticketsService.updateTicket(id, body, request.user!.userId);

            if (!ticket) {
                return reply.code(404).send({ error: 'Ticket not found' });
            }

            return ticket;
        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.code(400).send({ error: 'Invalid request', details: error.errors });
            }
            throw error;
        }
    });

    // POST /admin/tickets/:id/internal-note - Add internal note
    app.post('/admin/tickets/:id/internal-note', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        try {
            const { id } = request.params;
            const body = addInternalNoteSchema.parse(request.body);

            const message = await ticketsService.addTicketMessage({
                ticketId: id,
                authorUserId: request.user!.userId,
                body: body.body,
                messageType: 'INTERNAL',
            });

            return reply.code(201).send(message);
        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.code(400).send({ error: 'Invalid request', details: error.errors });
            }
            throw error;
        }
    });

    // ============================================
    // User Management
    // ============================================

    // GET /admin/users - List all users
    app.get('/admin/users', async (request: FastifyRequest) => {
        const query = request.query as { role?: string; status?: string; search?: string };

        const allUsers = await db.select({
            id: users.id,
            email: users.email,
            name: users.name,
            role: users.role,
            isActive: users.isActive,
            createdAt: users.createdAt,
        }).from(users);

        // Simple filtering
        let filtered = allUsers;
        if (query.role) {
            filtered = filtered.filter(u => u.role === query.role);
        }
        if (query.status === 'active') {
            filtered = filtered.filter(u => u.isActive);
        } else if (query.status === 'inactive') {
            filtered = filtered.filter(u => !u.isActive);
        }
        if (query.search) {
            const search = query.search.toLowerCase();
            filtered = filtered.filter(u =>
                u.name.toLowerCase().includes(search) ||
                u.email.toLowerCase().includes(search)
            );
        }

        return filtered;
    });

    // POST /admin/users - Create user
    app.post('/admin/users', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const body = createUserSchema.parse(request.body);

            // Check if email exists
            const existing = await authService.findUserByEmail(body.email);
            if (existing) {
                return reply.code(400).send({ error: 'Email already in use' });
            }

            // Generate temporary password
            const temporaryPassword = generateToken(8);
            const passwordHash = await hashPassword(temporaryPassword);

            // Create user
            const [user] = await db.insert(users).values({
                ...body,
                email: body.email.toLowerCase(),
                passwordHash,
            }).returning({
                id: users.id,
                email: users.email,
                name: users.name,
                role: users.role,
                isActive: users.isActive,
                createdAt: users.createdAt,
            });

            // Send welcome email (async, don't wait)
            sendWelcomeEmail(user.email, user.name, temporaryPassword).catch(console.error);

            // Log temp password in dev
            console.log(`[DEV] Created user ${user.email} with temporary password: ${temporaryPassword}`);

            return reply.code(201).send(user);
        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.code(400).send({ error: 'Invalid request', details: error.errors });
            }
            throw error;
        }
    });

    // PATCH /admin/users/:id - Update user
    app.patch('/admin/users/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        try {
            const { id } = request.params;
            const body = updateUserSchema.parse(request.body);

            // Can't edit own role
            if (id === request.user!.userId && body.role) {
                return reply.code(400).send({ error: 'Cannot change your own role' });
            }

            // Check email uniqueness
            if (body.email) {
                const existing = await authService.findUserByEmail(body.email);
                if (existing && existing.id !== id) {
                    return reply.code(400).send({ error: 'Email already in use' });
                }
            }

            const [user] = await db.update(users).set({
                ...body,
                ...(body.email && { email: body.email.toLowerCase() }),
                updatedAt: new Date(),
            }).where(eq(users.id, id)).returning({
                id: users.id,
                email: users.email,
                name: users.name,
                role: users.role,
                isActive: users.isActive,
            });

            if (!user) {
                return reply.code(404).send({ error: 'User not found' });
            }

            return user;
        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.code(400).send({ error: 'Invalid request', details: error.errors });
            }
            throw error;
        }
    });

    // POST /admin/users/:id/reset-password - Trigger password reset
    app.post('/admin/users/:id/reset-password', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        const { id } = request.params;

        const user = await authService.findUserById(id);
        if (!user) {
            return reply.code(404).send({ error: 'User not found' });
        }

        const result = await authService.createPasswordResetToken(user.email);

        if (result.token) {
            console.log(`[DEV] Password reset token for ${result.email}: ${result.token}`);
        }

        return { success: true, message: 'Password reset email sent' };
    });
}
