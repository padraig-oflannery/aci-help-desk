# IT Helpdesk Pro - Requirements Document

## Project Overview

IT Helpdesk Pro is an Electron-based desktop application (Windows/macOS) that provides employees with a unified platform to access knowledge base resources, submit and track IT tickets, and download approved files. The application features role-based access (Employee/Admin) with a Fastify/Node.js backend hosted on Railway and Cloudflare R2 for object storage.

## Technology Stack

### Frontend
- Electron (Desktop application)
- TypeScript
- React (SPA inside Electron)
- Security: contextIsolation: true, nodeIntegration: false

### Backend
- Node.js with Fastify
- TypeScript
- PostgreSQL (Railway or managed)
- Cloudflare R2 (object storage)
- Email provider (Resend)

### Deployment
- Backend: Railway
- Storage: Cloudflare R2
- Desktop: Electron packaged for Windows

## User Roles

1. **EMPLOYEE**: Standard user with access to knowledge base, ticket submission, and downloads
2. **ADMIN**: IT staff with all employee permissions plus content management, ticket management, and user administration

## Module 1: Authentication & Account Management

### 1.1 User Authentication

**User Story**: As a user, I want to securely log in to the application so that I can access my personalized workspace.

**Acceptance Criteria**:
- User can log in with email/username and password
- System validates credentials against backend API
- Failed login attempts show clear error messages
- Successful login redirects to home dashboard
- "Remember this device" option stores session locally
- Session persists across app restarts until expiry or logout

### 1.2 Token Management

**User Story**: As a system, I need to manage authentication tokens securely to maintain user sessions.

**Acceptance Criteria**:
- Backend issues short-lived access tokens (15-30 minutes)
- Backend issues refresh tokens with longer expiry (7-30 days)
- Refresh tokens stored encrypted in OS keychain (using keytar or similar)
- Access tokens kept in memory only
- Automatic token refresh before expiry
- Token refresh fails trigger logout and redirect to login
- Server-side token invalidation on logout or password change

### 1.3 Password Reset Flow

**User Story**: As a user, I want to reset my password if I forget it so that I can regain access to my account.

**Acceptance Criteria**:
- "Forgot password" link on login screen
- User enters email address to request reset
- System sends password reset email with time-limited token link
- Reset link opens in app or browser with token validation
- User enters new password (with confirmation)
- Password meets security requirements (min length, complexity)
- Token expires after use or time limit (1 hour)
- Successful reset allows immediate login with new password

### 1.4 Account Profile Management

**User Story**: As a user, I want to manage my account settings so that I can keep my information current.

**Acceptance Criteria**:
- User can view current profile (name, email, role)
- User can update name
- User can update email (optional MVP feature)
- User can change password (requires current password)
- Changes are validated and saved to backend
- Success/error messages displayed for all operations

### 1.5 Session Management

**User Story**: As a user, I want to view and manage my active sessions so that I can control where I'm logged in.

**Acceptance Criteria**:
- User can view list of active sessions/devices
- Each session shows: device label, login time, last active
- User can logout from specific sessions
- User can logout from all sessions except current
- Current session clearly marked
- Session list updates in real-time

### 1.6 Role-Based Access Control

**User Story**: As a system, I need to enforce role-based permissions so that users only access authorized features.

**Acceptance Criteria**:
- Employee role can access: KB, tickets (own), downloads, account
- Admin role can access: all employee features + admin dashboard, ticket management, content management, user management
- UI hides/shows features based on user role
- Backend API enforces role permissions on all endpoints
- Unauthorized access attempts return 403 errors

## Module 2: Knowledge Base & Unified Search

### 2.1 Content Types

**User Story**: As an admin, I want to publish different types of content so that employees can access diverse learning resources.

**Acceptance Criteria**:
- System supports three content types: Article, Video, Document
- **Article**: Rich text body with optional images, stored in database
- **Video**: File stored in R2 or external link, with metadata
- **Document**: PDF/DOCX/etc stored in R2 with metadata
- Each content item has: title, category, tags, status (draft/published), summary, created date, updated date

### 2.2 Browse Knowledge Base

**User Story**: As an employee, I want to browse the knowledge base by different criteria so that I can discover relevant content.

**Acceptance Criteria**:
- User can browse KB by categories (hierarchical or flat)
- User can browse KB by tags
- User can sort by "Most recent" (published date)
- User can filter by content type (article/video/document)
- Browse results show: type icon, title, category, summary, last updated
- Clicking result opens content detail view

### 2.3 Unified Search

**User Story**: As an employee, I want to search across all knowledge base content so that I can quickly find answers.

