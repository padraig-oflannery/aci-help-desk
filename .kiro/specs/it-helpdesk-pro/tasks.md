# IT Helpdesk Pro - Implementation Tasks

## Phase 1: Project Setup & Infrastructure

### 1.1 Initialize Monorepo Structure
- [ ] Create root package.json with pnpm workspaces
- [ ] Set up workspace structure (apps/, packages/)
- [ ] Configure TypeScript for monorepo
- [ ] Set up ESLint and Prettier
- [ ] Create .gitignore and .env.example files

### 1.2 Docker Development Environment
- [ ] Create docker-compose.yml with PostgreSQL and MinIO
- [ ] Configure PostgreSQL container with health checks
- [ ] Configure MinIO container with console access
- [ ] Create initialization scripts for MinIO buckets
- [ ] Document Docker setup in README

### 1.3 Backend Project Setup
- [ ] Initialize Fastify backend project in apps/backend
- [ ] Install dependencies (Fastify, Drizzle, TypeScript, etc.)
- [ ] Configure TypeScript (tsconfig.json)
- [ ] Set up Drizzle ORM configuration
- [ ] Create basic Fastify server with health check endpoint
- [ ] Configure environment variables loading

### 1.4 Electron Desktop App Setup
- [ ] Initialize Electron project in apps/desktop
- [ ] Set up Vite for renderer process
- [ ] Configure Electron main process
- [ ] Create preload script with context isolation
- [ ] Set up React with TypeScript
- [ ] Configure Tailwind CSS
- [ ] Install and configure Radix UI components

### 1.5 Shared Package Setup
- [ ] Create shared package in packages/shared
- [ ] Define shared TypeScript types
- [ ] Define shared constants
- [ ] Export types for use in backend and frontend

## Phase 2: Database Schema & Migrations

### 2.1 User & Authentication Schema
- [ ] Define users table schema with Drizzle
- [ ] Define sessions table schema
- [ ] Define password_reset_tokens table schema
- [ ] Create indexes for users table
- [ ] Generate and run initial migration

### 2.2 Knowledge Base Schema
- [ ] Define categories table schema
- [ ] Define tags table schema
- [ ] Define kb_items table schema
- [ ] Define kb_item_tags junction table
- [ ] Define kb_article_bodies table
- [ ] Define kb_document_text table
- [ ] Create indexes for KB tables
- [ ] Generate and run KB migration

### 2.3 Ticketing Schema
- [ ] Define tickets table schema
- [ ] Define ticket_messages table schema
- [ ] Define ticket_attachments table schema
- [ ] Create indexes for tickets tables
- [ ] Generate and run tickets migration

### 2.4 Full-Text Search Setup
- [ ] Add tsvector columns to kb_article_bodies
- [ ] Add tsvector columns to kb_document_text
- [ ] Create GIN indexes for full-text search
- [ ] Create triggers for auto-updating search vectors
- [ ] Test full-text search functionality

### 2.5 Database Seeding
- [ ] Create seed script for admin user
- [ ] Create seed script for sample categories
- [ ] Create seed script for sample tags
- [ ] Create seed script for sample KB items
- [ ] Create seed script for sample tickets

## Phase 3: Backend - Authentication & Authorization

### 3.1 JWT Token Management
- [ ] Configure @fastify/jwt plugin
- [ ] Implement access token generation
- [ ] Implement refresh token generation
- [ ] Create token verification middleware
- [ ] Implement token refresh logic

### 3.2 Password Management
- [ ] Implement password hashing with argon2
- [ ] Implement password verification
- [ ] Create password strength validator
- [ ] Implement password reset token generation
- [ ] Implement password reset token verification

### 3.3 Authentication Routes
- [ ] POST /auth/login - Login endpoint
- [ ] POST /auth/refresh - Token refresh endpoint
- [ ] POST /auth/logout - Logout endpoint
- [ ] POST /auth/forgot-password - Request password reset
- [ ] POST /auth/reset-password - Reset password with token
- [ ] GET /auth/me - Get current user
- [ ] PATCH /auth/me - Update current user
- [ ] GET /auth/sessions - Get user sessions
- [ ] DELETE /auth/sessions/:id - Revoke session

