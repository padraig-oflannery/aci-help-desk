/**
 * Environment Configuration
 * 
 * Loads and validates environment variables.
 */

import { z } from 'zod';

const envSchema = z.object({
    // Server
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.string().transform(Number).default('3000'),
    API_URL: z.string().url().default('http://localhost:3000'),

    // Database
    DATABASE_URL: z.string().url(),

    // JWT
    JWT_SECRET: z.string().min(32),
    JWT_ACCESS_EXPIRY: z.string().default('15m'),
    JWT_REFRESH_EXPIRY: z.string().default('30d'),

    // S3/MinIO Storage
    S3_ENDPOINT: z.string().url().optional(),
    S3_REGION: z.string().default('us-east-1'),
    S3_ACCESS_KEY_ID: z.string().optional(),
    S3_SECRET_ACCESS_KEY: z.string().optional(),
    S3_BUCKET_NAME: z.string().optional(),
    S3_FORCE_PATH_STYLE: z.string().transform((v) => v === 'true').default('true'),

    // Cloudflare R2 Storage
    R2_ENDPOINT: z.string().url().optional(),
    R2_ACCESS_KEY_ID: z.string().optional(),
    R2_SECRET_ACCESS_KEY: z.string().optional(),

    // Email
    RESEND_API_KEY: z.string(),
    EMAIL_FROM: z.string().default('IT Helpdesk <noreply@yourdomain.com>'),
});

// Load environment variables
const parseEnv = () => {
    // Load .env file in development
    if (process.env.NODE_ENV !== 'production') {
        // Bun automatically loads .env files
    }

    const result = envSchema.safeParse(process.env);

    if (!result.success) {
        console.error('❌ Invalid environment variables:');
        console.error(result.error.format());
        throw new Error('Invalid environment variables');
    }

    return result.data;
};

export const env = parseEnv();

export type Env = z.infer<typeof envSchema>;
