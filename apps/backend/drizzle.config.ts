import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    schema: './src/db/schema/*',
    out: './src/db/migrations',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL || 'postgresql://helpdesk:helpdesk_password@localhost:5432/helpdesk_dev',
    },
});
