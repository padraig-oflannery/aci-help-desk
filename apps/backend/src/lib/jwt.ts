/**
 * JWT Token Service
 * 
 * Handles JWT token generation and verification.
 */

import jwt from '@fastify/jwt';
import type { FastifyInstance } from 'fastify';

// Token expiry times
export const ACCESS_TOKEN_EXPIRY = '15m';
export const REFRESH_TOKEN_EXPIRY = '30d';

// JWT payload structure
export interface JWTPayload {
    userId: string;
    email: string;
    role: 'EMPLOYEE' | 'ADMIN' | 'SUPER_ADMIN';
    sessionId: string;
    type: 'access' | 'refresh';
}

/**
 * Register JWT plugin with Fastify
 */
export async function registerJWT(app: FastifyInstance) {
    await app.register(jwt, {
        secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
        sign: {
            algorithm: 'HS256',
        },
    });
}

/**
 * Generate an access token
 */
export function generateAccessToken(app: FastifyInstance, payload: Omit<JWTPayload, 'type'>): string {
    return app.jwt.sign(
        { ...payload, type: 'access' },
        { expiresIn: ACCESS_TOKEN_EXPIRY }
    );
}

/**
 * Generate a refresh token
 */
export function generateRefreshToken(app: FastifyInstance, payload: Omit<JWTPayload, 'type'>): string {
    return app.jwt.sign(
        { ...payload, type: 'refresh' },
        { expiresIn: REFRESH_TOKEN_EXPIRY }
    );
}

/**
 * Verify a JWT token
 */
export function verifyToken(app: FastifyInstance, token: string): JWTPayload {
    return app.jwt.verify<JWTPayload>(token);
}

// Extend @fastify/jwt to use our payload type
declare module '@fastify/jwt' {
    interface FastifyJWT {
        payload: JWTPayload;
        user: JWTPayload;
    }
}