### 3.4 Authorization Middleware
- [ ] Create authenticate middleware
- [ ] Create requireRole middleware
- [ ] Create requireAdmin middleware
- [ ] Test authorization on protected routes

### 3.5 Session Management
- [ ] Implement session creation on login
- [ ] Implement session validation
- [ ] Implement session revocation on logout
- [ ] Implement session cleanup (expired sessions)
- [ ] Implement device label tracking

## Phase 4: Backend - Storage Integration

### 4.1 S3 Client Configuration
- [ ] Create S3 client factory (MinIO/R2)
- [ ] Implement environment-based configuration
- [ ] Test connection to MinIO (development)
- [ ] Create bucket initialization script
- [ ] Implement bucket existence check

### 4.2 Signed URL Generation
- [ ] Implement getSignedDownloadUrl function
- [ ] Implement getSignedUploadUrl function
- [ ] Add expiration time configuration
- [ ] Test signed URL generation
- [ ] Implement URL validation

### 4.3 File Upload Handling
- [ ] Create upload URL endpoint
- [ ] Implement file type validation
- [ ] Implement file size validation
- [ ] Create storage key generation logic
- [ ] Test file upload flow

### 4.4 File Download Handling
- [ ] Create download URL endpoint
- [ ] Implement access control for downloads
- [ ] Test download flow
- [ ] Implement download tracking (optional)

## Phase 5: Backend - Email Service

### 5.1 Resend Integration
- [ ] Install and configure Resend SDK
- [ ] Create email service module
- [ ] Configure email templates
- [ ] Test email sending in development

### 5.2 Email Templates
- [ ] Create password reset email template
- [ ] Create welcome email template
- [ ] Create ticket notification template (optional)
- [ ] Test email rendering

### 5.3 Email Sending Functions
- [ ] Implement sendPasswordResetEmail
- [ ] Implement sendWelcomeEmail
- [ ] Implement error handling for email failures
- [ ] Add email sending to password reset flow

## Phase 6: Backend - Knowledge Base API

### 6.1 KB Item CRUD
- [ ] POST /admin/kb/items - Create KB item
- [ ] GET /kb/items - List KB items
- [ ] GET /kb/items/:id - Get KB item details
- [ ] PATCH /admin/kb/items/:id - Update KB item
- [ ] DELETE /admin/kb/items/:id - Delete KB item
- [ ] POST /admin/kb/items/:id/publish - Publish KB item

### 6.2 Category & Tag Management
- [ ] GET /kb/categories - List categories
- [ ] POST /admin/kb/categories - Create category
- [ ] PATCH /admin/kb/categories/:id - Update category
- [ ] DELETE /admin/kb/categories/:id - Delete category
- [ ] GET /kb/tags - List tags
- [ ] POST /admin/kb/tags - Create tag
- [ ] PATCH /admin/kb/tags/:id - Update tag
- [ ] DELETE /admin/kb/tags/:id - Delete tag

### 6.3 KB Search Implementation
- [ ] Implement full-text search query
- [ ] Add filter by content type
- [ ] Add filter by category
- [ ] Add filter by tags
- [ ] Add filter by status (admin only)
- [ ] Implement search result ranking
- [ ] Add pagination to search results
- [ ] Test search with various queries

### 6.4 KB Content Handling
- [ ] Implement article body storage
- [ ] Implement video metadata storage
- [ ] Implement document metadata storage
- [ ] Implement document text extraction (PDF)
- [ ] Test content retrieval

### 6.5 KB Download URLs
- [ ] GET /kb/items/:id/download - Get signed download URL
- [ ] Implement access control for downloads
- [ ] Test download URL generation
- [ ] Implement URL expiration

## Phase 7: Backend - Ticketing System API

### 7.1 Ticket CRUD (Employee)
- [ ] POST /tickets - Create ticket
- [ ] GET /tickets - List user's tickets
- [ ] GET /tickets/:id - Get ticket details
- [ ] Implement ticket number generation
- [ ] Test ticket creation flow