**Acceptance Criteria**:
- Single search bar accessible from all KB screens
- Search returns mixed results across articles, videos, and documents
- Search includes: title, category, tags, body/content text
- **Articles**: Full-text search on title + body content
- **Documents**: Search on title, tags, and extracted text (PDF/DOCX)
- **Videos**: Search on title, tags, category, and metadata
- Results show: type icon, title, category, snippet/highlight, last updated
- Results can be filtered by: content type, category, tags
- Search is case-insensitive and handles partial matches
- Empty search shows helpful message

### 2.4 Content Detail Views

**User Story**: As an employee, I want to view knowledge base content in appropriate formats so that I can consume the information effectively.

**Acceptance Criteria**:
- **Article viewer**: Renders rich text/markdown with images, proper formatting
- **Video player**: Streams video from R2 using signed URLs, with playback controls
- **Document viewer**: Shows document metadata with download button
- All views show: title, category, tags, published date, last updated
- Navigation back to search/browse results
- Related content suggestions (optional MVP)

### 2.5 Content Downloads

**User Story**: As an employee, I want to download documents and videos so that I can access them offline.

**Acceptance Criteria**:
- Download button visible on video and document detail pages
- Backend generates time-limited signed URLs for downloads
- Electron download manager handles file download
- Progress indicator shows download status
- User can choose save location or use default Downloads folder
- Success/failure notifications displayed
- Downloaded files saved with original filename

## Module 3: IT Ticketing System

### 3.1 Submit Ticket (Employee)

**User Story**: As an employee, I want to submit IT support tickets so that I can get help with technical issues.

**Acceptance Criteria**:
- User can create new ticket with:
  - Subject (required, max 200 chars)
  - Category dropdown (Hardware, Software, Access, Network, Other)
  - Priority dropdown (Low, Medium, High, Urgent)
  - Description (rich text, markdown support, required)
  - File attachments (multiple files, max 10MB each)
- Form validation prevents submission with missing required fields
- Attachments upload to R2 via signed URLs
- Successful submission shows ticket number and redirects to ticket detail
- User receives confirmation message

### 3.2 View My Tickets (Employee)

**User Story**: As an employee, I want to view all my submitted tickets so that I can track their status.

**Acceptance Criteria**:
- List shows all tickets created by current user
- Each ticket displays: ticket number, subject, status, priority, category, last updated
- Status chips with color coding: Open (blue), In Progress (yellow), Waiting on Employee (orange), Resolved (green), Closed (gray)
- User can filter by: status, category
- User can sort by: last updated, created date, priority
- Clicking ticket opens detail view
- Empty state shows helpful message for new users

### 3.3 Ticket Detail (Employee)

**User Story**: As an employee, I want to view ticket details and communicate with IT so that I can resolve my issue.

**Acceptance Criteria**:
- Ticket header shows: number, subject, status, priority, category, created date, assigned admin (if any)
- Timeline shows: status changes with timestamps
- Chat thread displays all messages (employee ↔ IT) chronologically
- Each message shows: author name, timestamp, message body, attachments
- User can add new messages to chat
- User can attach files to messages (upload to R2)
- User can view and download all attachments
- Real-time updates when admin responds (polling or websocket)
- User can close ticket (optional MVP feature)

### 3.4 Ticket Queue Dashboard (Admin)

**User Story**: As an admin, I want to view all tickets in a queue so that I can manage support requests efficiently.

**Acceptance Criteria**:
- Dashboard shows all tickets across all users
- Ticket list displays: ticket number, subject, status, priority, category, assigned admin, created by, last updated
- Admin can filter by: status, priority, category, assigned admin
- Admin can sort by: last updated, created date, priority, status
- Quick stats shown: total open, in progress, waiting on employee, resolved today
- Clicking ticket opens admin ticket detail view
- Color-coded priority indicators (Urgent: red, High: orange, Medium: yellow, Low: gray)

### 3.5 Ticket Management (Admin)

**User Story**: As an admin, I want to manage ticket details so that I can organize and resolve support requests.

**Acceptance Criteria**:
- Admin can view full ticket detail (same as employee view plus admin actions)
- Admin can assign ticket to self or other admins
- Admin can change ticket status (Open → In Progress → Waiting on Employee → Resolved → Closed)
- Admin can change priority level
- Admin can change category
- Admin can add messages to chat thread
- Admin can add internal notes (visible only to admins, different styling)
- Admin can attach files to messages
- All changes logged in ticket timeline with timestamp and admin name
- Status change notifications sent to ticket creator (optional MVP)

### 3.6 Basic Ticket Reporting (Admin)

