/**
 * Training Routes
 * 
 * Training assignment and progress endpoints for employees.
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authenticate } from '../../middleware/auth';
import * as trainingService from '../../services/training.service';

// ============================================
// Route Registration
// ============================================

export async function trainingRoutes(app: FastifyInstance) {
    // All routes require authentication
    app.addHook('preHandler', authenticate);

    // GET /training/assignments - Get current user's training assignments
    app.get('/training/assignments', async (request: FastifyRequest, reply: FastifyReply) => {
        if (!request.user) {
            return reply.code(401).send({ error: 'Not authenticated' });
        }

        const assignments = await trainingService.getActiveAssignmentsForUser(request.user.userId);
        return assignments;
    });

    // GET /training/assignments/:id - Get assignment details
    app.get('/training/assignments/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        if (!request.user) {
            return reply.code(401).send({ error: 'Not authenticated' });
        }

        const { id } = request.params;
        const assignment = await trainingService.getAssignmentById(id);

        if (!assignment) {
            return reply.code(404).send({ error: 'Assignment not found' });
        }

        // Check ownership (unless admin)
        if (assignment.assignment.userId !== request.user.userId && request.user.role === 'EMPLOYEE') {
            return reply.code(403).send({ error: 'Access denied' });
        }

        // Get steps for this training
        const steps = await trainingService.getTrainingSteps(assignment.assignment.trainingId);
        const stepProgress = await trainingService.getStepProgress(id);

        return {
            ...assignment,
            steps,
            stepProgress,
        };
    });

    // POST /training/assignments/:id/view-step - Mark a step as viewed
    app.post('/training/assignments/:id/view-step', async (request: FastifyRequest<{
        Params: { id: string };
        Body: { stepId: string };
    }>, reply: FastifyReply) => {
        if (!request.user) {
            return reply.code(401).send({ error: 'Not authenticated' });
        }

        const { id } = request.params;
        const { stepId } = request.body as { stepId: string };

        const assignment = await trainingService.getAssignmentById(id);

        if (!assignment || assignment.assignment.userId !== request.user.userId) {
            return reply.code(404).send({ error: 'Assignment not found' });
        }

        await trainingService.markStepViewed(id, stepId);

        return { success: true };
    });

    // POST /training/assignments/:id/complete-step - Mark a step as completed
    app.post('/training/assignments/:id/complete-step', async (request: FastifyRequest<{
        Params: { id: string };
        Body: { stepId: string };
    }>, reply: FastifyReply) => {
        if (!request.user) {
            return reply.code(401).send({ error: 'Not authenticated' });
        }

        const { id } = request.params;
        const { stepId } = request.body as { stepId: string };

        const assignment = await trainingService.getAssignmentById(id);

        if (!assignment || assignment.assignment.userId !== request.user.userId) {
            return reply.code(404).send({ error: 'Assignment not found' });
        }

        await trainingService.markStepCompleted(id, stepId);

        return { success: true };
    });

    // POST /training/assignments/:id/acknowledge - Acknowledge training
    app.post('/training/assignments/:id/acknowledge', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        if (!request.user) {
            return reply.code(401).send({ error: 'Not authenticated' });
        }

        const { id } = request.params;

        const assignment = await trainingService.getAssignmentById(id);

        if (!assignment || assignment.assignment.userId !== request.user.userId) {
            return reply.code(404).send({ error: 'Assignment not found' });
        }

        await trainingService.acknowledgeTraining(id, request.user.userId);

        return { success: true };
    });

    // POST /training/assignments/:id/complete - Mark training as complete
    app.post('/training/assignments/:id/complete', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        if (!request.user) {
            return reply.code(401).send({ error: 'Not authenticated' });
        }

        const { id } = request.params;

        const assignment = await trainingService.getAssignmentById(id);

        if (!assignment || assignment.assignment.userId !== request.user.userId) {
            return reply.code(404).send({ error: 'Assignment not found' });
        }

        await trainingService.completeTraining(id, request.user.userId);

        return { success: true };
    });

    // GET /training/stats - Get current user's training stats
    app.get('/training/stats', async (request: FastifyRequest, reply: FastifyReply) => {
        if (!request.user) {
            return reply.code(401).send({ error: 'Not authenticated' });
        }

        const stats = await trainingService.getUserTrainingStats(request.user.userId);
        return stats;
    });
}
