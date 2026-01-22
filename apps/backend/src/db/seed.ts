/**
 * Database Seed Script
 * 
 * Populates the database with initial data for development/testing.
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { hashPassword } from '../lib/crypto';
import {
    users,
    contentCategories,
    contentTags,
    contentItems,
    contentArticleBodies,
    contentItemTags,
    trainingDefinitions,
    trainingSteps,
    trainingAssignments,
    trainingAssignmentProgress,
    tickets,
    ticketMessages,
    ticketStatusHistory,
    notifications,
} from './schema';

async function main() {
    const databaseUrl = process.env.DATABASE_URL || 'postgresql://helpdesk:helpdesk_password@localhost:5432/helpdesk_dev';

    console.log('🔄 Connecting to database...');

    const pool = new Pool({
        connectionString: databaseUrl,
    });

    const db = drizzle(pool);

    console.log('🌱 Seeding database...');

    try {
        // ============================================
        // Create Admin User
        // ============================================
        console.log('  → Creating admin user...');
        const adminPasswordHash = await hashPassword('admin123');
        const [adminUser] = await db.insert(users).values({
            email: 'admin@company.com',
            name: 'IT Administrator',
            passwordHash: adminPasswordHash,
            role: 'ADMIN',
            isActive: true,
        }).returning();

        // ============================================
        // Create Super Admin User
        // ============================================
        console.log('  → Creating super admin user...');
        const superAdminPasswordHash = await hashPassword('superadmin123');
        const [_superAdminUser] = await db.insert(users).values({
            email: 'superadmin@company.com',
            name: 'Super Administrator',
            passwordHash: superAdminPasswordHash,
            role: 'SUPER_ADMIN',
            isActive: true,
        }).returning();

        // ============================================
        // Create Employee Users
        // ============================================
        console.log('  → Creating employee users...');
        const employeePasswordHash = await hashPassword('password123');

        const [employee1] = await db.insert(users).values({
            email: 'john.doe@company.com',
            name: 'John Doe',
            passwordHash: employeePasswordHash,
            role: 'EMPLOYEE',
            isActive: true,
        }).returning();

        const [employee2] = await db.insert(users).values({
            email: 'jane.smith@company.com',
            name: 'Jane Smith',
            passwordHash: employeePasswordHash,
            role: 'EMPLOYEE',
            isActive: true,
        }).returning();

        // ============================================
        // Create Content Categories
        // ============================================
        console.log('  → Creating content categories...');
        const [catOnboarding] = await db.insert(contentCategories).values({
            name: 'Onboarding',
            slug: 'onboarding',
        }).returning();

        const [_catSoftware] = await db.insert(contentCategories).values({
            name: 'Software',
            slug: 'software',
        }).returning();

        const [_catHardware] = await db.insert(contentCategories).values({
            name: 'Hardware',
            slug: 'hardware',
        }).returning();

        const [catNetwork] = await db.insert(contentCategories).values({
            name: 'Network',
            slug: 'network',
        }).returning();

        const [catSecurity] = await db.insert(contentCategories).values({
            name: 'Security',
            slug: 'security',
        }).returning();

        // ============================================
        // Create Content Tags
        // ============================================
        console.log('  → Creating content tags...');
        const [tagVpn] = await db.insert(contentTags).values({ name: 'VPN', slug: 'vpn' }).returning();
        const [_tagOutlook] = await db.insert(contentTags).values({ name: 'Outlook', slug: 'outlook' }).returning();
        const [_tagPasswordReset] = await db.insert(contentTags).values({ name: 'Password Reset', slug: 'password-reset' }).returning();
        const [tag2fa] = await db.insert(contentTags).values({ name: '2FA', slug: '2fa' }).returning();
        const [_tagTeams] = await db.insert(contentTags).values({ name: 'Teams', slug: 'teams' }).returning();
        const [_tagPrinter] = await db.insert(contentTags).values({ name: 'Printer', slug: 'printer' }).returning();

        // ============================================
        // Create Content Items (Articles, Videos, Documents)
        // ============================================
        console.log('  → Creating content items...');

        // Article 1: VPN Troubleshooting
        const [article1] = await db.insert(contentItems).values({
            kind: 'ARTICLE',
            status: 'PUBLISHED',
            visibility: 'ALL_EMPLOYEES',
            title: 'Troubleshooting VPN Connection Issues',
            summary: 'Step-by-step guide to resolve common VPN errors including "Connection Failed" and "Authentication Error".',
            categoryId: catNetwork.id,
            createdByUserId: adminUser.id,
            publishedAt: new Date(),
        }).returning();

        await db.insert(contentArticleBodies).values({
            contentItemId: article1.id,
            bodyMarkdown: `## Common VPN Connection Issues

If you're experiencing VPN connection problems, follow these steps:

### 1. Check Your Internet Connection
Ensure you have a stable internet connection before attempting to connect to the VPN.

### 2. Restart the VPN Client
Close the VPN client completely and reopen it.

### 3. Update VPN Client
Make sure you have the latest version of the VPN client installed.

### 4. Clear VPN Cache
Go to Settings > Clear Cache in the VPN client.`,
            bodyPlaintext: 'Common VPN Connection Issues. If you are experiencing VPN connection problems follow these steps. Check Your Internet Connection. Ensure you have a stable internet connection before attempting to connect to the VPN. Restart the VPN Client. Close the VPN client completely and reopen it. Update VPN Client. Make sure you have the latest version of the VPN client installed. Clear VPN Cache. Go to Settings Clear Cache in the VPN client.',
        });

        await db.insert(contentItemTags).values([
            { contentItemId: article1.id, tagId: tagVpn.id },
        ]);

        // Article 2: Security Training (Video)
        const [video1] = await db.insert(contentItems).values({
            kind: 'VIDEO',
            status: 'PUBLISHED',
            visibility: 'ALL_EMPLOYEES',
            title: 'Phishing Awareness Training 2023',
            summary: 'Watch this mandatory 5-minute video on how to identify and report suspicious emails.',
            categoryId: catSecurity.id,
            createdByUserId: adminUser.id,
            publishedAt: new Date(),
        }).returning();

        await db.insert(contentItemTags).values([
            { contentItemId: video1.id, tagId: tag2fa.id },
        ]);

        // Document: New Employee Checklist
        const [doc1] = await db.insert(contentItems).values({
            kind: 'DOCUMENT',
            status: 'PUBLISHED',
            visibility: 'ALL_EMPLOYEES',
            title: 'New Employee IT Checklist',
            summary: 'Complete list of software installations, account setups, and hardware requests for new hires.',
            categoryId: catOnboarding.id,
            createdByUserId: adminUser.id,
            publishedAt: new Date(),
        }).returning();

        // ============================================
        // Create Training
        // ============================================
        console.log('  → Creating training...');

        // Training: Security Awareness Training
        const [training1] = await db.insert(contentItems).values({
            kind: 'TRAINING',
            status: 'PUBLISHED',
            visibility: 'ALL_EMPLOYEES',
            title: 'Security Awareness Training 2023',
            summary: 'Mandatory training covering phishing, password security, and data protection.',
            categoryId: catSecurity.id,
            createdByUserId: adminUser.id,
            publishedAt: new Date(),
        }).returning();

        await db.insert(trainingDefinitions).values({
            trainingId: training1.id,
            completionRule: 'ALL_STEPS_VIEWED',
            estimatedMinutes: 30,
            allowDownloads: false,
            requireAcknowledgement: true,
        });

        // Training steps
        await db.insert(trainingSteps).values([
            {
                trainingId: training1.id,
                stepIndex: 0,
                contentItemId: video1.id,
                isRequired: true,
                minViewSeconds: 300,
            },
            {
                trainingId: training1.id,
                stepIndex: 1,
                contentItemId: doc1.id,
                isRequired: true,
                requiresAck: true,
            },
        ]);

        // Assign training to employees
        const [assignment1] = await db.insert(trainingAssignments).values({
            trainingId: training1.id,
            userId: employee1.id,
            assignedByUserId: adminUser.id,
            isRequired: true,
            dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        }).returning();

        await db.insert(trainingAssignmentProgress).values({
            assignmentId: assignment1.id,
            status: 'ASSIGNED',
            progressPercent: 0,
        });

        const [assignment2] = await db.insert(trainingAssignments).values({
            trainingId: training1.id,
            userId: employee2.id,
            assignedByUserId: adminUser.id,
            isRequired: true,
            dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        }).returning();

        await db.insert(trainingAssignmentProgress).values({
            assignmentId: assignment2.id,
            status: 'ASSIGNED',
            progressPercent: 0,
        });

        // ============================================
        // Create Sample Tickets
        // ============================================
        console.log('  → Creating sample tickets...');

        // Ticket 1: VPN Issue
        const [ticket1] = await db.insert(tickets).values({
            subject: 'VPN Connection Failed',
            description: 'I cannot connect to the VPN since this morning. I keep getting "Connection Failed" error.',
            category: 'Network',
            priority: 'HIGH',
            status: 'OPEN',
            requesterUserId: employee1.id,
        }).returning();

        await db.insert(ticketMessages).values({
            ticketId: ticket1.id,
            authorUserId: employee1.id,
            body: 'I cannot connect to the VPN since this morning. I keep getting "Connection Failed" error.',
            messageType: 'PUBLIC',
        });

        await db.insert(ticketStatusHistory).values({
            ticketId: ticket1.id,
            toStatus: 'OPEN',
            changedByUserId: employee1.id,
        });

        // Ticket 2: Software License
        const [ticket2] = await db.insert(tickets).values({
            subject: 'Software License Request: Adobe',
            description: 'I need Adobe Creative Cloud license for the new design project.',
            category: 'Software',
            priority: 'MEDIUM',
            status: 'IN_PROGRESS',
            requesterUserId: employee2.id,
            assignedToUserId: adminUser.id,
        }).returning();

        await db.insert(ticketMessages).values({
            ticketId: ticket2.id,
            authorUserId: employee2.id,
            body: 'I need Adobe Creative Cloud license for the new design project.',
            messageType: 'PUBLIC',
        });

        await db.insert(ticketMessages).values({
            ticketId: ticket2.id,
            authorUserId: adminUser.id,
            body: 'I have submitted the license request to procurement. Should be approved within 2 business days.',
            messageType: 'PUBLIC',
        });

        await db.insert(ticketStatusHistory).values({
            ticketId: ticket2.id,
            toStatus: 'OPEN',
            changedByUserId: employee2.id,
        });

        await db.insert(ticketStatusHistory).values({
            ticketId: ticket2.id,
            fromStatus: 'OPEN',
            toStatus: 'IN_PROGRESS',
            changedByUserId: adminUser.id,
        });

        // Ticket 3: Resolved
        const [ticket3] = await db.insert(tickets).values({
            subject: 'Email Password Reset',
            description: 'I forgot my email password and need it reset.',
            category: 'Access',
            priority: 'LOW',
            status: 'RESOLVED',
            requesterUserId: employee1.id,
            assignedToUserId: adminUser.id,
        }).returning();

        await db.insert(ticketMessages).values({
            ticketId: ticket3.id,
            authorUserId: employee1.id,
            body: 'I forgot my email password and need it reset.',
            messageType: 'PUBLIC',
        });

        await db.insert(ticketMessages).values({
            ticketId: ticket3.id,
            authorUserId: adminUser.id,
            body: 'Password has been reset. Please check your phone for the temporary password.',
            messageType: 'PUBLIC',
        });

        // ============================================
        // Create Sample Notifications
        // ============================================
        console.log('  → Creating sample notifications...');

        await db.insert(notifications).values([
            {
                userId: employee1.id,
                type: 'TRAINING_DUE',
                title: 'Training Due Soon',
                body: 'Security Awareness Training 2023 is due in 7 days.',
                link: { screen: 'training', id: training1.id },
            },
            {
                userId: employee1.id,
                type: 'TICKET_UPDATED',
                title: 'Ticket Updated',
                body: 'Your ticket "VPN Connection Failed" has been viewed by IT.',
                link: { screen: 'ticket', id: ticket1.id },
            },
        ]);

        console.log('✅ Database seeded successfully!');
        console.log('');
        console.log('📋 Test Accounts:');
        console.log('   Super Admin: superadmin@company.com / superadmin123');
        console.log('   Admin: admin@company.com / admin123');
        console.log('   Employee: john.doe@company.com / password123');
        console.log('   Employee: jane.smith@company.com / password123');
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }

    process.exit(0);
}

main();
