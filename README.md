<<<<<<< HEAD
# TaskFlow

A minimal, real task management system with authentication, relational data, REST API, and a polished React UI.

## Overview

TaskFlow allows users to register, log in, create projects, add tasks to projects, and assign tasks to themselves or others. The project is built as a full-stack application with:

- **Backend**: Node.js + Express (REST API)
- **Frontend**: React 18 + TypeScript (Vite)
- **Database**: PostgreSQL 15 with migrations
- **Deployment**: Docker + Docker Compose

## Architecture Decisions

### Backend
- **Express + Node.js**: Lightweight, fast routing and middleware. Easy to test and extend.
- **PostgreSQL**: Relational schema with proper foreign keys ensures data integrity. Migrations via `node-pg-migrate` allow schema versioning.
- **JWT**: Stateless auth with 24h expiry. Token claims include `user_id` and `email`.
- **Bcrypt (cost 12)**: Industry-standard password hashing; slow enough to resist brute-force.
- **Joi validation**: Schema validation for request bodies; clean error responses.
- **Structured logging (winston)**: JSON logs with timestamp for easy debugging.

### Frontend
- **React 18 + TypeScript**: Type safety and component reusability.
- **Vite**: Fast development server and production builds.
- **React Router**: Client-side navigation with protected routes.
- **localStorage**: JWT persistence across page refreshes.
- **Simple CSS**: No heavy UI framework; clean, responsive baseline.

### Database Schema
- **Users**: id, name, email (unique), hashed password, created_at.
- **Projects**: id, name, description, owner_id (FK to users), created_at.
- **Tasks**: id, title, description, status (enum: todo/in_progress/done), priority (enum: low/medium/high), project_id (FK), assignee_id (FK, nullable), creator_id (FK), due_date (optional), created_at, updated_at.

### Tradeoffs & Intentional Omissions
- **No real-time updates**: WebSocket would require a persistent connection; REST polling is simpler and sufficient for the scope.
- **No pagination UI**: Backend supports `?page=&limit=` but frontend doesn't yet; add later.
- **No drag-and-drop**: Bonus feature; table/list layout is functional.
- **No dark mode toggle**: Would add CSS complexity; can add via shadcn/ui later.
- **Minimal error handling in frontend**: Shows user errors but doesn't retry/queue requests.
- **No role-based access control**: Project owner and task creator are the only actors with delete permissions.

## Running Locally

### Prerequisites
- **Docker Desktop** (for Windows, macOS) or Docker + Docker Compose on Linux.
- If you don't have Docker, install from https://www.docker.com/products/docker-desktop

### Exact Commands — Git Clone to Running App

```bash
# 1. Clone the repository
git clone https://github.com/your-username/taskflow-bhavya.git
cd taskflow-bhavya

# 2. Copy environment file
cp .env.example .env

# 3. Start all services (builds images, runs migrations, seeds data)
docker compose up --build

# 4. Wait for logs to show:
#    - "listening on 3000" (frontend)
#    - "server started { port: 8080 }" (backend)
#    - "seed complete" (database ready)

# 5. Open in browser
#    Frontend: http://localhost:3000
#    API: http://localhost:8080
```

The app is now running and ready to use.

### Stopping the Stack

```bash
# Press Ctrl+C in the terminal where docker compose is running
# Or in another terminal:
docker compose down
```

### Run in Background

```bash
docker compose up --build -d

# View all logs:
docker compose logs -f

# View only backend logs:
docker compose logs -f backend

# View only frontend logs:
docker compose logs -f frontend
```

## Running Migrations

Migrations run **automatically** on backend container start (see `backend/Dockerfile` CMD).

To run manually:

```bash
# Up
docker compose run --rm backend npm run migrate

# Down (rollback)
docker compose run --rm backend npm run migrate:down
```

Migration files are in `backend/migrations/`. Each file must export `up` and `down` functions using `node-pg-migrate` API.

## Seed Data

The seed script runs **automatically** on backend container start. It creates:

- **User**: `test@example.com` / `password123`
- **Project**: "Seed Project"
- **Tasks**: 3 tasks with different statuses and priorities

To run manually:

