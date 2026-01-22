/**
 * Authentication Routes
 * 
 * Handles login, logout, token refresh, and password reset.
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../../middleware/auth';
import * as authService from '../../services/auth.service';
import { validatePassword } from '../../lib/crypto';
import { db, users } from '../../db';
import { eq } from 'drizzle-orm';
import { hashPassword } from '../../lib/crypto';

// ============================================
// Request Schemas
// ============================================

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
    deviceLabel: z.string().optional(),
});

const refreshSchema = z.object({
    refreshToken: z.string().min(1),
});

const forgotPasswordSchema = z.object({
    email: z.string().email(),
});

const resetPasswordSchema = z.object({
    token: z.string().min(1),
    password: z.string().min(8),
});

const updateProfileSchema = z.object({
    name: z.string().min(1).max(255).optional(),
    email: z.string().email().optional(),
});

const changePasswordSchema = z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8),
});

// ============================================
// Route Registration
// ============================================

export async function authRoutes(app: FastifyInstance) {
    // POST /auth/login
    app.post('/auth/login', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const body = loginSchema.parse(request.body);

            const result = await authService.login(
                app,
                body.email,
                body.password,
                body.deviceLabel
            );

            if (!result.success) {
                return reply.code(401).send({ error: result.error });
            }

            return {
                accessToken: result.accessToken,
                refreshToken: result.refreshToken,
                user: result.user,
            };
        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.code(400).send({ error: 'Invalid request', details: error.errors });
            }
            throw error;
        }
    });

    // POST /auth/refresh
    app.post('/auth/refresh', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const body = refreshSchema.parse(request.body);

            const result = await authService.refreshAccessToken(app, body.refreshToken);

            if (!result.success) {
                return reply.code(401).send({ error: result.error });
            }

            return { accessToken: result.accessToken };
        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.code(400).send({ error: 'Invalid request', details: error.errors });
            }
            throw error;
        }
    });

    // POST /auth/logout
    app.post('/auth/logout', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
        if (!request.user) {
            return reply.code(401).send({ error: 'Not authenticated' });
        }

        await authService.logout(request.user.sessionId);
        return { success: true };
    });

    // POST /auth/forgot-password
    app.post('/auth/forgot-password', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const body = forgotPasswordSchema.parse(request.body);

            const result = await authService.createPasswordResetToken(body.email);

            // Always return success to not reveal if email exists
            // In production, you would send an email here
            if (result.token) {
                console.log(`[DEV] Password reset token for ${result.email}: ${result.token}`);
            }

            return { success: true, message: 'If the email exists, a reset link has been sent' };
        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.code(400).send({ error: 'Invalid request', details: error.errors });
            }
            throw error;
        }
    });

    // POST /auth/reset-password
    app.post('/auth/reset-password', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const body = resetPasswordSchema.parse(request.body);

            const result = await authService.resetPassword(body.token, body.password);

            if (!result.success) {
                return reply.code(400).send({ error: 'Invalid request', details: result.errors });
            }

            return { success: true, message: 'Password reset successfully' };
        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.code(400).send({ error: 'Invalid request', details: error.errors });
            }
            throw error;
        }
    });

    // GET /auth/me
    app.get('/auth/me', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
        if (!request.user) {
            return reply.code(401).send({ error: 'Not authenticated' });
        }

        const user = await authService.findUserById(request.user.userId);

        if (!user) {
            return reply.code(404).send({ error: 'User not found' });
        }

        return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            createdAt: user.createdAt,
        };
    });

    // PATCH /auth/me
    app.patch('/auth/me', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
        if (!request.user) {
            return reply.code(401).send({ error: 'Not authenticated' });
        }

        try {
            const body = updateProfileSchema.parse(request.body);

            // Check if email is being changed and if it's unique
            if (body.email) {
                const existing = await authService.findUserByEmail(body.email);
                if (existing && existing.id !== request.user.userId) {
                    return reply.code(400).send({ error: 'Email already in use' });
                }
            }

            // Update user
            const [updated] = await db
                .update(users)
                .set({
                    ...(body.name && { name: body.name }),
                    ...(body.email && { email: body.email.toLowerCase() }),
                    updatedAt: new Date(),
                })
                .where(eq(users.id, request.user.userId))
                .returning();

            return {
                id: updated.id,
                email: updated.email,
                name: updated.name,
                role: updated.role,
            };
        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.code(400).send({ error: 'Invalid request', details: error.errors });
            }
            throw error;
        }
    });

    // POST /auth/change-password
    app.post('/auth/change-password', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
        if (!request.user) {
            return reply.code(401).send({ error: 'Not authenticated' });
        }

        try {
            const body = changePasswordSchema.parse(request.body);

            // Validate new password
            const validation = validatePassword(body.newPassword);
            if (!validation.valid) {
                return reply.code(400).send({ error: 'Invalid password', details: validation.errors });
            }

            // Get current user
            const user = await authService.findUserById(request.user.userId);
            if (!user) {
                return reply.code(404).send({ error: 'User not found' });
            }

            // Verify current password
            const { verifyPassword } = await import('../../lib/crypto');
            const validPassword = await verifyPassword(body.currentPassword, user.passwordHash);
            if (!validPassword) {
                return reply.code(400).send({ error: 'Current password is incorrect' });
            }

            // Update password
            const newHash = await hashPassword(body.newPassword);
            await db
                .update(users)
                .set({ passwordHash: newHash, updatedAt: new Date() })
                .where(eq(users.id, request.user.userId));

            return { success: true, message: 'Password changed successfully' };
        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.code(400).send({ error: 'Invalid request', details: error.errors });
            }
            throw error;
        }
    });

    // GET /auth/sessions
    app.get('/auth/sessions', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
        if (!request.user) {
            return reply.code(401).send({ error: 'Not authenticated' });
        }

        const sessions = await authService.getUserSessions(request.user.userId);

        return sessions.map(session => ({
            ...session,
            isCurrent: session.id === request.user!.sessionId,
        }));
    });

    // DELETE /auth/sessions/:id
    app.delete<{ Params: { id: string } }>('/auth/sessions/:id', { preHandler: [authenticate] }, async (request, reply) => {
        if (!request.user) {
            return reply.code(401).send({ error: 'Not authenticated' });
        }

        const { id } = request.params;

        // Can't revoke current session
        if (id === request.user.sessionId) {
            return reply.code(400).send({ error: 'Cannot revoke current session. Use logout instead.' });
        }

        const revoked = await authService.revokeSession(request.user.userId, id);

        if (!revoked) {
            return reply.code(404).send({ error: 'Session not found' });
        }

        return { success: true };
    });
}
