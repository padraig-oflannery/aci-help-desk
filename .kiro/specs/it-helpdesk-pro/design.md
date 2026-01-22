# IT Helpdesk Pro - Design Document

## 1. Architecture Overview

### 1.1 System Architecture

The IT Helpdesk Pro application follows a client-server architecture:

**Client (Electron Desktop App)**
- Electron main process (Node.js runtime)
- Renderer process (React SPA with TypeScript)
- Preload script (secure IPC bridge)
- Local encrypted storage (OS keychain for tokens)

**Server (Fastify Backend)**
- RESTful API server (Node.js + Fastify + TypeScript)
- PostgreSQL database (relational data)
- S3-compatible storage (Cloudflare R2 production, MinIO local)
- Resend email service integration

**Communication**
- HTTPS REST API between Electron app and backend
- JWT-based authentication (access + refresh tokens)
- Signed URLs for secure file access

### 1.2 Technology Stack

**Frontend (Electron App)**
- **Electron 28+**: Cross-platform desktop framework
- **React 18+**: UI library for component-based architecture
- **TypeScript 5+**: Type safety and developer experience
- **Vite**: Fast build tool and dev server
- **TanStack Query (React Query)**: Server state management and caching
- **React Router**: Client-side routing
- **Tailwind CSS**: Utility-first styling (matches design inspiration)
- **Radix UI**: Accessible component primitives
- **Tiptap**: Rich text editor for articles and ticket descriptions
- **Lucide React**: Icon library
- **electron-store**: Persistent local storage
- **keytar**: Secure credential storage in OS keychain

**Backend (API Server)**
- **Node.js 20+**: Runtime environment
- **Fastify 4+**: High-performance web framework
- **TypeScript 5+**: Type safety across the stack
- **Drizzle ORM**: Type-safe ORM for PostgreSQL with excellent TypeScript support
- **drizzle-kit**: Database migrations and schema management
- **@fastify/jwt**: JWT token management
- **@fastify/cors**: CORS handling
- **@fastify/helmet**: Security headers
- **@aws-sdk/client-s3**: S3-compatible client for R2/MinIO
- **argon2**: Password hashing (more secure than bcrypt)
- **Resend**: Email sending service
- **zod**: Runtime type validation

**Database & Storage**
- **PostgreSQL 15+**: Primary data store with full-text search capabilities
- **Docker**: Local PostgreSQL instance for development/testing
- **Cloudflare R2**: Production object storage (S3-compatible)
- **MinIO**: Local S3-compatible storage for development/testing (Docker)

**Development Tools**
- **Docker Compose**: Local development environment orchestration
- **bun**
- **ESLint + Prettier**: Code quality and formatting
- **tsx**: TypeScript execution for development

**Infrastructure**
- **Railway**: Backend hosting and managed PostgreSQL (production)
- **Cloudflare R2**: Production object storage
- **Resend**: Email delivery service
- **Docker Compose**: Local development stack (PostgreSQL + MinIO)

### 1.3 Project Structure

```
it-helpdesk-pro/
├── apps/
│   ├── desktop/                 # Electron application
│   │   ├── src/
│   │   │   ├── main/           # Electron main process
│   │   │   │   ├── index.ts
│   │   │   │   ├── ipc/        # IPC handlers
│   │   │   │   └── security/   # Security configs
│   │   │   ├── preload/        # Preload scripts
│   │   │   │   └── index.ts
│   │   │   └── renderer/       # React application
│   │   │       ├── src/
│   │   │       │   ├── components/
│   │   │       │   ├── pages/
│   │   │       │   ├── hooks/
│   │   │       │   ├── lib/
│   │   │       │   ├── api/
│   │   │       │   └── App.tsx
│   │   │       └── index.html
│   │   ├── electron-builder.json
│   │   └── package.json
│   │
│   └── backend/                # Fastify API server
│       ├── src/
│       │   ├── index.ts
│       │   ├── config/         # Configuration
│       │   ├── db/             # Drizzle schema & migrations
│       │   │   ├── schema/
│       │   │   └── migrations/
│       │   ├── routes/         # API routes
│       │   │   ├── auth/
│       │   │   ├── kb/
│       │   │   ├── tickets/
│       │   │   └── admin/
│       │   ├── services/       # Business logic
│       │   ├── middleware/     # Auth, RBAC, etc.
│       │   ├── lib/            # Utilities
│       │   │   ├── s3.ts
│       │   │   ├── email.ts
│       │   │   └── crypto.ts
│       │   └── types/
│       ├── drizzle.config.ts
│       └── package.json
│
├── packages/
│   └── shared/                 # Shared types and utilities
│       ├── src/
│       │   ├── types/
│       │   └── constants/
│       └── package.json
│
├── docker-compose.yml          # Local dev environment
├── .env.example
└── package.json                # Root workspace config
```

## 2. Database Design (Drizzle ORM)

### 2.1 Schema Design

