# HelpOrbit

A policy & user management platform with built-in analytics, caching, and centralized logging.

---

## Tech Stack

| Layer        | Technology                          |
| ------------ | ----------------------------------- |
| Frontend     | Next.js, Tailwind CSS               |
| Backend      | Node.js, Express.js                 |
| Database     | PostgreSQL                          |
| Cache        | Redis                               |
| Logging      | Elasticsearch + Kibana (via Winston)|
| Auth         | JWT (JSON Web Token)                |

---

## High-Level Flow

```
User (Browser)
     v
Next.js (Frontend UI)
     v
API Calls
     v
Node.js + Express (Backend)
     v
-----------------------------------
| PostgreSQL  |  Redis  |  Logs    |
| (main data) | (cache) | (Elastic)|
-----------------------------------
```

---

## Repository Structure

```
HelpOrbit/
├── backend/                    # Node.js + Express API
│   ├── src/
│   │   ├── config/             # env, db, redis, logger config
│   │   ├── controllers/        # request handlers
│   │   ├── middleware/         # auth, error, logging middleware
│   │   ├── models/             # data access layer (SQL queries)
│   │   ├── routes/             # express routers
│   │   ├── services/           # business logic
│   │   ├── utils/              # helpers (ApiError, asyncHandler, etc.)
│   │   ├── app.js              # express app setup
│   │   └── server.js           # process entry point
│   ├── .env                    # local secrets (gitignored)
│   ├── .env.example            # env template
│   └── package.json
│
├── frontend/                   # Next.js + Tailwind UI (to be scaffolded)
│
├── docs/
│   ├── api.md                  # REST API reference
│   ├── db-schema.md            # database schema
│   └── flow.md                 # feature & system flows
│
├── .gitignore
└── README.md
```

---

## Prerequisites

| Tool          | Required Version |
| ------------- | ---------------- |
| Node.js       | **>= 18.x** (LTS recommended) |
| npm           | >= 9.x           |
| PostgreSQL    | >= 13            |
| Redis         | >= 6 (optional during early dev) |
| Elasticsearch | >= 8 (optional during early dev) |

> **Note:** The current dev machine reports Node `v10.24.1`. Please upgrade to Node 18+ before running the backend; several dependencies (`express@5`, `redis`, `winston`, `joi`, `@elastic/elasticsearch`) require it.

---

## Local Setup

### 1. Clone & install

```bash
git clone <repo-url>
cd HelpOrbit/backend
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# then edit .env with your local Postgres / Redis / JWT values
```

### 3. Create the database

```bash
createdb helporbit_db
# (schema/migrations will be added in a later step)
```

### 4. Run the backend

```bash
npm run dev      # auto-restart on file changes
# or
npm start
```

The API will be available at `http://localhost:5000`.

Health check: `GET http://localhost:5000/health`

---

## Project Roadmap (Step-by-Step)

- [x] **Step 1 – Project setup** (this step): folder structure, README, env config, logger, error handling, health endpoint
- [ ] Step 2 – Database schema + migrations (users, policies, assignments, acknowledgements, audit logs)
- [ ] Step 3 – Auth module (register, login, JWT, role-based middleware)
- [ ] Step 4 – User management module (admin CRUD)
- [ ] Step 5 – Policy management module (CRUD, assign, acknowledge)
- [ ] Step 6 – Analytics module + Redis caching
- [ ] Step 7 – Elasticsearch logging integration
- [ ] Step 8 – Frontend scaffold (Next.js + Tailwind)
- [ ] Step 9 – Frontend pages (login, admin dashboard, user dashboard)
- [ ] Step 10 – Deployment & monitoring (Docker, Kibana dashboards)

---

## License

ISC
