/**
 * Storage Routes
 * 
 * Endpoints for managing storage objects (uploaded files).
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../../middleware/auth';
import * as storageService from '../../services/storage.service';
import { getSignedDownloadUrl, BUCKET_NAME } from '../../lib/s3';

// ============================================
// Request Schemas
// ============================================

const createStorageObjectSchema = z.object({
    storageKey: z.string().min(1),
    filename: z.string().min(1),
    mimeType: z.string().min(1),
    sizeBytes: z.number().int().positive(),
    sha256: z.string().optional(),
});

// ============================================
// Route Registration
// ============================================

export async function storageRoutes(app: FastifyInstance) {
    // All routes require authentication
    app.addHook('preHandler', authenticate);

    // POST /storage/objects - Register a storage object after upload
    app.post('/storage/objects', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const body = createStorageObjectSchema.parse(request.body);

            // Create storage object record
            const storageObject = await storageService.createStorageObject({
                bucket: BUCKET_NAME,
                objectKey: body.storageKey,
                mimeType: body.mimeType,
                sizeBytes: body.sizeBytes,
                sha256: body.sha256,
            });

            // Get a signed URL for the object
            const url = await getSignedDownloadUrl(body.storageKey);

            return reply.code(201).send({
                id: storageObject.id,
                objectKey: storageObject.objectKey,
                mimeType: storageObject.mimeType,
                sizeBytes: storageObject.sizeBytes,
                url,
            });
        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.code(400).send({ error: 'Invalid request', details: error.errors });
            }
            throw error;
        }
    });

    // GET /storage/objects/:id - Get storage object with signed URL
    app.get('/storage/objects/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        const { id } = request.params;

        const storageObject = await storageService.getStorageObjectById(id);
        if (!storageObject) {
            return reply.code(404).send({ error: 'Storage object not found' });
        }

        const url = await getSignedDownloadUrl(storageObject.objectKey);

        return {
            id: storageObject.id,
            objectKey: storageObject.objectKey,
            mimeType: storageObject.mimeType,
            sizeBytes: storageObject.sizeBytes,
            url,
        };
    });
}