**Users & Authentication**

```typescript
// db/schema/users.ts
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull().default('EMPLOYEE'), // EMPLOYEE, ADMIN
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  refreshTokenHash: varchar('refresh_token_hash', { length: 255 }).notNull(),
  deviceLabel: varchar('device_label', { length: 255 }),
  expiresAt: timestamp('expires_at').notNull(),
  revokedAt: timestamp('revoked_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: varchar('token_hash', { length: 255 }).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  usedAt: timestamp('used_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
```

**Knowledge Base**

```typescript
// db/schema/kb.ts
export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const tags = pgTable('tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const kbItems = pgTable('kb_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: varchar('type', { length: 50 }).notNull(), // article, video, document
  title: varchar('title', { length: 500 }).notNull(),
  summary: text('summary'),
  categoryId: uuid('category_id').references(() => categories.id),
  status: varchar('status', { length: 50 }).notNull().default('draft'), // draft, published
  storageKey: varchar('storage_key', { length: 500 }), // S3/R2 key for videos/documents
  createdBy: uuid('created_by').notNull().references(() => users.id),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const kbItemTags = pgTable('kb_item_tags', {
  kbItemId: uuid('kb_item_id').notNull().references(() => kbItems.id, { onDelete: 'cascade' }),
  tagId: uuid('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
}, (table) => ({
  pk: primaryKey({ columns: [table.kbItemId, table.tagId] }),
}));

export const kbArticleBodies = pgTable('kb_article_bodies', {
  kbItemId: uuid('kb_item_id').primaryKey().references(() => kbItems.id, { onDelete: 'cascade' }),
  bodyHtml: text('body_html').notNull(),
  searchText: text('search_text').notNull(), // Stripped text for full-text search
});

export const kbDocumentText = pgTable('kb_document_text', {
  kbItemId: uuid('kb_item_id').primaryKey().references(() => kbItems.id, { onDelete: 'cascade' }),
  extractedText: text('extracted_text'), // Extracted from PDF/DOCX
});
```

**Ticketing**

```typescript
// db/schema/tickets.ts
export const tickets = pgTable('tickets', {
  id: uuid('id').primaryKey().defaultRandom(),
  ticketNumber: serial('ticket_number').notNull().unique(), // Human-readable number
  subject: varchar('subject', { length: 500 }).notNull(),
  category: varchar('category', { length: 100 }).notNull(), // Hardware, Software, Access, Network, Other
  priority: varchar('priority', { length: 50 }).notNull().default('medium'), // low, medium, high, urgent
  status: varchar('status', { length: 50 }).notNull().default('open'), // open, in_progress, waiting_on_employee, resolved, closed
  createdBy: uuid('created_by').notNull().references(() => users.id),
  assignedTo: uuid('assigned_to').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const ticketMessages = pgTable('ticket_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  ticketId: uuid('ticket_id').notNull().references(() => tickets.id, { onDelete: 'cascade' }),
  authorUserId: uuid('author_user_id').notNull().references(() => users.id),
  body: text('body').notNull(),
  messageType: varchar('message_type', { length: 50 }).notNull().default('user'), // user, admin, internal
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const ticketAttachments = pgTable('ticket_attachments', {
  id: uuid('id').primaryKey().defaultRandom(),
  ticketId: uuid('ticket_id').notNull().references(() => tickets.id, { onDelete: 'cascade' }),
  messageId: uuid('message_id').references(() => ticketMessages.id, { onDelete: 'cascade' }),
  filename: varchar('filename', { length: 500 }).notNull(),
  storageKey: varchar('storage_key', { length: 500 }).notNull(),
  size: integer('size').notNull(),
  mimeType: varchar('mime_type', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
```

### 2.2 Indexes for Performance

```typescript
// Add indexes for frequently queried fields
export const usersEmailIdx = index('users_email_idx').on(users.email);
export const sessionsUserIdIdx = index('sessions_user_id_idx').on(sessions.userId);
export const kbItemsStatusIdx = index('kb_items_status_idx').on(kbItems.status);
export const kbItemsCategoryIdx = index('kb_items_category_id_idx').on(kbItems.categoryId);
export const ticketsCreatedByIdx = index('tickets_created_by_idx').on(tickets.createdBy);
export const ticketsStatusIdx = index('tickets_status_idx').on(tickets.status);
export const ticketsAssignedToIdx = index('tickets_assigned_to_idx').on(tickets.assignedTo);
```

### 2.3 Full-Text Search Setup

PostgreSQL full-text search will be used for KB content:

```sql
-- Add tsvector columns for full-text search
ALTER TABLE kb_article_bodies ADD COLUMN search_vector tsvector;
ALTER TABLE kb_document_text ADD COLUMN search_vector tsvector;

-- Create indexes
CREATE INDEX kb_article_search_idx ON kb_article_bodies USING GIN(search_vector);
CREATE INDEX kb_document_search_idx ON kb_document_text USING GIN(search_vector);

-- Create triggers to auto-update search vectors
CREATE TRIGGER kb_article_search_update
BEFORE INSERT OR UPDATE ON kb_article_bodies
FOR EACH ROW EXECUTE FUNCTION
tsvector_update_trigger(search_vector, 'pg_catalog.english', search_text);
```