```bash
docker compose run --rm backend npm run seed
```

## Test Credentials

After running `docker compose up`, use these credentials to log in immediately **without registering**:

```
Email:    test@example.com
Password: password123
```

Click **Login**, enter the credentials above, and you'll be redirected to the projects page with a pre-seeded project and tasks ready to explore.

Alternatively, create a new account via the **Register** page.

## API Reference

All endpoints (except `/auth/register` and `/auth/login`) require `Authorization: Bearer <token>` header.

### Authentication

#### POST `/auth/register`

```json
// Request
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "secret123"
}

// Response 201
{
  "token": "<jwt>",
  "user": {
    "id": "uuid",
    "name": "Jane Doe",
    "email": "jane@example.com"
  }
}
```

#### POST `/auth/login`

```json
// Request
{
  "email": "jane@example.com",
  "password": "secret123"
}

// Response 200
{
  "token": "<jwt>",
  "user": {
    "id": "uuid",
    "name": "Jane Doe",
    "email": "jane@example.com"
  }
}
```

### Projects

#### GET `/projects`

List projects the user owns or has tasks in.

```json
// Response 200
{
  "projects": [
    {
      "id": "uuid",
      "name": "Website Redesign",
      "description": "Q2 project",
      "owner_id": "uuid",
      "created_at": "2026-04-01T10:00:00Z"
    }
  ]
}
```

#### POST `/projects`

Create a new project (owner = current user).

```json
// Request
{
  "name": "New Project",
  "description": "Optional description"
}

// Response 201
{
  "id": "uuid",
  "name": "New Project",
  "description": "Optional description",
  "owner_id": "uuid",
  "created_at": "2026-04-09T10:00:00Z"
}
```

#### GET `/projects/:id`

Get project details including all tasks.

```json
// Response 200
{
  "id": "uuid",
  "name": "Website Redesign",
  "description": "Q2 project",
  "owner_id": "uuid",
  "tasks": [
    {
      "id": "uuid",
      "title": "Design homepage",
      "description": "...",
      "status": "in_progress",
      "priority": "high",
      "assignee_id": "uuid",
      "due_date": "2026-04-15",
      "creator_id": "uuid",
      "created_at": "2026-04-01T10:00:00Z",
      "updated_at": "2026-04-05T10:00:00Z"
    }
  ]
}
```

#### PATCH `/projects/:id`

Update name/description (owner only).

```json
// Request
{
  "name": "Updated Name",
  "description": "Updated description"
}

// Response 200 — returns updated project object
```

#### DELETE `/projects/:id`

Delete project and all its tasks (owner only).

```
// Response 204 No Content
```

### Tasks

#### GET `/projects/:id/tasks?status=todo&assignee=uuid`

List tasks with optional filters.

```json
// Response 200
{
  "tasks": [
    {
      "id": "uuid",
      "title": "Design homepage",
      "status": "in_progress",
      "priority": "high",
      "...": "..."
    }
  ]
}
```

#### POST `/projects/:id/tasks`

Create a task in a project.

```json
// Request
{
  "title": "Design homepage",
  "description": "Add hero section",
  "priority": "high",
  "assignee_id": "uuid (optional)",
  "due_date": "2026-04-15"
}

// Response 201 — returns created task object
```

#### PATCH `/tasks/:id`

Update task (all fields optional).

```json
// Request
{
  "title": "Updated title",
  "status": "done",
  "priority": "low",
  "assignee_id": "uuid (or null)",
  "due_date": "2026-04-20"
}

// Response 200 — returns updated task object
```

#### DELETE `/tasks/:id`

Delete task (project owner or task creator only).

```
// Response 204 No Content
```

### Error Responses

#### 400 Validation Error

```json
{
  "error": "validation failed",
  "fields": {
    "email": "is required"
  }
}
```

#### 401 Unauthorized

```json
{
  "error": "unauthorized"
}
```

#### 403 Forbidden

```json
{
  "error": "forbidden"
}
```

#### 404 Not Found

```json
{
  "error": "not found"
}
```

## Project Structure