### 7.2 Ticket Messages
- [ ] POST /tickets/:id/messages - Add message to ticket
- [ ] GET /tickets/:id/messages - Get ticket messages
- [ ] Implement message type handling (user/admin/internal)
- [ ] Test message creation

### 7.3 Ticket Attachments
- [ ] POST /tickets/:id/attachments/upload-url - Get upload URL
- [ ] Implement attachment metadata storage
- [ ] Implement attachment listing
- [ ] Test attachment upload flow

### 7.4 Ticket Management (Admin)
- [ ] GET /admin/tickets - List all tickets with filters
- [ ] PATCH /admin/tickets/:id - Update ticket
- [ ] Implement ticket assignment
- [ ] Implement status transitions
- [ ] Implement priority updates
- [ ] Test admin ticket management

### 7.5 Ticket Statistics
- [ ] GET /admin/tickets/stats - Get ticket statistics
- [ ] Implement count by status
- [ ] Implement average age calculation
- [ ] Implement tickets by category breakdown
- [ ] Test statistics endpoint

## Phase 8: Backend - User Management API

### 8.1 User CRUD (Admin)
- [ ] GET /admin/users - List all users
- [ ] POST /admin/users - Create user
- [ ] PATCH /admin/users/:id - Update user
- [ ] POST /admin/users/:id/reset-password - Trigger password reset
- [ ] Implement user search and filtering
- [ ] Test user management endpoints

### 8.2 User Validation
- [ ] Implement email uniqueness validation
- [ ] Implement role validation
- [ ] Implement user status validation
- [ ] Test validation rules

## Phase 9: Electron - IPC Architecture

### 9.1 IPC Channel Constants
- [ ] Create IPC_CHANNELS constants file
- [ ] Define auth channels
- [ ] Define download channels
- [ ] Define system channels
- [ ] Export channel constants

### 9.2 Auth IPC Handlers
- [ ] Implement registerAuthHandlers function
- [ ] Implement AUTH_STORE_TOKEN handler (keytar)
- [ ] Implement AUTH_GET_TOKEN handler (keytar)
- [ ] Implement AUTH_CLEAR_TOKEN handler (keytar)
- [ ] Test token storage in OS keychain

### 9.3 Download IPC Handlers
- [ ] Implement registerDownloadHandlers function
- [ ] Implement DOWNLOAD_FILE handler
- [ ] Implement download progress tracking
- [ ] Implement download completion notification
- [ ] Implement download error handling
- [ ] Test file download flow

### 9.4 System IPC Handlers
- [ ] Implement registerSystemHandlers function
- [ ] Implement SYSTEM_OPEN_EXTERNAL handler
- [ ] Implement SYSTEM_SHOW_IN_FOLDER handler
- [ ] Implement SYSTEM_GET_PATH handler
- [ ] Test system handlers

### 9.5 Central IPC Registration
- [ ] Create registerIPCHandlers function
- [ ] Register all handler modules
- [ ] Integrate with main process
- [ ] Test IPC registration

### 9.6 Preload Script
- [ ] Create ElectronAPI interface
- [ ] Expose auth API to renderer
- [ ] Expose download API to renderer
- [ ] Expose system API to renderer
- [ ] Create TypeScript declarations
- [ ] Test preload script

## Phase 10: Frontend - Core UI Components

### 10.1 UI Component Library
- [ ] Create Button component (Radix UI)
- [ ] Create Input component
- [ ] Create Select component
- [ ] Create Dialog component
- [ ] Create Dropdown component
- [ ] Create Checkbox component
- [ ] Create Radio component
- [ ] Create Toast/Notification component
- [ ] Create Loading Spinner component
- [ ] Create Badge component

### 10.2 Layout Components
- [ ] Create AppShell component
- [ ] Create Sidebar component
- [ ] Create TopBar component
- [ ] Create PageHeader component
- [ ] Implement responsive layout
- [ ] Test layout on different screen sizes