## 3. API Design

### 3.1 Authentication Flow

**JWT Token Strategy**
- **Access Token**: Short-lived (15 minutes), stored in memory
- **Refresh Token**: Long-lived (30 days), stored encrypted in OS keychain
- **Token Payload**: `{ userId, email, role, sessionId }`

**Authentication Middleware**

```typescript
// middleware/auth.ts
export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    const token = request.headers.authorization?.replace('Bearer ', '');
    if (!token) throw new Error('No token provided');
    
    const decoded = await request.jwtVerify();
    request.user = decoded;
  } catch (err) {
    reply.code(401).send({ error: 'Unauthorized' });
  }
}

export async function requireRole(roles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!roles.includes(request.user.role)) {
      reply.code(403).send({ error: 'Forbidden' });
    }
  };
}
```

### 3.2 API Routes Structure

**Auth Routes** (`/auth`)

CREATE INDEX kb_document_search_idx ON kb_document_text USING GIN(search_vector);

-- Create triggers to auto-update search vectors
CREATE TRIGGER kb_article_search_update
BEFORE INSERT OR UPDATE ON kb_article_bodies
FOR EACH ROW EXECUTE FUNCTION
tsvector_update_trigger(search_vector, 'pg_catalog.english', search_text);
```

## 3. API Design

### 3.1 Authentication Flow

**JWT Token Strategy**
- **Access Token**: Short-lived (15 minutes), stored in memory
- **Refresh Token**: Long-lived (30 days), stored encrypted in OS keychain
- **Token Payload**: `{ userId, email, role, sessionId }`

**Authentication Middleware**

```typescript
// middleware/auth.ts
export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    const token = request.headers.authorization?.replace('Bearer ', '');
    if (!token) throw new Error('No token provided');
    
    const decoded = await request.jwtVerify();
    request.user = decoded;
  } catch (err) {
    reply.code(401).send({ error: 'Unauthorized' });
  }
}

export async function requireRole(roles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!roles.includes(request.user.role)) {
      reply.code(403).send({ error: 'Forbidden' });
    }
  };
}
```

### 3.2 API Routes Structure

**Auth Routes** (`/auth`)

```typescript
POST   /auth/login              # Login with email/password
POST   /auth/refresh            # Refresh access token
POST   /auth/logout             # Logout (invalidate session)
POST   /auth/forgot-password    # Request password reset
POST   /auth/reset-password     # Reset password with token
GET    /auth/me                 # Get current user info
PATCH  /auth/me                 # Update current user profile
GET    /auth/sessions           # Get user's active sessions
DELETE /auth/sessions/:id       # Revoke specific session
```

**Knowledge Base Routes** (`/kb`)

```typescript
GET    /kb/search               # Unified search across all content
GET    /kb/items                # Browse KB items (with filters)
GET    /kb/items/:id            # Get specific KB item
GET    /kb/items/:id/download   # Get signed download URL
GET    /kb/categories           # List all categories
GET    /kb/tags                 # List all tags
```

**Admin KB Routes** (`/admin/kb`)

```typescript
POST   /admin/kb/items          # Create new KB item
PATCH  /admin/kb/items/:id      # Update KB item
DELETE /admin/kb/items/:id      # Delete KB item
POST   /admin/kb/items/:id/publish   # Publish KB item
POST   /admin/kb/upload-url     # Get signed upload URL for R2
POST   /admin/kb/categories     # Create category
PATCH  /admin/kb/categories/:id # Update category
DELETE /admin/kb/categories/:id # Delete category
POST   /admin/kb/tags           # Create tag
PATCH  /admin/kb/tags/:id       # Update tag
DELETE /admin/kb/tags/:id       # Delete tag
```

**Ticket Routes** (`/tickets`)

```typescript
POST   /tickets                 # Create new ticket
GET    /tickets                 # Get user's tickets
GET    /tickets/:id             # Get ticket details
POST   /tickets/:id/messages    # Add message to ticket
POST   /tickets/:id/attachments/upload-url  # Get upload URL
```

**Admin Ticket Routes** (`/admin/tickets`)

```typescript
GET    /admin/tickets           # Get all tickets (with filters)
GET    /admin/tickets/stats     # Get ticket statistics
PATCH  /admin/tickets/:id       # Update ticket (status, priority, assign)
```

**Admin User Routes** (`/admin/users`)

```typescript
GET    /admin/users             # List all users
POST   /admin/users             # Create new user
PATCH  /admin/users/:id         # Update user
POST   /admin/users/:id/reset-password  # Trigger password reset
```


### 3.3 Request/Response Schemas (Zod)

```typescript
// types/auth.ts
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  rememberDevice: z.boolean().optional(),
});

