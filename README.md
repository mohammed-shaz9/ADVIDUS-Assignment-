# Avidus Interactive — Premium RBAC Task Manager

Enterprise-grade **Role-Based Access Control** system with AI-powered task delegation, 7-module architecture, real-time audit trails, and full Docker deployment.

**Stack:** React 19 + Vite 8 + TypeScript (frontend) · Node.js 22 + Express 4 + MongoDB 7 (backend) · Docker Compose

---

## First-Time Setup (AI IDE Users)

If you opened this project in an AI IDE (Cursor, Windsurf, Claude Code, etc.), follow these steps to get everything running:

### Prerequisites (one-time install)
```bash
# Install Node.js 22+ and Docker Desktop first
# Then:
npm install --global tsx    # For running seed script
```

### Option A — Docker (recommended, easiest)
```bash
docker compose up --build -d
docker compose exec backend npm run seed
```

### Option B — Manual (no Docker)
```bash
# Terminal 1: Backend
cd backend
cp .env.example .env          # Edit JWT_SECRET if desired
npm install
npm run seed
npm run dev

# Terminal 2: Frontend
cd frontend
npm install
npm run dev
```

### Verify it works
Open **http://localhost:5180** in your browser. Login with:

| Role | Email | Password |
|---|---|---|
| Admin | admin@example.com | Admin@123 |
| Employee | (any) | User@123 |

---

## Quick Start

```bash
docker compose up --build -d          # Start all 3 containers
docker compose exec backend npm run seed  # Seed 100+ employees, 450+ tasks
```

**Open:** [http://localhost:5180](http://localhost:5180) — Login: `admin@example.com` / `Admin@123`

---

## 7 Modules

| Module | Description |
|---|---|
| **Auth** | JWT login/register, RBAC permissions, session guard |
| **Task Management** | Kanban board, drag-and-drop, AI agent delegation, comments |
| **Organization** | Department tree, designation hierarchy, org chart |
| **Workflow Approvals** | Multi-level approval chains with decide/reject |
| **Analytics** | Chart.js (doughnut, bar) with task/user statistics |
| **Performance Scoring** | Score rings, metrics per employee, auto-snapshot |
| **Audit Logging** | Immutable activity stream with 1000+ entries |

---

## Data Lifecycle (seed.ts)

The seed script (`backend/src/seed.ts`) simulates a realistic **4-phase task lifecycle** that HR can read and understand:

| Phase | What happens | Count |
|---|---|---|
| PHASE 1 | All 459 tasks created as `pending` | 459 |
| PHASE 2 | ~35% moved to `in_progress` with comments | ~168 |
| PHASE 3 | ~70% of those completed, comments + approvals added | ~117 |
| PHASE 4 | Every event logged to activity trail | 1000+ |

**Each phase is a clearly commented loop in seed.ts.** The performance score (25% avg) reflects actual completion rates.

---

## Architecture

```
avidusinteractive-rbac-app/
├── backend/src/
│   ├── config/        # DB, env, Winston logger
│   ├── controllers/   # Thin request handlers
│   ├── services/      # Business logic
│   ├── middleware/     # Auth, validation, error, rate limit
│   ├── models/        # Mongoose schemas (10 models)
│   ├── routes/        # API route definitions
│   ├── errors/        # Custom error classes
│   ├── seed.ts        # Data seeding with lifecycle loops
│   └── server.ts      # Entry point
├── frontend/src/
│   ├── components/    # Layout, dashboard, tasks, users, agents, activity
│   ├── pages/         # 6 page components
│   ├── hooks/         # useTasks, useAdmin
│   ├── contexts/      # AuthContext
│   ├── services/      # API client
│   └── types/         # TypeScript interfaces
├── docker-compose.yml # 3-container orchestration
└── openapi.yml        # OpenAPI 3.0 spec
```

---

## API Endpoints

| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/auth/login` | Public |
| POST | `/api/auth/register` | Public |
| GET/POST/PUT/DELETE | `/api/tasks` | Authenticated |
| GET | `/api/tasks/summary` | Authenticated |
| GET | `/api/org/departments` | Authenticated |
| GET | `/api/org/designations` | Authenticated |
| GET | `/api/org/chart` | Authenticated |
| GET | `/api/performance/me` | Authenticated |
| GET | `/api/performance/all` | Authenticated |
| GET/POST | `/api/agents` | Authenticated |
| GET/PUT/DELETE | `/api/admin/users` | Admin |
| GET | `/api/admin/tasks` | Admin |
| GET | `/api/admin/logs` | Admin |
| GET | `/api/admin/metrics` | Admin |
| GET | `/api/admin/analytics` | Admin |
| GET/POST | `/api/approvals` | Authenticated |

Full spec: [`openapi.yml`](./openapi.yml)

---

## Tech Stack

- **Frontend:** React 19, Vite 8, TypeScript, Chart.js, react-chartjs-2
- **Backend:** Node.js 22, Express 4, TypeScript, Mongoose 8, JWT, bcrypt
- **Database:** MongoDB 7 (replica set compatible)
- **Security:** Helmet, CORS, express-rate-limit, input validation
- **Real-time:** Socket.IO 4
- **Container:** Docker Compose (mongo:7 + backend + frontend/nginx)
- **CI:** GitHub Actions (lint, typecheck, build)

---

## Project Status

Developed as a senior engineering demonstration. All 7 modules implemented, Docker-deployed, 1000+ data points, TypeScript strict mode throughout. See [`SUBMISSION.md`](./SUBMISSION.md) for the HR-facing summary.
