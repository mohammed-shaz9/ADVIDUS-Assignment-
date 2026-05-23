# TaskFlow -- Enterprise RBAC Task Manager

## Product Overview

TaskFlow is an enterprise-grade Role-Based Access Control (RBAC) task management platform built for organizations that need granular permission control, real-time collaboration, and actionable analytics. It solves the common pain points of task delegation, multi-level approval workflows, audit compliance, and performance tracking -- all within a single, modern interface.

Key differentiators:
- **Granular RBAC** with admin/user roles, session guards, and department-based access
- **Real-time everything** -- 4-second auto-refresh, Socket.IO push notifications, live chart updates
- **AI-ready architecture** with agent delegation hooks and activity logging
- **N+1 query elimination** -- analytics reduced from 2N+8 DB calls to 3 aggregation pipelines
- **100+ seeded employees, 450+ tasks, 1000+ activity log entries** for immediate demo and testing

## Architecture Overview

```
Frontend:  React 19 + Vite 8 + TypeScript + Chart.js (doughnut/bar) + react-chartjs-2
Backend:   Node.js 22 + Express 4 + TypeScript + Mongoose 8
Database:  MongoDB 7 (replica set compatible)
Real-time: Socket.IO 4 with per-user notification routing
Deployment: Docker Compose (3 containers) / Render (free tier) + MongoDB Atlas (free cluster)
```

### Directory Tree

```
taskflow-rbac/
├── backend/src/
│   ├── config/           # DB connection, environment, Winston logger
│   ├── controllers/      # Thin request handlers
│   ├── services/         # Business logic (task, user, org, approval, notification, etc.)
│   ├── middleware/        # Auth (JWT), validation, error handler, rate limiter
│   ├── models/           # Mongoose schemas (11 models)
│   ├── routes/           # API route definitions
│   ├── errors/           # Custom error classes
│   ├── utils/            # realtime.ts (Socket.IO helpers), activityLogger
│   ├── seed.ts           # Data seeding with 4-phase lifecycle
│   └── server.ts         # Entry point, Socket.IO setup, auto-seed
├── frontend/src/
│   ├── components/       # Layout (Sidebar, Topbar, AppLayout, NotificationBell), widgets
│   ├── pages/            # Dashboard, Analytics, Templates, Settings, Integrations
│   ├── contexts/         # AuthContext (JWT, user state, toasts)
│   ├── services/         # API client (api.ts)
│   └── types/            # TypeScript interfaces
├── docker-compose.yml    # 3-container: mongo:7 + backend + frontend/nginx
└── openapi.yml           # OpenAPI 3.0 specification
```

## Module Map

| Module | Description |
|---|---|
| Auth & RBAC | JWT login/register, role-based permissions (admin/user), session guard |
| Task Management | Kanban board, drag-and-drop, AI agent delegation, comments, real-time notifications |
| Organization | Department tree, designation hierarchy, org chart |
| Workflow Approvals | Multi-level approval chains |
| Analytics & Reporting | Live-updating charts (doughnut, bar) with task/user statistics |
| Performance Scoring | Score rings, metrics per employee, auto-snapshot |
| Audit & Compliance | Immutable activity stream |
| Identity & Access | User directory, roles, permissions |
| System Settings | Configurable settings per group |
| Master Data | Integration status dashboard |
| Task Templates | Reusable templates with checklist steps |

## Quick Start

```bash
# Option A: Docker (recommended)
docker compose up --build -d
docker compose exec backend npm run seed

# Option B: Manual
# Terminal 1:
cd backend && cp .env.example .env && npm install && npm run seed && npm run dev
# Terminal 2:
cd frontend && npm install && npm run dev
```

Open http://localhost:5180

## Demo Credentials

| Role | Name | Email | Password |
|---|---|---|---|
| Admin | Admin User | admin@example.com | Admin@123 |
| Employee | Alice Johnson | alice@demo.com | User@123 |
| Employee | Bob Williams | bob@demo.com | User@123 |
| Employee | Charlie Brown | charlie@demo.com | User@123 |
| Employee | Diana Prince | diana@demo.com | User@123 |
| Employee | Eve Martinez | eve@demo.com | User@123 |

Plus 100 seeded employees -- all use password `User@123`.

## Feature Highlights (for managers)

- Live 4-second auto-refresh on all dashboard data
- Real-time numbers change via activity simulation
- Dark sidebar + clean content area (Linear/Notion inspired)
- Role-based UI: admins see full control panel, employees see personal workspace
- 6 pre-configured demo users + 100 seeded employees with departments
- Charts and graphs update in real-time with task status changes
- Socket.IO push notifications for task assignments
- N+1 query optimization: 3 aggregation pipelines replace 2N+8 DB calls

## API Endpoints

| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/auth/login` | Public |
| POST | `/api/auth/register` | Public |
| GET | `/api/auth/me` | Authenticated |
| GET | `/api/tasks` | Authenticated |
| POST | `/api/tasks` | Authenticated |
| GET | `/api/tasks/summary` | Authenticated |
| GET | `/api/tasks/:id` | Authenticated |
| PUT | `/api/tasks/:id` | Authenticated |
| DELETE | `/api/tasks/:id` | Authenticated |
| GET | `/api/tasks/:taskId/comments` | Authenticated |
| POST | `/api/tasks/:taskId/comments` | Authenticated |
| PUT | `/api/tasks/:taskId/comments/:commentId` | Authenticated |
| DELETE | `/api/tasks/:taskId/comments/:commentId` | Authenticated |
| GET | `/api/org/departments` | Authenticated |
| GET | `/api/org/designations` | Authenticated |
| GET | `/api/org/chart` | Authenticated |
| GET | `/api/performance/me` | Authenticated |
| GET | `/api/performance/all` | Authenticated |
| GET | `/api/agents` | Authenticated |
| POST | `/api/agents` | Authenticated |
| GET | `/api/agents/:id` | Authenticated |
| PUT | `/api/agents/:id` | Authenticated |
| DELETE | `/api/agents/:id` | Authenticated |
| GET | `/api/approvals` | Authenticated |
| POST | `/api/approvals` | Authenticated |
| PUT | `/api/approvals/:id` | Authenticated |
| DELETE | `/api/approvals/:id` | Authenticated |
| GET | `/api/notifications` | Authenticated |
| PATCH | `/api/notifications/:id` | Authenticated |
| GET | `/api/admin/users` | Admin |
| GET | `/api/admin/users/:id` | Admin |
| PUT | `/api/admin/users/:id` | Admin |
| DELETE | `/api/admin/users/:id` | Admin |
| GET | `/api/admin/tasks` | Admin |
| GET | `/api/admin/logs` | Admin |
| GET | `/api/admin/metrics` | Admin |
| GET | `/api/admin/analytics` | Admin |
| GET | `/api/analytics` | Authenticated |
| GET | `/api/templates` | Admin |
| POST | `/api/templates` | Admin |
| GET | `/api/templates/:id` | Admin |
| PUT | `/api/templates/:id` | Admin |
| DELETE | `/api/templates/:id` | Admin |
| GET | `/api/templates/:id/generate` | Admin |
| GET | `/api/settings` | Admin |
| PUT | `/api/settings` | Admin |
| GET | `/api/settings/integrations` | Admin |

Full spec: `openapi.yml`

## Deployment

Render (free tier) + MongoDB Atlas (free cluster)
- Backend spins down after 15 min idle: first visit ~30s cold start
- Auto-deploys from main branch
- Docker Compose for local development (mongo:7 + backend + nginx)
