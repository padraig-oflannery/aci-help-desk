/**
 * Database Migration Script
 * 
 * Runs Drizzle migrations against the database.
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';

async function main() {
    const databaseUrl = process.env.DATABASE_URL || 'postgresql://helpdesk:helpdesk_password@localhost:5432/helpdesk_dev';

    console.log('🔄 Connecting to database...');

    const pool = new Pool({
        connectionString: databaseUrl,
    });

    const db = drizzle(pool);

    console.log('🔄 Running migrations...');

    try {
        await migrate(db, { migrationsFolder: './src/db/migrations' });
        console.log('✅ Migrations completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }

    process.exit(0);
}

main();