export const refreshSchema = z.object({
  refreshToken: z.string(),
});

// types/kb.ts
export const createKbItemSchema = z.object({
  type: z.enum(['article', 'video', 'document']),
  title: z.string().min(1).max(500),
  summary: z.string().max(1000).optional(),
  categoryId: z.string().uuid(),
  tagIds: z.array(z.string().uuid()).optional(),
  status: z.enum(['draft', 'published']).default('draft'),
  // Type-specific fields
  bodyHtml: z.string().optional(), // For articles
  storageKey: z.string().optional(), // For videos/documents
});

// types/tickets.ts
export const createTicketSchema = z.object({
  subject: z.string().min(1).max(500),
  category: z.enum(['Hardware', 'Software', 'Access', 'Network', 'Other']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  description: z.string().min(1),
});
```

## 4. Storage Architecture (S3-Compatible)

### 4.1 Storage Configuration

**Development (MinIO)**
```typescript
// config/storage.ts
const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT, // http://localhost:9000 for MinIO
  region: process.env.S3_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true, // Required for MinIO
});
```

**Production (Cloudflare R2)**
```typescript
const s3Client = new S3Client({
  endpoint: process.env.R2_ENDPOINT, // https://[account-id].r2.cloudflarestorage.com
  region: 'auto',
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});
```

### 4.2 Bucket Structure

```
helpdesk-storage/
├── kb/
│   ├── articles/
│   │   └── images/
│   │       └── {uuid}.{ext}
│   ├── videos/
│   │   └── {uuid}.{ext}
│   └── documents/
│       └── {uuid}.{ext}
└── tickets/
    └── attachments/
        └── {ticketId}/
            └── {uuid}.{ext}
```

### 4.3 Signed URL Generation

```typescript
// lib/s3.ts
export async function getSignedDownloadUrl(
  storageKey: string,
  expiresIn: number = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: storageKey,
  });
  
  return await getSignedUrl(s3Client, command, { expiresIn });
}

export async function getSignedUploadUrl(
  storageKey: string,
  contentType: string,
  expiresIn: number = 3600
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: storageKey,
    ContentType: contentType,
  });
  
  return await getSignedUrl(s3Client, command, { expiresIn });
}
```

## 5. Email Service (Resend)

### 5.1 Email Configuration

```typescript
// lib/email.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendPasswordResetEmail(
  to: string,
  resetToken: string,
  userName: string
) {
  const resetUrl = `${process.env.APP_URL}/reset-password?token=${resetToken}`;
  
  await resend.emails.send({
    from: process.env.EMAIL_FROM || 'IT Helpdesk <noreply@yourdomain.com>',
    to,
    subject: 'Password Reset Request',
    html: `
      <h2>Password Reset Request</h2>
      <p>Hi ${userName},</p>
      <p>You requested to reset your password. Click the link below to proceed:</p>
      <a href="${resetUrl}">Reset Password</a>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `,
  });
}

export async function sendWelcomeEmail(
  to: string,
  userName: string,
  temporaryPassword: string
) {
  await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to,
    subject: 'Welcome to IT Helpdesk Pro',
    html: `
      <h2>Welcome to IT Helpdesk Pro</h2>
      <p>Hi ${userName},</p>
      <p>Your account has been created. Here are your login credentials:</p>
      <p><strong>Email:</strong> ${to}</p>
      <p><strong>Temporary Password:</strong> ${temporaryPassword}</p>
      <p>Please log in and change your password immediately.</p>
    `,
  });
}
```

## 6. Electron Application Design

### 6.1 Security Configuration

```typescript
// main/index.ts
const mainWindow = new BrowserWindow({
  width: 1280,
  height: 800,
  minWidth: 1024,
  minHeight: 768,
  webPreferences: {
    nodeIntegration: false,
    contextIsolation: true,
    sandbox: true,
    preload: path.join(__dirname, '../preload/index.js'),
  },
});
```


### 6.2 IPC Architecture (Layered Separation of Concerns)

**Layer 1: IPC Channel Constants**

```typescript
// main/ipc/channels.ts
export const IPC_CHANNELS = {
  // Auth channels
  AUTH_STORE_TOKEN: 'auth:store-token',
  AUTH_GET_TOKEN: 'auth:get-token',
  AUTH_CLEAR_TOKEN: 'auth:clear-token',
  
  // Download channels
  DOWNLOAD_FILE: 'download:file',
  DOWNLOAD_PROGRESS: 'download:progress',
  DOWNLOAD_COMPLETE: 'download:complete',
  DOWNLOAD_ERROR: 'download:error',
  
  // System channels
  SYSTEM_OPEN_EXTERNAL: 'system:open-external',
  SYSTEM_SHOW_IN_FOLDER: 'system:show-in-folder',
  SYSTEM_GET_PATH: 'system:get-path',
} as const;
```

**Layer 2: Handler Implementations**

```typescript
// main/ipc/handlers/auth.handler.ts
import { ipcMain } from 'electron';
import keytar from 'keytar';
import { IPC_CHANNELS } from '../channels';

