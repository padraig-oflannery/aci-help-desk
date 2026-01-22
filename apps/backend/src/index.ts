/**
 * IT Helpdesk Pro - Backend Server
 * 
 * Fastify-based API server with PostgreSQL and S3 integration.
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import { APP_CONFIG } from '@helpdesk/shared';
import { authRoutes } from './routes/auth';
import { contentRoutes } from './routes/content';
import { trainingRoutes } from './routes/training';
import { ticketsRoutes } from './routes/tickets';
import { adminRoutes } from './routes/admin';
import { storageRoutes } from './routes/storage';

// Create Fastify instance
const app = Fastify({
    logger: process.env.NODE_ENV === 'production' ? true : {
        level: 'debug',
    },
});

// Register plugins
await app.register(cors, {
    origin: true, // Allow all origins in development
    credentials: true,
});

await app.register(helmet, {
    contentSecurityPolicy: false, // Disabled for Electron compatibility
});

// Register JWT plugin
await app.register(jwt, {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    sign: {
        algorithm: 'HS256',
    },
});

// Register routes
await app.register(authRoutes);
await app.register(contentRoutes);
await app.register(trainingRoutes);
await app.register(ticketsRoutes);
await app.register(adminRoutes);
await app.register(storageRoutes);

// Health check endpoint
app.get('/health', async () => {
    return {
        status: 'ok',
        app: APP_CONFIG.APP_NAME,
        version: APP_CONFIG.VERSION,
        timestamp: new Date().toISOString(),
    };
});

// API version/info endpoint
app.get('/', async () => {
    return {
        name: APP_CONFIG.APP_NAME,
        version: APP_CONFIG.VERSION,
        tagline: APP_CONFIG.APP_TAGLINE,
    };
});

// Start server only if this is the main module
const isMainModule = import.meta.main;

if (isMainModule) {
    const start = async () => {
        try {
            const port = parseInt(process.env.PORT || '3000', 10);
            const host = '0.0.0.0';

            await app.listen({ port, host });

            console.log(`🚀 ${APP_CONFIG.APP_NAME} API server running at http://localhost:${port}`);
            console.log(`📋 Health check: http://localhost:${port}/health`);
        } catch (err) {
            app.log.error(err);
            process.exit(1);
        }
    };

    start();
}

// Export for testing
export { app };
