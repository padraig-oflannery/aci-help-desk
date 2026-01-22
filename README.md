# IT Helpdesk Pro

An Electron-based desktop application for internal IT helpdesk operations.

## Features

- **Knowledge Base**: Articles, videos, and documents with full-text search
- **Ticketing System**: Submit, track, and manage IT support tickets
- **Role-based Access**: Employee and Admin roles
- **Secure Downloads**: Time-limited signed URLs for file access

## Tech Stack

- **Frontend**: Electron + React + TypeScript + Tailwind CSS
- **Backend**: Fastify + TypeScript + Drizzle ORM
- **Database**: PostgreSQL
- **Storage**: Cloudflare R2 (production) / MinIO (development)
- **Email**: Resend

## Prerequisites

- [Bun](https://bun.sh/) (v1.0+)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Node.js](https://nodejs.org/) (v20+ for Electron)

## Getting Started

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd help-desk-desktop-app
bun install
```

### 2. Set Up Environment Variables

```bash
cp .env.example .env
# Edit .env with your settings (the defaults work for local development)
```

### 3. Start Docker Services

```bash
# Start PostgreSQL and MinIO containers
bun run docker:up

# Verify containers are running
docker ps

# View logs (optional)
bun run docker:logs
```

**Docker Services:**

| Service | Port | Description |
|---------|------|-------------|
| PostgreSQL | 5432 | Database |
| MinIO API | 9000 | S3-compatible storage |
| MinIO Console | 9001 | Web UI (login: minioadmin/minioadmin) |

### 4. Run Database Migrations

```bash
bun run db:migrate
bun run db:seed  # Optional: seed sample data
```

### 5. Start Development Servers

```bash
# Start both backend and desktop app
bun run dev

# Or start individually
bun run dev:backend   # API server at http://localhost:3000
bun run dev:desktop   # Electron app
```

## Project Structure

```
help-desk-desktop-app/
├── apps/
│   ├── backend/        # Fastify API server
│   └── desktop/        # Electron + React app
├── packages/
│   └── shared/         # Shared types and constants
├── docker-compose.yml  # Local development services
└── package.json        # Workspace root
```

## Scripts

| Script | Description |
|--------|-------------|
| `bun run dev` | Start all development servers |
| `bun run dev:backend` | Start backend only |
| `bun run dev:desktop` | Start Electron app only |
| `bun run build` | Build all packages |
| `bun run test` | Run all tests |
| `bun run docker:up` | Start Docker services |
| `bun run docker:down` | Stop Docker services |
| `bun run db:migrate` | Run database migrations |
| `bun run db:seed` | Seed database with sample data |
| `bun run db:studio` | Open Drizzle Studio |

## Testing

```bash
# Run all tests
bun run test

# Run backend tests only
bun run test:backend

# Run desktop tests only
bun run test:desktop
```

## Configuration

The app name and branding can be configured in:

```
packages/shared/src/constants/app-config.ts
```

Edit `APP_NAME` and `APP_TAGLINE` to customize the application branding.

## License

Private - All rights reserved.