const SERVICE_NAME = 'it-helpdesk-pro';
const ACCOUNT_NAME = 'refresh-token';

export function registerAuthHandlers() {
  ipcMain.handle(IPC_CHANNELS.AUTH_STORE_TOKEN, async (_, token: string) => {
    try {
      await keytar.setPassword(SERVICE_NAME, ACCOUNT_NAME, token);
      return { success: true };
    } catch (error) {
      console.error('Failed to store token:', error);
      throw error;
    }
  });

  ipcMain.handle(IPC_CHANNELS.AUTH_GET_TOKEN, async () => {
    try {
      const token = await keytar.getPassword(SERVICE_NAME, ACCOUNT_NAME);
      return token;
    } catch (error) {
      console.error('Failed to get token:', error);
      return null;
    }
  });

  ipcMain.handle(IPC_CHANNELS.AUTH_CLEAR_TOKEN, async () => {
    try {
      await keytar.deletePassword(SERVICE_NAME, ACCOUNT_NAME);
      return { success: true };
    } catch (error) {
      console.error('Failed to clear token:', error);
      throw error;
    }
  });
}
```


```typescript
// main/ipc/handlers/download.handler.ts
import { ipcMain, BrowserWindow, app } from 'electron';
import { IPC_CHANNELS } from '../channels';
import fs from 'fs';
import path from 'path';
import https from 'https';

export function registerDownloadHandlers() {
  ipcMain.handle(IPC_CHANNELS.DOWNLOAD_FILE, async (event, url: string, filename: string) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) throw new Error('Window not found');

    return new Promise((resolve, reject) => {
      const downloadsPath = app.getPath('downloads');
      const filePath = path.join(downloadsPath, filename);
      const file = fs.createWriteStream(filePath);

      https.get(url, (response) => {
        const totalSize = parseInt(response.headers['content-length'] || '0', 10);
        let downloadedSize = 0;

        response.pipe(file);

        response.on('data', (chunk) => {
          downloadedSize += chunk.length;
          const progress = (downloadedSize / totalSize) * 100;
          win.webContents.send(IPC_CHANNELS.DOWNLOAD_PROGRESS, {
            filename,
            progress,
            downloadedSize,
            totalSize,
          });
        });

        file.on('finish', () => {
          file.close();
          win.webContents.send(IPC_CHANNELS.DOWNLOAD_COMPLETE, { filename, filePath });
          resolve({ success: true, filePath });
        });
      }).on('error', (err) => {
        fs.unlink(filePath, () => {});
        win.webContents.send(IPC_CHANNELS.DOWNLOAD_ERROR, { filename, error: err.message });
        reject(err);
      });
    });
  });
}
```

```typescript
// main/ipc/handlers/system.handler.ts
import { ipcMain, shell, app } from 'electron';
import { IPC_CHANNELS } from '../channels';

export function registerSystemHandlers() {
  ipcMain.handle(IPC_CHANNELS.SYSTEM_OPEN_EXTERNAL, async (_, url: string) => {
    try {
      await shell.openExternal(url);
      return { success: true };
    } catch (error) {
      console.error('Failed to open external URL:', error);
      throw error;
    }
  });

  ipcMain.handle(IPC_CHANNELS.SYSTEM_SHOW_IN_FOLDER, async (_, filePath: string) => {
    try {
      shell.showItemInFolder(filePath);
      return { success: true };
    } catch (error) {
      console.error('Failed to show in folder:', error);
      throw error;
    }
  });

  ipcMain.handle(IPC_CHANNELS.SYSTEM_GET_PATH, async (_, name: string) => {
    try {
      return app.getPath(name as any);
    } catch (error) {
      console.error('Failed to get path:', error);
      throw error;
    }
  });
}
```

**Layer 3: Central Registration**

```typescript
// main/ipc/index.ts
import { registerAuthHandlers } from './handlers/auth.handler';
import { registerDownloadHandlers } from './handlers/download.handler';
import { registerSystemHandlers } from './handlers/system.handler';

export function registerIPCHandlers() {
  console.log('Registering IPC handlers...');
  
  registerAuthHandlers();
  registerDownloadHandlers();
  registerSystemHandlers();
  
  console.log('IPC handlers registered successfully');
}
```

**Layer 4: Main Process Integration**

```typescript
// main/index.ts
import { app, BrowserWindow } from 'electron';
import { registerIPCHandlers } from './ipc';

app.whenReady().then(() => {
  // Register all IPC handlers
  registerIPCHandlers();
  
  // Create main window
  createMainWindow();
});
```


**Layer 5: Preload Script (Type-Safe API)**

```typescript
// preload/index.ts
import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '../main/ipc/channels';