**User Story**: As an admin, I want to see basic ticket metrics so that I can understand support workload.

**Acceptance Criteria**:
- Dashboard shows:
  - Count of tickets by status (Open, In Progress, Waiting, Resolved, Closed)
  - Average age of open tickets (in days)
  - Total tickets created today/this week
  - Tickets by category breakdown
- Metrics update in real-time or on page refresh
- Simple charts or stat cards (no complex visualizations required for MVP)

## Module 4: Content Delivery & Downloads

### 4.1 Secure Content Delivery

**User Story**: As a system, I need to serve content securely so that only authenticated users can access files.

**Acceptance Criteria**:
- Backend generates time-limited signed URLs for R2 content
- Signed URLs expire after 1 hour (configurable)
- URLs include authentication signature that cannot be forged
- Electron app requests signed URLs from backend API
- Backend validates user authentication before issuing URLs
- Expired URLs return 403 errors

### 4.2 Video Streaming

**User Story**: As an employee, I want to stream videos directly in the app so that I can watch training content.

**Acceptance Criteria**:
- Video player embedded in app (HTML5 video or custom player)
- Videos stream from R2 using signed URLs
- Playback controls: play/pause, seek, volume, fullscreen
- Video metadata displayed: title, duration, description
- Loading indicator while video buffers
- Error handling for failed streams

### 4.3 Document Downloads

**User Story**: As an employee, I want to download documents to my computer so that I can reference them offline.

**Acceptance Criteria**:
- Download button on document detail pages
- Electron download manager handles file download with progress
- User can choose save location via system dialog
- Default save location is user's Downloads folder
- Progress bar shows download percentage
- Success notification with "Open file" and "Show in folder" actions
- Failure notification with retry option
- Downloaded files retain original filename and extension

### 4.4 Download Management

**User Story**: As an employee, I want to track my downloads so that I can easily find downloaded files.

**Acceptance Criteria**:
- App maintains list of recent downloads (last 50)
- Download list shows: filename, type, size, download date, file location
- User can open file from download list
- User can show file in system file explorer
- User can clear download history
- Download list persists across app restarts

## Module 5: Admin Content Management

### 5.1 Create/Edit Articles

**User Story**: As an admin, I want to create and edit articles so that I can publish knowledge base content.

**Acceptance Criteria**:
- Admin can create new article with:
  - Title (required)
  - Category (required, dropdown)
  - Tags (multi-select or comma-separated)
  - Summary (short description, 200 chars)
  - Body (rich text editor with formatting: bold, italic, lists, links, images)
  - Status (draft or published)
- Admin can upload images inline in article body
- Images stored in R2 and embedded via URLs
- Admin can save as draft or publish immediately
- Admin can edit existing articles
- Changes saved to database with updated timestamp
- Preview mode shows article as employees will see it

### 5.2 Upload Videos

**User Story**: As an admin, I want to upload videos so that employees can access training content.

**Acceptance Criteria**:
- Admin can upload video files (MP4, WebM, max 500MB)
- Upload shows progress bar
- Video stored in R2 with unique key
- Admin provides metadata:
  - Title (required)
  - Category (required)
  - Tags
  - Summary/description
  - Duration (auto-detected or manual entry)
- Admin can set status (draft or published)
- Admin can edit video metadata after upload
- Admin can replace video file

### 5.3 Upload Documents

**User Story**: As an admin, I want to upload documents so that employees can download reference materials.

**Acceptance Criteria**:
- Admin can upload document files (PDF, DOCX, XLSX, max 50MB)
- Upload shows progress bar
- Document stored in R2 with unique key
- Backend extracts text from PDF/DOCX for search indexing
- Admin provides metadata:
  - Title (required)
  - Category (required)
  - Tags
  - Summary/description
- Admin can set status (draft or published)
- Admin can edit document metadata after upload
- Admin can replace document file

### 5.4 Manage Categories & Tags

**User Story**: As an admin, I want to manage categories and tags so that content is well-organized.

**Acceptance Criteria**:
- Admin can create new categories with name and slug
- Admin can edit category names
- Admin can delete categories (with warning if content exists)
- Admin can create new tags with name and slug
- Admin can edit tag names
- Admin can delete tags (with warning if content exists)
- Categories and tags appear in dropdowns when creating content

### 5.5 Content Publishing Workflow

**User Story**: As an admin, I want to control content visibility so that only approved content is published.

**Acceptance Criteria**:
- All content starts in "draft" status by default
- Draft content visible only to admins
- Admin can publish content (changes status to "published")
- Published content visible to all employees
- Admin can unpublish content (revert to draft)
- Published date recorded when content first published
- Content list shows status filter (all, draft, published)