### 10.3 Form Components
- [ ] Create FormField wrapper component
- [ ] Create FormError component
- [ ] Create FormLabel component
- [ ] Implement form validation helpers
- [ ] Test form components

## Phase 11: Frontend - Authentication UI

### 11.1 Login Screen
- [ ] Create Login page component
- [ ] Create LoginForm component
- [ ] Implement email/password inputs
- [ ] Implement "Remember this device" checkbox
- [ ] Implement "Forgot password" link
- [ ] Add form validation
- [ ] Integrate with auth API
- [ ] Test login flow

### 11.2 Forgot Password Screen
- [ ] Create ForgotPassword page component
- [ ] Create ForgotPasswordForm component
- [ ] Implement email input
- [ ] Add form validation
- [ ] Integrate with forgot-password API
- [ ] Show success message
- [ ] Test forgot password flow

### 11.3 Reset Password Screen
- [ ] Create ResetPassword page component
- [ ] Create ResetPasswordForm component
- [ ] Implement password inputs
- [ ] Add password strength indicator
- [ ] Add form validation
- [ ] Integrate with reset-password API
- [ ] Test reset password flow

### 11.4 Initialization Screen
- [ ] Create Initialization page component
- [ ] Implement progress indicators
- [ ] Add retry functionality
- [ ] Show app version
- [ ] Test initialization flow

### 11.5 Auth State Management
- [ ] Create useAuth hook
- [ ] Implement login function
- [ ] Implement logout function
- [ ] Implement token refresh logic
- [ ] Implement auto-login on app start
- [ ] Test auth state management

## Phase 12: Frontend - API Client & State Management

### 12.1 API Client Setup
- [ ] Create axios client with base configuration
- [ ] Implement request interceptor (add auth token)
- [ ] Implement response interceptor (handle 401)
- [ ] Implement token refresh logic
- [ ] Test API client

### 12.2 TanStack Query Setup
- [ ] Configure QueryClient
- [ ] Set up QueryClientProvider
- [ ] Configure default query options
- [ ] Configure default mutation options
- [ ] Test query caching

### 12.3 API Modules
- [ ] Create auth API module
- [ ] Create KB API module
- [ ] Create tickets API module
- [ ] Create admin API module
- [ ] Test API modules

### 12.4 Custom Hooks
- [ ] Create useKBSearch hook
- [ ] Create useKBItem hook
- [ ] Create useTickets hook
- [ ] Create useTicket hook
- [ ] Create useDownload hook
- [ ] Test custom hooks

## Phase 13: Frontend - Knowledge Base UI

### 13.1 KB Home/Browse
- [ ] Create KnowledgeBase page component
- [ ] Create SearchBar component
- [ ] Create KBItemCard component
- [ ] Implement category filter
- [ ] Implement tag filter
- [ ] Implement content type filter
- [ ] Implement sort options
- [ ] Test KB browse functionality

### 13.2 KB Search
- [ ] Implement search input with debounce
- [ ] Integrate with search API
- [ ] Display search results
- [ ] Implement search filters
- [ ] Show search result count
- [ ] Handle empty results
- [ ] Test search functionality

### 13.3 Article Viewer
- [ ] Create ArticleViewer component
- [ ] Implement rich text rendering
- [ ] Implement image display
- [ ] Add breadcrumb navigation
- [ ] Show article metadata
- [ ] Test article viewing

### 13.4 Video Player
- [ ] Create VideoPlayer component
- [ ] Implement video streaming
- [ ] Add playback controls
- [ ] Show video metadata
- [ ] Test video playback

### 13.5 Document Viewer
- [ ] Create DocumentViewer component
- [ ] Show document metadata
- [ ] Implement download button
- [ ] Integrate with download IPC
- [ ] Show download progress
- [ ] Test document download

## Phase 14: Frontend - Ticketing UI

### 14.1 Ticket List (Employee)
- [ ] Create Tickets page component
- [ ] Create TicketList component
- [ ] Create TicketCard component
- [ ] Implement status filter
- [ ] Implement category filter
- [ ] Implement sort options
- [ ] Show ticket count
- [ ] Test ticket list