// Type definitions for the exposed API
export interface ElectronAPI {
  auth: {
    storeToken: (token: string) => Promise<{ success: boolean }>;
    getToken: () => Promise<string | null>;
    clearToken: () => Promise<{ success: boolean }>;
  };
  download: {
    downloadFile: (url: string, filename: string) => Promise<{ success: boolean; filePath: string }>;
    onProgress: (callback: (data: DownloadProgress) => void) => () => void;
    onComplete: (callback: (data: DownloadComplete) => void) => () => void;
    onError: (callback: (data: DownloadError) => void) => () => void;
  };
  system: {
    openExternal: (url: string) => Promise<{ success: boolean }>;
    showInFolder: (path: string) => Promise<{ success: boolean }>;
    getPath: (name: string) => Promise<string>;
  };
}

interface DownloadProgress {
  filename: string;
  progress: number;
  downloadedSize: number;
  totalSize: number;
}

interface DownloadComplete {
  filename: string;
  filePath: string;
}

interface DownloadError {
  filename: string;
  error: string;
}

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  auth: {
    storeToken: (token: string) => 
      ipcRenderer.invoke(IPC_CHANNELS.AUTH_STORE_TOKEN, token),
    getToken: () => 
      ipcRenderer.invoke(IPC_CHANNELS.AUTH_GET_TOKEN),
    clearToken: () => 
      ipcRenderer.invoke(IPC_CHANNELS.AUTH_CLEAR_TOKEN),
  },
  download: {
    downloadFile: (url: string, filename: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.DOWNLOAD_FILE, url, filename),
    onProgress: (callback: (data: DownloadProgress) => void) => {
      const subscription = (_: any, data: DownloadProgress) => callback(data);
      ipcRenderer.on(IPC_CHANNELS.DOWNLOAD_PROGRESS, subscription);
      return () => ipcRenderer.removeListener(IPC_CHANNELS.DOWNLOAD_PROGRESS, subscription);
    },
    onComplete: (callback: (data: DownloadComplete) => void) => {
      const subscription = (_: any, data: DownloadComplete) => callback(data);
      ipcRenderer.on(IPC_CHANNELS.DOWNLOAD_COMPLETE, subscription);
      return () => ipcRenderer.removeListener(IPC_CHANNELS.DOWNLOAD_COMPLETE, subscription);
    },
    onError: (callback: (data: DownloadError) => void) => {
      const subscription = (_: any, data: DownloadError) => callback(data);
      ipcRenderer.on(IPC_CHANNELS.DOWNLOAD_ERROR, subscription);
      return () => ipcRenderer.removeListener(IPC_CHANNELS.DOWNLOAD_ERROR, subscription);
    },
  },
  system: {
    openExternal: (url: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.SYSTEM_OPEN_EXTERNAL, url),
    showInFolder: (path: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.SYSTEM_SHOW_IN_FOLDER, path),
    getPath: (name: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.SYSTEM_GET_PATH, name),
  },
} as ElectronAPI);
```

**Layer 6: Renderer Process Types**

```typescript
// renderer/src/types/electron.d.ts
import { ElectronAPI } from '../../../preload';

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
```

**Layer 7: Renderer Usage Example**

```typescript
// renderer/src/hooks/useAuth.ts
export function useAuth() {
  const storeToken = async (token: string) => {
    await window.electronAPI.auth.storeToken(token);
  };

  const getToken = async () => {
    return await window.electronAPI.auth.getToken();
  };

  const clearToken = async () => {
    await window.electronAPI.auth.clearToken();
  };

  return { storeToken, getToken, clearToken };
}

