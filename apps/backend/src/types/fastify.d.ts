/**
 * Fastify Type Extensions
 *
 * Extends Fastify types to include our custom properties.
 */

import { JWTPayload } from '../lib/jwt';

declare module 'fastify' {
    interface FastifyRequest {
        user?: JWTPayload;
    }
}
