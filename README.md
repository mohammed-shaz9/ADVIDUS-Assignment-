# TaskFlow — Enterprise RBAC Task Manager

Enterprise-grade **Role-Based Access Control** system with AI-powered task delegation, real-time notifications, multi-level approvals, and a Linear/Notion-style UI. Built as a senior engineering demonstration.

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

## Modules

| Module | Description |
|---|---|
| **Auth & RBAC** | JWT login/register, role-based permissions (admin/user), session guard |
| **Task Management** | Kanban board, drag-and-drop, AI agent delegation, comments, real-time notifications |
| **Organization** | Department tree, designation hierarchy, org chart, company profile |
| **Workflow Approvals** | Multi-level approval chains with decide/reject |
| **Analytics & Reporting** | Chart.js (doughnut, bar) with task/user statistics, trends |
| **Performance Scoring** | Score rings, metrics per employee, auto-snapshot |
| **Audit & Compliance** | Immutable activity stream with 1000+ entries |
| **Identity & Access** | User directory, roles, permissions, security settings |
| **System Settings** | Configurable settings per group (general, notifications, security) |
| **Master Data** | Integration status dashboard, connected services |
| **Task Templates** | Reusable templates with checklist steps, recurring rules |

---

## TaskFlow UI Redesign

The interface follows a modern Linear/Notion-inspired design system:

- **Dark sidebar** (#0D0D12) with section grouping: Core Operations, Organization, Intelligence, Administration
- **Light content area** (#f5f5f7) with breadcrumb navigation
- **Brand:** "TaskFlow" with "Enterprise Platform" subtitle and gradient logo icon
- **Badge counts:** Red notification pills on sidebar items (e.g., Task Management shows pending count)
- **Notification dropdown:** Real-time bell with unread count, mark-read, auto-poll every 10s

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
taskflow-rbac/
├── backend/src/
│   ├── config/           # DB, env, Winston logger
│   ├── controllers/      # Thin request handlers
│   ├── services/         # Business logic (task, user, org, approval, notification, etc.)
│   ├── middleware/        # Auth, validation, error, rate limit, asyncHandler
│   ├── models/           # Mongoose schemas (11 models incl. Notification, TaskTemplate, SystemSetting)
│   ├── routes/           # API route definitions
│   ├── errors/           # Custom error classes
│   ├── utils/            # realtime.ts (Socket.IO helpers), asyncHandler.ts
│   ├── seed.ts           # Data seeding with lifecycle loops
│   └── server.ts         # Entry point, Socket.IO, auto-seed defaults
├── frontend/src/
│   ├── components/       # Layout (Sidebar, Topbar, AppLayout, NotificationBell), dashboard widgets
│   ├── pages/            # Dashboard (tab router), Templates, Settings, Integrations
│   ├── contexts/         # AuthContext
│   ├── services/         # API client (api.ts)
│   └── types/            # TypeScript interfaces
├── docker-compose.yml    # 3-container orchestration (mongo:7 + backend + nginx)
└── openapi.yml           # OpenAPI 3.0 spec
```

### Performance Optimizations

- **N+1 eliminated:** Analytics queries reduced from 2N+8 DB calls to 3 aggregation pipelines
- **7 countDocuments → 2 aggregations:** Using `$facet` and `$group` for metrics
- **$text indexes:** Admin task search uses MongoDB `$text` instead of `$regex`
- **5-second auto-refresh:** Dashboard data polls every 5s for live HR demo feel
- **Socket.IO:** Real-time per-user notification push via `registerUserSocket`

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
| GET/POST/PUT/DELETE | `/api/approvals` | Authenticated |
| GET/POST/PUT/DELETE | `/api/templates` | Admin |
| GET | `/api/templates/:id/generate` | Admin |
| GET/PATCH | `/api/notifications` | Authenticated |
| GET/PUT | `/api/settings` | Admin |
| GET | `/api/settings/integrations` | Admin |

Full spec: [`openapi.yml`](./openapi.yml)

---

## Tech Stack

- **Frontend:** React 19, Vite 8+, TypeScript, Chart.js, react-chartjs-2
- **Backend:** Node.js 22, Express 4, TypeScript, Mongoose 8, JWT, bcrypt
- **Database:** MongoDB 7 (replica set compatible)
- **Security:** Helmet, CORS, express-rate-limit, input validation
- **Real-time:** Socket.IO 4 with per-user notification routing
- **Container:** Docker Compose (mongo:7 + backend + frontend/nginx)
- **CI:** GitHub Actions (lint, typecheck, build)
- **Deployment:** Render (free tier) + MongoDB Atlas (free cluster)

---

## Project Status

All 11 backend modules implemented with full CRUD routes, services, and Mongoose models. Frontend redesigned with TaskFlow brand identity, task-based sidebar navigation with red badge counts, breadcrumbs, real-time notifications, and live data polling. Docker-deployed with 1000+ seeded data points. TypeScript strict mode throughout.

See [`SUBMISSION.md`](./SUBMISSION.md) for the HR-facing summary.