// renderer/src/hooks/useDownload.ts
export function useDownload() {
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    const unsubscribe = window.electronAPI.download.onProgress((data) => {
      setProgress(data.progress);
    });

    return unsubscribe;
  }, []);

  const downloadFile = async (url: string, filename: string) => {
    const result = await window.electronAPI.download.downloadFile(url, filename);
    return result;
  };

  return { downloadFile, progress };
}
```

### 6.3 IPC Architecture Benefits

This layered architecture provides:

1. **Separation of Concerns**: Each layer has a single responsibility
2. **Type Safety**: Full TypeScript support from main to renderer
3. **Centralized Registration**: Single point to manage all IPC handlers
4. **Easy Testing**: Handlers can be tested independently
5. **Maintainability**: Easy to add new channels without touching existing code
6. **Security**: Channel names are constants, preventing typos
7. **Clean API**: Renderer process has a clean, organized API surface


## 7. Frontend Architecture (React + TypeScript)

### 7.1 Component Structure

```
renderer/src/
├── components/
│   ├── ui/                    # Reusable UI components (Radix UI wrappers)
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Dialog.tsx
│   │   ├── Select.tsx
│   │   └── ...
│   ├── layout/
│   │   ├── AppShell.tsx       # Main app layout with sidebar
│   │   ├── Sidebar.tsx
│   │   ├── TopBar.tsx
│   │   └── PageHeader.tsx
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   ├── ForgotPasswordForm.tsx
│   │   └── ResetPasswordForm.tsx
│   ├── kb/
│   │   ├── SearchBar.tsx
│   │   ├── KBItemCard.tsx
│   │   ├── ArticleViewer.tsx
│   │   ├── VideoPlayer.tsx
│   │   └── DocumentViewer.tsx
│   ├── tickets/
│   │   ├── TicketList.tsx
│   │   ├── TicketCard.tsx
│   │   ├── TicketDetail.tsx
│   │   ├── TicketForm.tsx
│   │   └── TicketChat.tsx
│   └── admin/
│       ├── UserManager.tsx
│       ├── ContentEditor.tsx
│       └── TicketQueue.tsx
├── pages/
│   ├── Login.tsx
│   ├── Home.tsx
│   ├── KnowledgeBase.tsx
│   ├── Tickets.tsx
│   ├── Account.tsx
│   └── admin/
│       ├── Dashboard.tsx
│       ├── ContentManager.tsx
│       └── UserManager.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useDownload.ts
│   ├── useKB.ts
│   └── useTickets.ts
├── api/
│   ├── client.ts              # Axios/Fetch client with interceptors
│   ├── auth.ts
│   ├── kb.ts
│   ├── tickets.ts
│   └── admin.ts
├── lib/
│   ├── utils.ts
│   ├── constants.ts
│   └── validators.ts
└── types/
    ├── api.ts
    ├── models.ts
    └── electron.d.ts