### 14.2 Create Ticket Form
- [ ] Create NewTicket page component
- [ ] Create TicketForm component
- [ ] Implement subject input
- [ ] Implement category select
- [ ] Implement priority select
- [ ] Implement description editor (Tiptap)
- [ ] Implement file attachment upload
- [ ] Add form validation
- [ ] Integrate with create ticket API
- [ ] Test ticket creation

### 14.3 Ticket Detail View
- [ ] Create TicketDetail page component
- [ ] Display ticket header (number, subject, status, etc.)
- [ ] Create TicketTimeline component
- [ ] Create TicketChat component
- [ ] Display ticket messages
- [ ] Implement message input
- [ ] Implement attachment upload
- [ ] Show attachments with download
- [ ] Test ticket detail view

### 14.4 Ticket Chat
- [ ] Implement real-time message display
- [ ] Implement message input with rich text
- [ ] Implement file attachment
- [ ] Show message timestamps
- [ ] Show message author
- [ ] Differentiate message types (user/admin/internal)
- [ ] Test ticket chat

## Phase 15: Frontend - Admin Dashboard

### 15.1 Admin Dashboard Home
- [ ] Create AdminDashboard page component
- [ ] Show ticket queue summary
- [ ] Show content summary
- [ ] Show quick action buttons
- [ ] Implement stat cards
- [ ] Test admin dashboard

### 15.2 Ticket Queue (Admin)
- [ ] Create TicketQueue page component
- [ ] Create TicketQueueTable component
- [ ] Implement status filter
- [ ] Implement priority filter
- [ ] Implement category filter
- [ ] Implement assignee filter
- [ ] Implement sort options
- [ ] Show ticket count
- [ ] Test ticket queue

### 15.3 Ticket Management (Admin)
- [ ] Add admin actions to TicketDetail
- [ ] Implement assign ticket dropdown
- [ ] Implement status change dropdown
- [ ] Implement priority change dropdown
- [ ] Implement category change dropdown
- [ ] Implement internal notes
- [ ] Test admin ticket management

### 15.4 Content Manager
- [ ] Create ContentManager page component
- [ ] Create ContentList component
- [ ] Implement content type tabs
- [ ] Implement status filter
- [ ] Implement search
- [ ] Show content count
- [ ] Test content manager

### 15.5 Content Editor
- [ ] Create ContentEditor page component
- [ ] Implement article editor (Tiptap)
- [ ] Implement video upload
- [ ] Implement document upload
- [ ] Implement category select
- [ ] Implement tag multi-select
- [ ] Implement status toggle
- [ ] Add form validation
- [ ] Integrate with KB API
- [ ] Test content editor

### 15.6 Category & Tag Manager
- [ ] Create CategoryManager component
- [ ] Create TagManager component
- [ ] Implement create category
- [ ] Implement edit category
- [ ] Implement delete category
- [ ] Implement create tag
- [ ] Implement edit tag
- [ ] Implement delete tag
- [ ] Test category and tag management

### 15.7 User Manager
- [ ] Create UserManager page component
- [ ] Create UserList component
- [ ] Implement user search
- [ ] Implement role filter
- [ ] Implement status filter
- [ ] Create UserForm component
- [ ] Implement create user
- [ ] Implement edit user
- [ ] Implement reset password
- [ ] Test user management

## Phase 16: Frontend - Account Settings

### 16.1 Account Profile
- [ ] Create Account page component
- [ ] Create ProfileTab component
- [ ] Display user info (name, email, role)
- [ ] Implement edit profile form
- [ ] Add form validation
- [ ] Integrate with update user API
- [ ] Test profile update

### 16.2 Change Password
- [ ] Create ChangePasswordTab component
- [ ] Implement current password input
- [ ] Implement new password input
- [ ] Implement confirm password input
- [ ] Add password strength indicator
- [ ] Add form validation
- [ ] Integrate with change password API
- [ ] Test password change

