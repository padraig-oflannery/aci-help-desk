/**
 * Backend Health Check Tests
 * 
 * TDD: These tests verify the health check endpoint functionality.
 */

import { describe, expect, test, beforeAll, afterAll } from 'bun:test';
import { app } from '../src/index';

describe('Health Check Endpoint', () => {
    beforeAll(async () => {
        // Wait for app to be ready
        await app.ready();
    });

    afterAll(async () => {
        await app.close();
    });

    test('GET /health returns 200 with status ok', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/health',
        });

        expect(response.statusCode).toBe(200);

        const body = response.json();
        expect(body.status).toBe('ok');
        expect(body.app).toBe('IT Helpdesk Pro');
        expect(body.version).toBeDefined();
        expect(body.timestamp).toBeDefined();
    });

    test('GET / returns app info', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/',
        });

        expect(response.statusCode).toBe(200);

        const body = response.json();
        expect(body.name).toBe('IT Helpdesk Pro');
        expect(body.tagline).toBe('Enterprise Management Suite');
        expect(body.version).toBeDefined();
    });
});
