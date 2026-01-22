/**
 * Database Reset Script
 * 
 * Drops all tables and types, then reseeds with fresh data.
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { sql } from 'drizzle-orm';

async function reset() {
    const databaseUrl = process.env.DATABASE_URL || 'postgresql://helpdesk:helpdesk_password@localhost:5432/helpdesk_dev';

    console.log('🔄 Connecting to database...');

    const pool = new Pool({
        connectionString: databaseUrl,
    });

    const db = drizzle(pool);

    console.log('🗑️  Dropping all tables and types...');

    try {
        // Drop all tables and types in public schema
        await db.execute(sql`
            DO $$ DECLARE
                r RECORD;
            BEGIN
                -- Drop all tables
                FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
                    EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
                END LOOP;
                
                -- Drop all custom types (enums)
                FOR r IN (SELECT typname FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'public' AND t.typtype = 'e') LOOP
                    EXECUTE 'DROP TYPE IF EXISTS ' || quote_ident(r.typname) || ' CASCADE';
                END LOOP;
            END $$;
        `);

        console.log('✅ All tables and types dropped!');
        console.log('');

    } catch (error) {
        console.error('❌ Reset failed:', error);
        await pool.end();
        process.exit(1);
    }

    await pool.end();

    console.log('📦 Pushing new schema...');

    // Run drizzle-kit push (newer syntax)
    const pushProc = Bun.spawn(['npx', 'drizzle-kit', 'push'], {
        cwd: import.meta.dir + '/../..',
        stdout: 'inherit',
        stderr: 'inherit',
        stdin: 'inherit', // Allow interactive input if needed
    });

    const pushExitCode = await pushProc.exited;

    if (pushExitCode !== 0) {
        console.error('❌ Schema push failed');
        process.exit(1);
    }

    console.log('✅ Schema pushed successfully!');
    console.log('');
    console.log('🌱 Running seed script...');

    // Import and run seed
    await import('./seed');
}

reset();
