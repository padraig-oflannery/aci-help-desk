/**
 * Content Routes
 * 
 * Public content endpoints for employees (articles, videos, documents).
 * Replaces the previous KB routes.
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../../middleware/auth';
import * as contentService from '../../services/content.service';

// ============================================
// Request Schemas
// ============================================

const searchSchema = z.object({
    q: z.string().optional(),
    kind: z.enum(['ARTICLE', 'VIDEO', 'DOCUMENT', 'TRAINING']).optional(),
    categoryId: z.string().uuid().optional(),
    page: z.coerce.number().int().positive().optional().default(1),
    pageSize: z.coerce.number().int().positive().max(50).optional().default(20),
});

// ============================================
// Route Registration
// ============================================

export async function contentRoutes(app: FastifyInstance) {
    // All routes require authentication
    app.addHook('preHandler', authenticate);

    // GET /content/categories - List all categories
    app.get('/content/categories', async () => {
        return contentService.getCategories();
    });

    // GET /content/tags - List all tags
    app.get('/content/tags', async () => {
        return contentService.getTags();
    });

    // GET /content - Browse/search content items
    app.get('/content', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const query = searchSchema.parse(request.query);

            const result = await contentService.getContentItems({
                search: query.q,
                kind: query.kind,
                categoryId: query.categoryId,
                page: query.page,
                pageSize: query.pageSize,
            });

            return result;
        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.code(400).send({ error: 'Invalid request', details: error.errors });
            }
            throw error;
        }
    });

    // GET /content/:id - Get content item details
    app.get('/content/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        const { id } = request.params;

        const item = await contentService.getContentItemWithDetails(id);

        if (!item) {
            return reply.code(404).send({ error: 'Content not found' });
        }

        // Check if published (non-admins can only see published)
        if (item.status !== 'PUBLISHED' && request.user?.role === 'EMPLOYEE') {
            return reply.code(404).send({ error: 'Content not found' });
        }

        // Check visibility
        if (item.visibility === 'ADMINS_ONLY' && request.user?.role === 'EMPLOYEE') {
            return reply.code(403).send({ error: 'Access denied' });
        }

        // Resolve asset URLs in bodyJson for articles
        if (item.kind === 'ARTICLE' && item.bodyJson) {
            const resolvedBodyJson = await contentService.resolveAssetUrlsInTipTap(id, item.bodyJson as any);
            return {
                ...item,
                bodyJson: resolvedBodyJson,
            };
        }

        return item;
    });

    // GET /content/:id/download - Get download URL for content primary asset
    app.get('/content/:id/download', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        const { id } = request.params;

        const item = await contentService.getContentItemWithDetails(id, true);

        if (!item) {
            return reply.code(404).send({ error: 'Content not found' });
        }

        // Check if published (non-admins can only see published)
        if (item.status !== 'PUBLISHED' && request.user?.role === 'EMPLOYEE') {
            return reply.code(404).send({ error: 'Content not found' });
        }

        // Check visibility
        if (item.visibility === 'ADMINS_ONLY' && request.user?.role === 'EMPLOYEE') {
            return reply.code(403).send({ error: 'Access denied' });
        }

        // Find the primary asset
        const primaryAsset = item.assets?.find((a: any) => a.assetRole === 'PRIMARY') as { url?: string; filename: string } | undefined;

        if (!primaryAsset || !primaryAsset.url) {
            return reply.code(404).send({ error: 'No downloadable asset found' });
        }

        return { url: primaryAsset.url, filename: primaryAsset.filename };
    });
}
