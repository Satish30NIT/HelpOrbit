# Project Setup — JIRA Tickets

---

## Parent Ticket

### Title

Project setup

### Description

Bootstrap the HelpOrbit application so developers can run the full stack locally and all feature modules (Company, User, Activity log, Policy) can be built on a shared foundation.

This epic enables the team to:

- Clone and install backend and frontend
- Configure environment variables securely
- Connect PostgreSQL and apply schema/migrations
- Run the Express API with health check, logging, and error handling
- Authenticate admins via JWT (login + `/me`)
- Run the Next.js dashboard shell (login, layout, navigation)
- Optionally enable Redis and Elasticsearch for later modules
- Verify end-to-end: login → dashboard → authenticated API call

**No single dashboard route** — this epic is infrastructure only. First user-facing route after setup: `/login` → `/dashboard`.

The foundation must support:

- Node.js 18+ runtime
- PostgreSQL as source of truth
- JWT + bcrypt authentication
- Admin role enforcement on protected APIs
- CORS between frontend (`localhost:3000`) and API (`localhost:5000`)
- Consistent API response shape (`success`, `data`, `message`)
- Shared frontend patterns (`apiFetch`, `AuthContext`, `MainLayout`)

**Blocks:** All other modules (Company, User, Activity log, Policy) depend on this epic.

**Reference docs:** `docs/PROJECT_GUIDE.md` §1 · `README.md` · `backend/.env.example`

### Task List

- Repository & environment setup
- Database foundation
- Backend application shell
- Authentication module
- Frontend application shell
- Optional infrastructure (Redis / Elasticsearch)
- Smoke test & developer documentation

### Child Tickets (7)

Each child ticket has **Title**, **Description**, and **Tasks**. Full detail in sections below.

---

#### 1. Repository & Environment Setup

**Title:** Repository & Environment Setup

**Description:** Clone the monorepo, install dependencies, and configure local environment files for backend and frontend.

**Tasks:**

- Verify Node.js ≥ 18 and npm ≥ 9
- Clone HelpOrbit repository
- Run `npm install` in `backend/` and `frontend/`
- Copy `backend/.env.example` → `backend/.env`
- Set `DB_*`, `JWT_SECRET`, `CORS_ORIGIN`, `PORT`
- Create `frontend/.env.local` with `NEXT_PUBLIC_API_URL`
- Confirm `.env` files are gitignored (no secrets committed)
- Document local URLs in README or team wiki

---

#### 2. Database Foundation

**Title:** Database Foundation

**Description:** Create the PostgreSQL database, apply base schema, run migrations, and seed an admin user for login.

**Tasks:**

- Create database (e.g. `helporbit_db`)
- Verify connection from backend (`backend/src/config/db.js`)
- Ensure base tables: `users`, `roles`, `companies`, `user_companies`, `policies`, `policy_acknowledgements`, `schema_migrations`
- Seed `roles` (at least `admin`, `user`)
- Run migrations `004` through `008` in order
- Create one admin user with bcrypt-hashed password
- Test login credentials manually (after auth ticket)

---

#### 3. Backend Application Shell

**Title:** Backend Application Shell

**Description:** Stand up the Express 5 API with middleware, logging, validation, and a health endpoint.

**Tasks:**

- Entry point: `server.js` → `app.js`
- Enable CORS for `CORS_ORIGIN`
- JSON body parser (1mb limit)
- `GET /health` returns `{ success: true }`
- Central `errorHandler` and `notFoundHandler`
- `ApiError` utility for 400/401/403/404/500
- `asyncHandler` wrapper for controllers
- Request logging (morgan) + Winston logger
- Joi `validate()` middleware for body/query/params
- Mount route placeholders: `/api/auth`, (modules added later)

---

#### 4. Authentication Module

**Title:** Authentication Module

**Description:** Implement JWT-based login so admins can authenticate and call protected APIs.

**Tasks:**

- `POST /api/auth/login` — body: `{ identifier, password }` (email or username)
- Validate with `loginSchema` (Joi)
- Compare password with bcrypt hash in database
- Return JWT + user summary (`role_name`, display fields)
- `GET /api/auth/me` — Bearer token required
- `authenticate` middleware — decode JWT, attach `req.user`
- `requireAdmin` / `requireRole` middleware for admin routes
- Configure `JWT_SECRET`, `JWT_EXPIRES_IN`, `BCRYPT_ROUNDS` in env
- Return 401 for invalid/expired token; 403 for non-admin where required

---

#### 5. Frontend Application Shell

**Title:** Frontend Application Shell

**Description:** Scaffold the Next.js app with auth flow, dashboard layout, and shared API client.