```

### 7.2 State Management (TanStack Query)

```typescript
// api/client.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 30000,
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(async (config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = await window.electronAPI.auth.getToken();
        const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/auth/refresh`, {
          refreshToken,
        });
        
        localStorage.setItem('accessToken', data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        await window.electronAPI.auth.clearToken();
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
```

```typescript
// hooks/useKB.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as kbApi from '../api/kb';

export function useKBSearch(query: string, filters: any) {
  return useQuery({
    queryKey: ['kb', 'search', query, filters],
    queryFn: () => kbApi.searchKB(query, filters),
    enabled: query.length > 0,
  });
}

export function useKBItem(id: string) {
  return useQuery({
    queryKey: ['kb', 'item', id],
    queryFn: () => kbApi.getKBItem(id),
  });
}

export function useCreateKBItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: kbApi.createKBItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kb'] });
    },
  });
}
```

### 7.3 Routing (React Router)

```typescript
// App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route path="/" element={<Home />} />
              <Route path="/kb" element={<KnowledgeBase />} />
              <Route path="/kb/:id" element={<KBDetail />} />
              <Route path="/tickets" element={<Tickets />} />
              <Route path="/tickets/:id" element={<TicketDetail />} />
              <Route path="/account" element={<Account />} />
              
              <Route element={<AdminRoute />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/content" element={<ContentManager />} />
                <Route path="/admin/users" element={<UserManager />} />
                <Route path="/admin/tickets" element={<TicketQueue />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
```

## 8. Development Environment Setup

### 8.1 Docker Compose Configuration

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: helpdesk-postgres
    environment:
      POSTGRES_DB: helpdesk_dev
      POSTGRES_USER: helpdesk
      POSTGRES_PASSWORD: helpdesk_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U helpdesk"]
      interval: 10s
      timeout: 5s
      retries: 5

  minio:
    image: minio/minio:latest
    container_name: helpdesk-minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 20s
      retries: 3

volumes:
  postgres_data:
  minio_data:
```

### 8.2 Environment Variables

```bash
# .env.example

# Backend
NODE_ENV=development
PORT=3000
API_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://helpdesk:helpdesk_password@localhost:5432/helpdesk_dev

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=30d

# S3/MinIO (Development)
S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin
S3_BUCKET_NAME=helpdesk-storage
S3_FORCE_PATH_STYLE=true

# Cloudflare R2 (Production)
# R2_ENDPOINT=https://[account-id].r2.cloudflarestorage.com
# R2_ACCESS_KEY_ID=your-r2-access-key
# R2_SECRET_ACCESS_KEY=your-r2-secret-key

# Resend
RESEND_API_KEY=re_your_api_key
EMAIL_FROM=IT Helpdesk <noreply@yourdomain.com>

# Frontend
VITE_API_URL=http://localhost:3000
```

### 8.3 Package Manager Configuration

```json
// package.json (root)
{
  "name": "it-helpdesk-pro",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "pnpm --parallel dev",
    "dev:backend": "pnpm --filter backend dev",
    "dev:desktop": "pnpm --filter desktop dev",
    "build": "pnpm --recursive build",
    "docker:up": "docker-compose up -d",
    "docker:down": "docker-compose down",
    "db:migrate": "pnpm --filter backend db:migrate",
    "db:seed": "pnpm --filter backend db:seed"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "prettier": "^3.0.0",
    "eslint": "^8.0.0"
  }
}
```

## 9. Database Migrations (Drizzle)

### 9.1 Drizzle Configuration

```typescript
// apps/backend/drizzle.config.ts
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema/*',
  out: './src/db/migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
} satisfies Config;
```

### 9.2 Migration Commands

```json
// apps/backend/package.json
{
  "scripts": {
    "db:generate": "drizzle-kit generate:pg",
    "db:migrate": "tsx src/db/migrate.ts",
    "db:studio": "drizzle-kit studio",
    "db:seed": "tsx src/db/seed.ts"
  }
}
```

```typescript
// apps/backend/src/db/migrate.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function main() {
  console.log('Running migrations...');
  await migrate(db, { migrationsFolder: './src/db/migrations' });
  console.log('Migrations complete!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Migration failed!', err);
  process.exit(1);
});
```

## 10. Testing Strategy

### 10.1 Backend Testing

```typescript
// apps/backend/src/routes/auth/auth.test.ts
import { test } from 'tap';
import { build } from '../../app';

test('POST /auth/login - successful login', async (t) => {
  const app = await build();
  
  const response = await app.inject({
    method: 'POST',
    url: '/auth/login',
    payload: {
      email: 'test@example.com',
      password: 'password123',
    },
  });
  
  t.equal(response.statusCode, 200);
  t.ok(response.json().accessToken);
  t.ok(response.json().refreshToken);
});
```

### 10.2 Frontend Testing

```typescript
// apps/desktop/renderer/src/components/LoginForm.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { LoginForm } from './LoginForm';

test('renders login form', () => {
  render(<LoginForm />);
  
  expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
});
```

## 11. Deployment Strategy

### 11.1 Backend Deployment (Railway)

1. Connect Railway to GitHub repository
2. Configure environment variables in Railway dashboard
3. Railway auto-deploys on push to main branch
4. Database migrations run automatically via build command

```json
// railway.json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "pnpm install && pnpm --filter backend build && pnpm --filter backend db:migrate"
  },
  "deploy": {
    "startCommand": "pnpm --filter backend start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### 11.2 Electron App Distribution

```json
// apps/desktop/electron-builder.json
{
  "appId": "com.company.it-helpdesk-pro",
  "productName": "IT Helpdesk Pro",
  "directories": {
    "output": "dist"
  },
  "files": [
    "dist-electron",
    "dist"
  ],
  "win": {
    "target": ["nsis"],
    "icon": "build/icon.ico"
  },
  "mac": {
    "target": ["dmg"],
    "icon": "build/icon.icns",
    "category": "public.app-category.business"
  },
  "nsis": {
    "oneClick": false,
    "allowToChangeInstallationDirectory": true
  }
}
```

## 12. Security Considerations

### 12.1 Backend Security

- **Password Hashing**: Argon2 with appropriate cost factor
- **JWT Tokens**: Short-lived access tokens, long-lived refresh tokens
- **CORS**: Configured to allow only Electron app origin
- **Helmet**: Security headers enabled
- **Rate Limiting**: Prevent brute force attacks
- **Input Validation**: Zod schemas for all inputs
- **SQL Injection**: Drizzle ORM prevents SQL injection
- **XSS Protection**: Content Security Policy headers

### 12.2 Electron Security

- **Context Isolation**: Enabled
- **Node Integration**: Disabled
- **Sandbox**: Enabled
- **Preload Script**: Only exposes necessary APIs
- **CSP**: Strict Content Security Policy
- **Secure Token Storage**: OS keychain via keytar
- **HTTPS Only**: All API communication over HTTPS

## 13. Performance Optimization

### 13.1 Database Optimization

- Indexes on frequently queried columns
- Connection pooling
- Query optimization with EXPLAIN ANALYZE
- Full-text search indexes for KB content

### 13.2 Frontend Optimization

- Code splitting with React.lazy
- Image optimization and lazy loading
- TanStack Query caching
- Virtualized lists for large datasets
- Debounced search inputs

### 13.3 Storage Optimization

- Signed URLs with expiration
- CDN for static assets (optional)
- Compression for uploads
- Lazy loading for videos and documents

## 14. Monitoring and Logging

### 14.1 Backend Logging

```typescript
// Use Pino logger with Fastify
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  },
});
```

### 14.2 Error Tracking

- Sentry integration for production error tracking
- Structured logging for debugging
- Request/response logging in development

## 15. Future Enhancements

### 15.1 Phase 2 Features

- SSO/SAML integration
- Email notifications for tickets
- Desktop notifications
- Advanced analytics dashboard
- Video transcript search
- Article feedback and ratings

### 15.2 Phase 3 Features

- Mobile app (React Native)
- Offline mode for KB content
- AI-powered search suggestions
- Automated ticket routing
- SLA management and escalation
- Multi-language support

---

This design document provides a comprehensive blueprint for implementing the IT Helpdesk Pro MVP with modern best practices, security considerations, and scalability in mind.