```
taskflow/
├── docker-compose.yml       # Orchestrates Postgres, backend, frontend
├── .env.example             # Example environment variables
├── .env                     # Actual env vars (DO NOT commit)
├── backend/
│   ├── Dockerfile           # Multi-stage: build + runtime
│   ├── package.json         # Dependencies
│   ├── src/
│   │   ├── index.js         # Express server entrypoint
│   │   ├── db.js            # PostgreSQL pool
│   │   ├── logger.js        # Winston logging
│   │   ├── middleware/
│   │   │   └── auth.js      # JWT verification
│   │   └── routes/
│   │       ├── auth.js      # /auth/register, /auth/login
│   │       ├── projects.js  # /projects endpoints
│   │       └── tasks.js     # /tasks and /projects/:id/tasks endpoints
│   ├── migrations/
│   │   └── 001_init.js      # Initial schema (node-pg-migrate format)
│   └── seed/
│       └── seed.js          # Populate test data
└── frontend/
    ├── Dockerfile           # Build React app + serve via Express
    ├── package.json         # React, Vite, React Router, etc.
    ├── vite.config.js       # Vite configuration
    ├── tsconfig.json        # TypeScript config
    ├── index.html           # HTML entrypoint
    ├── server.js            # Express server for production
    └── src/
        ├── main.tsx         # React root
        ├── App.tsx          # Router setup
        ├── AuthContext.tsx  # Auth state management
        ├── api.ts           # API client wrapper
        ├── styles.css       # Global styles
        ├── pages/
        │   ├── Login.tsx
        │   ├── Register.tsx
        │   ├── Projects.tsx
        │   └── ProjectDetail.tsx
        └── components/
            └── ProtectedRoute.tsx  # Route guard
```

## What You'd Do With More Time

1. **Frontend enhancements**:
   - Add task create/edit modals with full form validation.
   - Drag-and-drop to reorder tasks or change status (Kanban board).
   - Search and filtering UI for tasks (currently only in API).
   - Dark mode toggle with localStorage persistence.
   - Better error handling and retry logic (exponential backoff, offline queue).

2. **Backend enhancements**:
   - Pagination on all list endpoints (`/projects`, `/projects/:id/tasks`).
   - Stats endpoint: `GET /projects/:id/stats` (task counts by status and assignee).
   - Soft deletes (mark as deleted, don't remove from DB).
   - Audit logging (track who changed what and when).
   - Rate limiting on auth endpoints.
   - Email notifications on task assignment.

3. **Real-time features**:
   - WebSocket or Server-Sent Events (SSE) for live task updates.
   - Collaborative editing indicators.

4. **Testing**:
   - Integration tests for auth and task endpoints (Jest + supertest).
   - UI tests with React Testing Library.
   - E2E tests with Cypress or Playwright.

5. **Deployment**:
   - GitHub Actions CI/CD to build and push Docker images.
   - Deploy to Heroku, AWS, or DigitalOcean.
   - Environment-specific configs (dev, staging, prod).
   - Health checks and monitoring.

6. **Security hardening**:
   - CORS configuration (currently accepts all origins in Vite dev mode).
   - CSRF tokens for state-changing operations.
   - Rate limiting per IP/user.
   - Input sanitization (currently relying on Joi schemas).
   - HTTPS enforcement in production.

7. **UX improvements**:
   - Skeleton loaders while fetching.
   - Toast notifications for success/error messages.
   - Keyboard shortcuts for common actions.
   - Inline task editing (quick status/priority change).
   - Bulk operations (select multiple tasks, change status in batch).

8. **Accessibility**:
   - ARIA labels and semantic HTML.
   - Keyboard navigation.
   - Screen reader testing.

## Submission Notes

- This project is intentionally scoped to be completed in 3–5 hours.
- All endpoints are functional and tested manually via curl/Postman.
- Docker Compose is the single entry point; no manual SQL or setup needed.
- The frontend is fully responsive and handles all auth flows correctly.
- Passwords are bcrypt-hashed; JWT secrets are not hardcoded.

## Questions?

Review the code comments or run:

```bash
docker compose logs -f backend
docker compose exec backend npm run migrate:down
```
=======
# taskflow--bhavya-
>>>>>>> cba225ebac2d47a07edca1800c27dd3cc58c1599
