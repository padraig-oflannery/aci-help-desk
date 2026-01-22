/**
 * KB API Tests
 */

import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { app } from '../src/index';

describe('Knowledge Base API', () => {
    let adminToken: string;

    beforeAll(async () => {
        await app.ready();

        // Login as admin
        const loginResponse = await app.inject({
            method: 'POST',
            url: '/auth/login',
            payload: {
                email: 'admin@company.com',
                password: 'admin123',
            },
        });
        adminToken = JSON.parse(loginResponse.body).accessToken;
    });

    afterAll(async () => {
        await app.close();
    });

    describe('GET /kb/categories', () => {
        it('should return categories when authenticated', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/kb/categories',
                headers: {
                    Authorization: `Bearer ${adminToken}`,
                },
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(Array.isArray(body)).toBe(true);
        });

        it('should reject unauthenticated request', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/kb/categories',
            });

            expect(response.statusCode).toBe(401);
        });
    });

    describe('GET /kb/items', () => {
        it('should return KB items when authenticated', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/kb/items',
                headers: {
                    Authorization: `Bearer ${adminToken}`,
                },
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body.items).toBeDefined();
            expect(body.total).toBeDefined();
            expect(body.page).toBeDefined();
        });

        it('should filter by type', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/kb/items?type=article',
                headers: {
                    Authorization: `Bearer ${adminToken}`,
                },
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            body.items.forEach((item: any) => {
                expect(item.type).toBe('article');
            });
        });
    });
});