**Tasks:**

- Next.js App Router project under `frontend/`
- Tailwind CSS v4 + global styles (`globals.css`)
- `apiFetch` / `lib/api.ts` with Bearer token and `ApiError`
- `AuthContext` — login, logout, token hydrate, `/me` on load
- `/login` page — identifier + password form
- Redirect authenticated users to `/dashboard`
- `/dashboard/layout.tsx` — auth guard + `MainLayout`
- Sidebar navigation config (`navigation.ts`)
- Header with breadcrumbs via `PageHeaderContext`
- Theme provider (light/dark) if in scope
- Toast notifications for errors/success

---

#### 6. Optional Infrastructure (Redis / Elasticsearch)

**Title:** Optional Infrastructure (Redis / Elasticsearch)

**Description:** Configure optional services used by caching and activity log search. Safe to skip on first sprint (`*_ENABLED=false`).

**Tasks:**

- Document `REDIS_URL` and `REDIS_ENABLED` in `.env.example`
- Document `ELASTIC_URL`, `ELASTIC_ENABLED`, `ELASTIC_AUDIT_LOGS_INDEX`
- Implement no-op / fallback when disabled (no startup crash)
- `backend/src/config/elastic.js` — client only when enabled
- Verify app starts with both flags `false`
- Optional: local Docker Compose snippet for Postgres + ES (team doc)
- Note backfill scripts for later: `backfill:activity-es`, `backfill-user-activity-es.js`

---

#### 7. Smoke Test & Developer Documentation

**Title:** Smoke Test & Developer Documentation

**Description:** Prove the stack works end-to-end and document setup for the next developer.

**Tasks:**

- Start backend: `npm run dev` (port 5000)
- Start frontend: `npm run dev` (port 3000)
- `curl GET /health` succeeds
- Login via UI with admin user → lands on `/dashboard`
- `GET /api/auth/me` with token returns user in Network tab
- Non-admin or missing token gets 401/403 on a sample protected route
- Update `docs/PROJECT_GUIDE.md` §1 if steps changed
- Add checklist comment in JIRA with screenshots or terminal output
- Hand off to **Company module** epic

---

## Child Tickets for Project Setup (detailed)

---

### 1. Repository & Environment Setup

#### Title

Repository & Environment Setup

#### Description

Prepare the developer machine and project configuration before writing feature code.

#### Tasks

- Install Node.js 18+ LTS
- Clone repo: `git clone <url> && cd HelpOrbit`
- `cd backend && npm install`
- `cd ../frontend && npm install`
- `cp backend/.env.example backend/.env`
- Set variables:

  | Variable | Example |
  |----------|---------|
  | `PORT` | `5000` |
  | `CORS_ORIGIN` | `http://localhost:3000` |
  | `DB_NAME` | `helporbit_db` |
  | `JWT_SECRET` | long random string |
  | `ELASTIC_ENABLED` | `false` |
  | `REDIS_ENABLED` | `false` |

- Create `frontend/.env.local`:

  ```env
  NEXT_PUBLIC_API_URL=http://localhost:5000/api
  ```

- Run `git status` — ensure `.env` not staged

**Key files:** `backend/.env.example`, `frontend/src/lib/api.ts`, `backend/src/config/env.js`

---

### 2. Database Foundation

#### Title

Database Foundation

#### Description

PostgreSQL must be running with schema and an admin account before module development.

#### Tasks

- `createdb helporbit_db` (or name from `.env`)
- Apply base schema (from team dump or `docs/db-schema.md`)
- Run migrations in order:

  ```bash
  psql -d helporbit_db -f backend/migrations/004_activity_logs.sql
  psql -d helporbit_db -f backend/migrations/005_policy_name.sql
  psql -d helporbit_db -f backend/migrations/006_company_address_fields.sql
  psql -d helporbit_db -f backend/migrations/007_company_addresses_table.sql
  psql -d helporbit_db -f backend/migrations/008_rename_address_line_1.sql
  ```

- Insert roles if missing: `admin`, `user`
- Insert admin user with `bcryptjs.hashSync(password, 10)`
- Link user to `admin` role_id
- Verify: `SELECT id, email, role_id FROM users LIMIT 5;`

**Key files:** `backend/migrations/*`, `docs/db-schema.md`, `backend/src/config/db.js`

---

### 3. Backend Application Shell

#### Title

Backend Application Shell

#### Description

Express application structure shared by all API modules.

#### Tasks

