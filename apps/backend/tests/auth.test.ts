/**
 * Auth API Tests
 */

import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { app } from '../src/index';

describe('Auth API', () => {
    beforeAll(async () => {
        await app.ready();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('POST /auth/login', () => {
        it('should login with valid credentials', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/auth/login',
                payload: {
                    email: 'admin@company.com',
                    password: 'admin123',
                },
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body.accessToken).toBeDefined();
            expect(body.refreshToken).toBeDefined();
            expect(body.user.email).toBe('admin@company.com');
            expect(body.user.role).toBe('ADMIN');
        });

        it('should reject invalid credentials', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/auth/login',
                payload: {
                    email: 'admin@company.com',
                    password: 'wrongpassword',
                },
            });

            expect(response.statusCode).toBe(401);
        });

        it('should reject invalid email format', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/auth/login',
                payload: {
                    email: 'notanemail',
                    password: 'password123',
                },
            });

            expect(response.statusCode).toBe(400);
        });
    });

    describe('POST /auth/refresh', () => {
        it('should reject invalid refresh token', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/auth/refresh',
                payload: {
                    refreshToken: 'invalid-token',
                },
            });

            expect(response.statusCode).toBe(401);
        });
    });

    describe('GET /auth/me', () => {
        it('should reject unauthenticated request', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/auth/me',
            });

            expect(response.statusCode).toBe(401);
        });

        it('should return user info with valid token', async () => {
            // First login
            const loginResponse = await app.inject({
                method: 'POST',
                url: '/auth/login',
                payload: {
                    email: 'admin@company.com',
                    password: 'admin123',
                },
            });

            const { accessToken } = JSON.parse(loginResponse.body);

            // Then get user info
            const response = await app.inject({
                method: 'GET',
                url: '/auth/me',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body.email).toBe('admin@company.com');
        });
    });
});