### 16.3 Session Management
- [ ] Create SessionsTab component
- [ ] Display active sessions list
- [ ] Show session details (device, last active)
- [ ] Implement logout from session
- [ ] Implement logout from all sessions
- [ ] Test session management

## Phase 17: Frontend - Routing & Navigation

### 17.1 Route Configuration
- [ ] Set up React Router
- [ ] Define public routes (login, forgot password, reset password)
- [ ] Define protected routes (home, KB, tickets, account)
- [ ] Define admin routes (admin dashboard, content manager, user manager)
- [ ] Test route navigation

### 17.2 Route Guards
- [ ] Create ProtectedRoute component
- [ ] Create AdminRoute component
- [ ] Implement authentication check
- [ ] Implement role check
- [ ] Redirect to login if not authenticated
- [ ] Test route guards

### 17.3 Navigation Components
- [ ] Implement Sidebar navigation
- [ ] Implement active route highlighting
- [ ] Implement role-based menu items
- [ ] Add navigation icons
- [ ] Test navigation

## Phase 18: Testing & Quality Assurance

### 18.1 Backend Unit Tests
- [ ] Write tests for auth routes
- [ ] Write tests for KB routes
- [ ] Write tests for ticket routes
- [ ] Write tests for admin routes
- [ ] Write tests for middleware
- [ ] Achieve 80%+ code coverage

### 18.2 Frontend Unit Tests
- [ ] Write tests for UI components
- [ ] Write tests for custom hooks
- [ ] Write tests for API modules
- [ ] Write tests for forms
- [ ] Achieve 70%+ code coverage

### 18.3 Integration Tests
- [ ] Test login flow end-to-end
- [ ] Test ticket creation flow
- [ ] Test KB search flow
- [ ] Test file upload/download flow
- [ ] Test admin workflows

### 18.4 Manual Testing
- [ ] Test on Windows
- [ ] Test on macOS
- [ ] Test all user flows
- [ ] Test all admin flows
- [ ] Test error scenarios
- [ ] Test edge cases

## Phase 19: Documentation

### 19.1 Developer Documentation
- [ ] Write setup instructions
- [ ] Document environment variables
- [ ] Document database schema
- [ ] Document API endpoints
- [ ] Document IPC channels
- [ ] Create architecture diagrams

### 19.2 User Documentation
- [ ] Write user guide for employees
- [ ] Write admin guide
- [ ] Create screenshots/videos
- [ ] Document common workflows
- [ ] Create FAQ

### 19.3 Deployment Documentation
- [ ] Document Railway deployment
- [ ] Document Cloudflare R2 setup
- [ ] Document Resend setup
- [ ] Document Electron app distribution
- [ ] Create deployment checklist

## Phase 20: Deployment & Release

### 20.1 Backend Deployment
- [ ] Set up Railway project
- [ ] Configure environment variables
- [ ] Deploy backend to Railway
- [ ] Run database migrations
- [ ] Test production API

### 20.2 Storage Setup
- [ ] Set up Cloudflare R2 account
- [ ] Create R2 bucket
- [ ] Configure CORS for R2
- [ ] Test R2 integration
- [ ] Migrate from MinIO to R2

### 20.3 Email Service Setup
- [ ] Set up Resend account
- [ ] Verify domain
- [ ] Configure email templates
- [ ] Test email sending

### 20.4 Electron App Build
- [ ] Configure electron-builder
- [ ] Set up code signing (Windows/macOS)
- [ ] Build Windows installer
- [ ] Build macOS DMG
- [ ] Test installers

### 20.5 Release
- [ ] Create release notes
- [ ] Tag release in Git
- [ ] Upload installers to distribution platform
- [ ] Notify users
- [ ] Monitor for issues

---

**Total Tasks**: 300+
**Estimated Timeline**: 8-12 weeks for MVP (1-2 developers)

**Priority Levels**:
- **Critical**: Must have for MVP
- **High**: Important for good UX
- **Medium**: Nice to have
- **Low**: Can be deferred to post-MVP

**Dependencies**: Tasks should generally be completed in phase order, though some phases can be parallelized (e.g., frontend and backend development).
