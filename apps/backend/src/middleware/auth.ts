/**
 * Authentication Middleware
 * 
 * JWT-based authentication and role-based authorization.
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import type { JWTPayload } from '../lib/jwt';
import type { UserRole } from '../db/schema';

/**
 * Authenticate middleware - verifies JWT access token
 */
export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
    try {
        const authHeader = request.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return reply.code(401).send({
                error: 'Unauthorized',
                message: 'Missing or invalid authorization header',
            });
        }

        // Verify the token using Fastify JWT (automatically extracts from Authorization header)
        const decoded = await request.jwtVerify<JWTPayload>();

        // Check if it's an access token (not refresh)
        if (decoded.type !== 'access') {
            return reply.code(401).send({
                error: 'Unauthorized',
                message: 'Invalid token type',
            });
        }

        // Attach user to request
        request.user = decoded;
    } catch (error) {
        return reply.code(401).send({
            error: 'Unauthorized',
            message: 'Invalid or expired token',
        });
    }
}

/**
 * Require specific roles middleware factory
 */
export function requireRole(...roles: UserRole[]) {
    return async function (request: FastifyRequest, reply: FastifyReply) {
        if (!request.user) {
            return reply.code(401).send({
                error: 'Unauthorized',
                message: 'Not authenticated',
            });
        }

        if (!roles.includes(request.user.role as UserRole)) {
            return reply.code(403).send({
                error: 'Forbidden',
                message: 'Insufficient permissions',
            });
        }
    };
}

/**
 * Require admin role middleware (ADMIN or SUPER_ADMIN)
 */
export const requireAdmin = requireRole('ADMIN', 'SUPER_ADMIN');

/**
 * Require super admin role middleware
 */
export const requireSuperAdmin = requireRole('SUPER_ADMIN');

/**
 * Require at least employee role (any authenticated user)
 */
export const requireAuthenticated = requireRole('EMPLOYEE', 'ADMIN', 'SUPER_ADMIN');