- `app.js`: cors, `express.json`, routes, error middleware order
- `server.js`: listen on `env.port`
- `GET /health` — no auth
- `middleware/error.middleware.js` — map `ApiError` to status codes
- `middleware/validate.js` — Joi integration
- `utils/asyncHandler.js`
- `utils/logger.js` — Winston
- Register `app.use("/api/auth", authRoutes)` first
- Test: `curl http://localhost:5000/health`

**Key files:** `backend/src/app.js`, `backend/src/server.js`, `backend/src/utils/ApiError.js`

---

### 4. Authentication Module

#### Title

Authentication Module

#### Description

JWT login flow used by the frontend and required by all admin APIs.

#### Tasks

- `auth.validator.js` — `loginSchema`
- `auth.service.js` — find user by email/username, verify password, sign JWT
- `auth.controller.js` — `login`, `me`
- `auth.routes.js` — `POST /login`, `GET /me`
- `auth.middleware.js` — `authenticate` reads `Authorization: Bearer`
- `role.middleware.js` — `requireAdmin`, `requireRole("admin")`
- JWT payload includes `sub` (user id) and role info as implemented
- Manual test:

  ```bash
  curl -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"identifier":"admin@example.com","password":"your-password"}'
  ```

**Key files:** `backend/src/routes/auth.routes.js`, `auth.service.js`, `auth.middleware.js`

---

### 5. Frontend Application Shell

#### Title

Frontend Application Shell

#### Description

Next.js shell that wraps all dashboard modules.

#### Tasks

- Root layout: fonts (Inter), `AuthProvider`, `ToastProvider`, `ThemeProvider`
- `AuthContext`: `login()`, `logout()`, token persistence, load `/auth/me`
- `login/page.tsx` — form submit → store token → redirect `/dashboard`
- `dashboard/layout.tsx` — redirect to `/login` if no token
- `MainLayout` — `Sidebar` + `Header` + `app-main`
- `PageHeaderProvider` + `usePageHeader` hook
- `navigation.ts` — Dashboard link (module links added later)
- Home `/` redirects to dashboard or login
- Inter font app-wide (`layout.tsx`, `globals.css`)

**Key files:** `frontend/src/app/layout.tsx`, `contexts/AuthContext.tsx`, `components/layout/MainLayout.tsx`

---

### 6. Optional Infrastructure (Redis / Elasticsearch)

#### Title

Optional Infrastructure (Redis / Elasticsearch)

#### Description

Prepare optional services; modules must work when they are off.

#### Tasks

- Read `backend/.env.example` Redis and Elastic sections
- Ensure `env.js` exposes flags without requiring live connections
- Elastic: `elastic.js` returns null client when `ELASTIC_ENABLED=false`
- Redis: guard any cache usage behind `REDIS_ENABLED`
- Document enabling ES for Activity log module later
- Optional local setup:

  ```bash
  # Example only — adjust for your environment
  docker run -d -p 9200:9200 elasticsearch:8.11.0
  ```

**Key files:** `backend/src/config/elastic.js`, `backend/.env.example`

---

### 7. Smoke Test & Developer Documentation

#### Title

Smoke Test & Developer Documentation

#### Description

Final verification that project setup is complete before starting Company module.

#### Tasks

| Step | Command / action | Expected |
|------|------------------|----------|
| 1 | `cd backend && npm run dev` | Server listening :5000 |
| 2 | `cd frontend && npm run dev` | UI on :3000 |
| 3 | Open `/health` | JSON success |
| 4 | Open `/login`, sign in | Redirect to `/dashboard` |
| 5 | DevTools → Network → any API call | `Authorization: Bearer` header present |
| 6 | Call protected route without token | 401 |
| 7 | Update team doc if versions differ | PR or wiki |

- Mark Epic **Project setup** Done in JIRA
- Link **Company module** epic as next sprint

**Key files:** `docs/PROJECT_GUIDE.md`, `README.md`

---

## Tech stack reference (for juniors)

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS v4 |
| Backend | Node.js, Express 5, Joi |
| Database | PostgreSQL |
| Auth | JWT + bcrypt |
| Cache | Redis (optional) |
| Logs / search | Elasticsearch 8 (optional) |

---

## Suggested JIRA structure

| JIRA issue | Maps to section |
|------------|-----------------|
| Epic | **Project setup** (parent) |
| Story | 1. Repository & Environment Setup |
| Story | 2. Database Foundation |
| Story | 3. Backend Application Shell |
| Story | 4. Authentication Module |
| Story | 5. Frontend Application Shell |
| Story | 6. Optional Infrastructure (Redis / Elasticsearch) |
| Story | 7. Smoke Test & Developer Documentation |

**Execution order:** 1 → 2 → 3 → 4 → 5 → (6 parallel optional) → 7

**Blocks:** Company module, User module, Activity log module, Policy module
