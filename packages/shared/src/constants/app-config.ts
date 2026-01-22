/**
 * Centralized Application Configuration
 * 
 * Edit these values to customize the application branding.
 * Changes here will be reflected throughout the entire application.
 */

export const APP_CONFIG = {
    /** Application name displayed in the UI */
    APP_NAME: 'IT Helpdesk Pro',

    /** Tagline shown below the app name */
    APP_TAGLINE: 'Enterprise Management Suite',

    /** Current application version */
    VERSION: '1.0.0',

    /** Build number (can be updated by CI/CD) */
    BUILD_NUMBER: '1',

    /** Default email domain for the organization */
    DEFAULT_EMAIL_DOMAIN: 'company.com',
} as const;

/** User roles in the system */
export const USER_ROLES = {
    EMPLOYEE: 'EMPLOYEE',
    ADMIN: 'ADMIN',
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

/** Ticket status values */
export const TICKET_STATUS = {
    OPEN: 'open',
    IN_PROGRESS: 'in_progress',
    WAITING_ON_EMPLOYEE: 'waiting_on_employee',
    RESOLVED: 'resolved',
    CLOSED: 'closed',
} as const;

export type TicketStatus = typeof TICKET_STATUS[keyof typeof TICKET_STATUS];

/** Ticket priority levels */
export const TICKET_PRIORITY = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    URGENT: 'urgent',
} as const;

export type TicketPriority = typeof TICKET_PRIORITY[keyof typeof TICKET_PRIORITY];

/** Ticket categories */
export const TICKET_CATEGORY = {
    HARDWARE: 'Hardware',
    SOFTWARE: 'Software',
    ACCESS: 'Access',
    NETWORK: 'Network',
    OTHER: 'Other',
} as const;

export type TicketCategory = typeof TICKET_CATEGORY[keyof typeof TICKET_CATEGORY];

/** Knowledge Base content types */
export const KB_CONTENT_TYPE = {
    ARTICLE: 'article',
    VIDEO: 'video',
    DOCUMENT: 'document',
} as const;

export type KBContentType = typeof KB_CONTENT_TYPE[keyof typeof KB_CONTENT_TYPE];

/** KB content status */
export const KB_STATUS = {
    DRAFT: 'draft',
    PUBLISHED: 'published',
} as const;

export type KBStatus = typeof KB_STATUS[keyof typeof KB_STATUS];
