/**
 * Tickets API Tests
 */

import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { app } from '../src/index';

describe('Tickets API', () => {
    let userToken: string;
    let adminToken: string;
    let createdTicketId: string;

    beforeAll(async () => {
        await app.ready();

        // Login as employee
        const userLoginResponse = await app.inject({
            method: 'POST',
            url: '/auth/login',
            payload: {
                email: 'john.doe@company.com',
                password: 'password123',
            },
        });
        userToken = JSON.parse(userLoginResponse.body).accessToken;

        // Login as admin
        const adminLoginResponse = await app.inject({
            method: 'POST',
            url: '/auth/login',
            payload: {
                email: 'admin@company.com',
                password: 'admin123',
            },
        });
        adminToken = JSON.parse(adminLoginResponse.body).accessToken;
    });

    afterAll(async () => {
        await app.close();
    });

    describe('POST /tickets', () => {
        it('should create a ticket when authenticated', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/tickets',
                headers: {
                    Authorization: `Bearer ${userToken}`,
                },
                payload: {
                    subject: 'Test Ticket from API Tests',
                    category: 'Software',
                    priority: 'medium',
                    description: 'This is a test ticket created by the API tests.',
                },
            });

            expect(response.statusCode).toBe(201);
            const body = JSON.parse(response.body);
            expect(body.id).toBeDefined();
            expect(body.ticketNumber).toBeDefined();
            expect(body.subject).toBe('Test Ticket from API Tests');
            createdTicketId = body.id;
        });

        it('should reject missing required fields', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/tickets',
                headers: {
                    Authorization: `Bearer ${userToken}`,
                },
                payload: {
                    subject: 'Missing description',
                    category: 'Software',
                },
            });

            expect(response.statusCode).toBe(400);
        });
    });

    describe('GET /tickets', () => {
        it('should return user tickets', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/tickets',
                headers: {
                    Authorization: `Bearer ${userToken}`,
                },
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body.items).toBeDefined();
            expect(Array.isArray(body.items)).toBe(true);
        });
    });

    describe('GET /tickets/:id', () => {
        it('should return ticket details for owner', async () => {
            if (!createdTicketId) return;

            const response = await app.inject({
                method: 'GET',
                url: `/tickets/${createdTicketId}`,
                headers: {
                    Authorization: `Bearer ${userToken}`,
                },
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body.id).toBe(createdTicketId);
            expect(body.messages).toBeDefined();
        });
    });

    describe('POST /tickets/:id/messages', () => {
        it('should add message to ticket', async () => {
            if (!createdTicketId) return;

            const response = await app.inject({
                method: 'POST',
                url: `/tickets/${createdTicketId}/messages`,
                headers: {
                    Authorization: `Bearer ${userToken}`,
                },
                payload: {
                    body: 'This is a follow-up message from the test.',
                },
            });

            expect(response.statusCode).toBe(201);
            const body = JSON.parse(response.body);
            expect(body.body).toBe('This is a follow-up message from the test.');
        });
    });

    describe('Admin Endpoints', () => {
        it('GET /admin/tickets should return all tickets for admin', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/admin/tickets',
                headers: {
                    Authorization: `Bearer ${adminToken}`,
                },
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body.items).toBeDefined();
        });

        it('GET /admin/tickets/stats should return statistics', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/admin/tickets/stats',
                headers: {
                    Authorization: `Bearer ${adminToken}`,
                },
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body.open).toBeDefined();
            expect(body.total).toBeDefined();
        });

        it('should reject non-admin access to admin endpoints', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/admin/tickets',
                headers: {
                    Authorization: `Bearer ${userToken}`,
                },
            });

            expect(response.statusCode).toBe(403);
        });
    });
});