## Module 6: Admin User Management

### 6.1 Create User

**User Story**: As an admin, I want to create new user accounts so that employees can access the system.

**Acceptance Criteria**:
- Admin can create user with:
  - Name (required)
  - Email (required, unique)
  - Role (Employee or Admin)
  - Temporary password (auto-generated or manual)
- System validates email format and uniqueness
- New user receives welcome email with temporary password
- User must change password on first login (optional MVP)
- Success message shows created user details

### 6.2 View Users

**User Story**: As an admin, I want to view all users so that I can manage accounts.

**Acceptance Criteria**:
- Admin can view list of all users
- User list shows: name, email, role, status (active/inactive), created date, last login
- Admin can filter by: role, status
- Admin can search by: name, email
- Admin can sort by: name, email, created date, last login

### 6.3 Edit User

**User Story**: As an admin, I want to edit user accounts so that I can update user information.

**Acceptance Criteria**:
- Admin can edit user:
  - Name
  - Email (with uniqueness validation)
  - Role (Employee ↔ Admin)
  - Status (active ↔ inactive)
- Admin cannot edit own role (prevent lockout)
- Changes saved to database
- Success/error messages displayed

### 6.4 Reset User Password (Admin-Triggered)

**User Story**: As an admin, I want to reset user passwords so that I can help users regain access.

**Acceptance Criteria**:
- Admin can trigger password reset for any user
- System generates temporary password or reset link
- User receives email with reset instructions
- Admin sees confirmation that reset was sent
- User can login with temporary password and must change it

## Module 7: Application Shell & Navigation

### 7.1 App Layout

**User Story**: As a user, I want a consistent navigation structure so that I can easily access different features.

**Acceptance Criteria**:
- Left sidebar navigation with sections:
  - Home (dashboard)
  - Knowledge Base
  - Tickets (My Tickets for employees, Ticket Queue for admins)
  - Downloads (optional MVP)
  - Account
  - Admin section (visible only to admins): Dashboard, Content Manager, User Manager
- Top bar shows: app logo, current user name/avatar, logout button
- Active nav item highlighted
- Responsive layout adapts to window size
- Minimum window size enforced (1024x768)

### 7.2 Home Dashboard

**User Story**: As a user, I want a home dashboard so that I can quickly access common actions.

**Acceptance Criteria**:
- **Employee dashboard** shows:
  - Search bar (searches KB)
  - Quick action buttons: "Submit a Ticket", "Browse Knowledge Base"
  - Recent/popular articles (top 5)
  - My open tickets (top 5 with status)
- **Admin dashboard** shows:
  - Ticket queue summary (counts by status)
  - Recent tickets (top 10)
  - Content summary (draft vs published counts)
  - Quick action buttons: "Create Article", "View Ticket Queue"

### 7.3 Account Settings

**User Story**: As a user, I want to access my account settings so that I can manage my profile and sessions.

**Acceptance Criteria**:
- Account page has tabs:
  - Profile (name, email, role display)
  - Change Password
  - Sessions (active sessions list with logout actions)
- Each tab loads appropriate content
- Changes saved via API with validation
- Success/error messages displayed

## Module 8: Core UI Screens

### 8.1 Login Screen

**Acceptance Criteria**:
- Clean, centered login form with:
  - Email/username field
  - Password field (with show/hide toggle)
  - "Remember this device" checkbox
  - "Forgot password?" link
  - "Sign in" button
- App logo and branding
- "Secure Connection" indicator
- Form validation on submit
- Error messages for invalid credentials
- Loading state during authentication

### 8.2 Forgot Password Screen

**Acceptance Criteria**:
- Email input field
- "Send reset link" button
- Back to login link
- Success message after submission
- Error handling for invalid email

### 8.3 Reset Password Screen

**Acceptance Criteria**:
- New password field (with show/hide toggle)
- Confirm password field
- Password requirements displayed
- "Reset password" button
- Token validation on page load
- Success message and redirect to login

### 8.4 Initialization/Loading Screen

**Acceptance Criteria**:
- Shown during app startup and authentication
- Progress indicators for:
  - User Authentication
  - Device Policy Check (optional)
  - Loading Modules
  - Finalizing UI
- App version number displayed
- Retry button if initialization fails
- Clean, branded design matching login screen

## Non-Functional Requirements

### Performance
- App launches in under 3 seconds on modern hardware
- Search results return in under 1 second for typical queries
- Video streaming starts within 2 seconds
- File downloads show progress updates every 100ms
- UI remains responsive during background operations

