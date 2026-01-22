/**
 * Shared Type Definitions
 * 
 * Types used across both backend and frontend.
 */

import type { UserRole, TicketStatus, TicketPriority, TicketCategory, KBContentType, KBStatus } from '../constants/app-config';

// ============================================
// User Types
// ============================================

export interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface UserSession {
    id: string;
    userId: string;
    deviceLabel: string | null;
    expiresAt: Date;
    createdAt: Date;
}

// ============================================
// Auth Types
// ============================================

export interface LoginRequest {
    email: string;
    password: string;
    rememberDevice?: boolean;
}

export interface LoginResponse {
    accessToken: string;
    refreshToken: string;
    user: User;
}

export interface RefreshRequest {
    refreshToken: string;
}

export interface RefreshResponse {
    accessToken: string;
}

// ============================================
// Knowledge Base Types
// ============================================

export interface Category {
    id: string;
    name: string;
    slug: string;
    createdAt: Date;
}

export interface Tag {
    id: string;
    name: string;
    slug: string;
    createdAt: Date;
}

export interface KBItem {
    id: string;
    type: KBContentType;
    title: string;
    summary: string | null;
    categoryId: string | null;
    category?: Category;
    tags?: Tag[];
    status: KBStatus;
    storageKey: string | null;
    createdBy: string;
    publishedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface KBArticle extends KBItem {
    type: 'article';
    bodyHtml: string;
}

export interface KBVideo extends KBItem {
    type: 'video';
    duration?: number;
}

export interface KBDocument extends KBItem {
    type: 'document';
    fileSize?: number;
    mimeType?: string;
}

// ============================================
// Ticket Types
// ============================================

export interface Ticket {
    id: string;
    ticketNumber: number;
    subject: string;
    category: TicketCategory;
    priority: TicketPriority;
    status: TicketStatus;
    createdBy: string;
    assignedTo: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface TicketMessage {
    id: string;
    ticketId: string;
    authorUserId: string;
    body: string;
    messageType: 'user' | 'admin' | 'internal';
    createdAt: Date;
}

export interface TicketAttachment {
    id: string;
    ticketId: string;
    messageId: string | null;
    filename: string;
    storageKey: string;
    size: number;
    mimeType: string;
    createdAt: Date;
}

export interface CreateTicketRequest {
    subject: string;
    category: TicketCategory;
    priority: TicketPriority;
    description: string;
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

// ============================================
// Search Types
// ============================================

export interface SearchFilters {
    query?: string;
    type?: KBContentType;
    categoryId?: string;
    tagIds?: string[];
    status?: KBStatus;
}

export interface SearchResult {
    item: KBItem;
    score: number;
    highlights?: {
        field: string;
        snippet: string;
    }[];
}
