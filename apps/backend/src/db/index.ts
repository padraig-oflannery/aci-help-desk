/**
 * Database Connection
 * 
 * Creates and exports a Drizzle ORM database instance.
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// Create PostgreSQL connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://helpdesk:helpdesk_password@localhost:5432/helpdesk_dev',
    max: 20, // Maximum number of connections
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Create Drizzle instance with schema
export const db = drizzle(pool, { schema });

// Export pool for direct queries if needed
export { pool };

// Export schema for convenience
export * from './schema';