### Security
- All passwords hashed with Argon2 or bcrypt (cost factor 12+)
- Refresh tokens stored encrypted in OS keychain
- Access tokens never persisted to disk
- All API communication over HTTPS
- Signed URLs expire after 1 hour
- CSRF protection on all state-changing endpoints
- Input validation and sanitization on all forms
- XSS protection in rich text rendering

### Reliability
- Graceful error handling with user-friendly messages
- Automatic retry for failed network requests (3 attempts)
- Offline detection with appropriate UI feedback
- Data validation before submission
- Transaction rollback on database errors

### Usability
- Consistent UI patterns across all screens
- Clear visual hierarchy and typography
- Accessible color contrast (WCAG AA)
- Keyboard navigation support
- Loading states for all async operations
- Empty states with helpful guidance
- Confirmation dialogs for destructive actions

### Scalability
- Database indexes on frequently queried fields
- Pagination for large result sets (50 items per page)
- Lazy loading for images and videos
- Connection pooling for database
- Rate limiting on API endpoints

## Data Model Summary

### Users & Auth
- `users`: id, email, name, role, password_hash, is_active, created_at
- `sessions`: id, user_id, refresh_token_hash, expires_at, created_at, revoked_at, device_label
- `password_reset_tokens`: id, user_id, token_hash, expires_at, used_at

### Knowledge Base
- `categories`: id, name, slug
- `tags`: id, name, slug
- `kb_items`: id, type, title, category_id, status, summary, storage_key, created_by, updated_at, published_at
- `kb_item_tags`: kb_item_id, tag_id
- `kb_article_bodies`: kb_item_id, body_html, search_text
- `kb_document_text`: kb_item_id, extracted_text

### Ticketing
- `tickets`: id, created_by, assigned_to, subject, category, priority, status, created_at, updated_at
- `ticket_messages`: id, ticket_id, author_user_id, body, message_type, created_at
- `ticket_attachments`: id, ticket_id, message_id, filename, storage_key, size, mime_type, created_at

## API Endpoints Summary

### Auth
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `GET /me`
- `PATCH /me`

### Knowledge Base
- `GET /kb/search`
- `GET /kb/items`
- `GET /kb/items/:id`
- `GET /kb/items/:id/download-url`

### Admin KB
- `POST /admin/kb/items`
- `PATCH /admin/kb/items/:id`
- `POST /admin/kb/items/:id/publish`
- `POST /admin/kb/upload-url`
- `GET /admin/kb/categories`
- `POST /admin/kb/categories`
- `GET /admin/kb/tags`
- `POST /admin/kb/tags`

### Tickets (Employee)
- `POST /tickets`
- `GET /tickets`
- `GET /tickets/:id`
- `POST /tickets/:id/messages`
- `POST /tickets/:id/attachments/upload-url`

### Tickets (Admin)
- `GET /admin/tickets`
- `PATCH /admin/tickets/:id`
- `GET /admin/tickets/stats`

### Users (Admin)
- `GET /admin/users`
- `POST /admin/users`
- `PATCH /admin/users/:id`
- `POST /admin/users/:id/reset-password`

## Out of Scope for MVP

The following features are explicitly out of scope for the MVP and should be considered for future iterations:

- SSO/SAML/OIDC integration
- Video transcript search
- "Was this helpful?" feedback on KB articles
- Article version history
- Scheduled publishing
- SLA timers and escalation rules
- Canned responses for tickets
- Email notifications (except password reset)
- Desktop notifications
- Offline mode for KB content
- Global hotkey for quick search
- Embedded PDF viewer with annotations
- Auto-update mechanism
- Audit logs
- Advanced analytics and reporting
- Ticket templates
- Asset/device inventory
- Bulk actions on tickets
- SCIM provisioning
- Data loss prevention rules

## Success Criteria

The MVP will be considered successful when:

1. Employees can log in, search the knowledge base, and find relevant content
2. Employees can submit tickets and communicate with IT through ticket chat
3. Admins can manage tickets, assign them, and update status
4. Admins can create and publish KB content (articles, videos, documents)
5. All content is searchable with relevant results
6. Files can be securely downloaded to user's computer
7. The application is stable and performs well on Windows and macOS
8. Security requirements are met (encrypted storage, secure tokens, HTTPS)

## Assumptions & Dependencies

- Railway provides reliable hosting for backend API
- Cloudflare R2 provides sufficient storage and bandwidth
- Email provider (Postmark/SendGrid/Resend) is configured and operational
- Users have modern Windows 10+ or macOS 10.14+ systems
- Users have stable internet connection (no offline mode in MVP)
- PostgreSQL database is properly configured with required extensions
- Development team has access to Electron code signing certificates for distribution
