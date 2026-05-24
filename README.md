# ADVIDUS Enterprise Platform

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white&style=flat-square)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white&style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white&style=flat-square)
![Node](https://img.shields.io/badge/Node-22-5FA04E?logo=nodedotjs&logoColor=white&style=flat-square)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white&style=flat-square)
![MongoDB](https://img.shields.io/badge/MongoDB-7-47A248?logo=mongodb&logoColor=white&style=flat-square)
![Mongoose](https://img.shields.io/badge/Mongoose-8-880000?logo=mongodb&logoColor=white&style=flat-square)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4-010101?logo=socketdotio&logoColor=white&style=flat-square)
![JWT](https://img.shields.io/badge/JWT-black?logo=jsonwebtokens&logoColor=white&style=flat-square)
![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white&style=flat-square)
![Render](https://img.shields.io/badge/Render-46E3B7?logo=render&logoColor=white&style=flat-square)
![Chart.js](https://img.shields.io/badge/Chart.js-4-FF6384?logo=chartdotjs&logoColor=white&style=flat-square)
![Winston](https://img.shields.io/badge/Winston-4-231F20?style=flat-square)

📌 Demonstrates Enterprise RBAC Concepts and Real-Time Systems
RBAC · Drag-and-Drop Kanban · Multi-Level Approvals · Real-Time WebSocket · N+1 Query Elimination · Audit Logging · Performance Analytics · Session Management · Departmental Access Control · Task Templates · Activity Simulation

🌐 Live App
https://avidus-frontend.onrender.com

✨ Overview
ADVIDUS is a production-style enterprise RBAC (Role-Based Access Control) task management platform built to demonstrate practical system design concepts in a realistic enterprise workflow.

The project focuses heavily on:

- Role-based access control with granular permissions
- Real-time collaboration via Socket.IO push notifications
- Drag-and-drop Kanban task management
- Multi-level approval workflows
- Performance scoring and analytics
- N+1 query elimination through aggregation pipelines
- Audit logging and compliance tracking
- Department-based organization hierarchy
- AI agent delegation hooks
- Activity simulation for live HR demos

Unlike academic mini-projects, this application demonstrates how enterprise-grade RBAC and real-time systems appear inside production software.

🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React 19 + Vite 8)            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │ AuthPage │ │Dashboard │ │Analytics │ │ Settings / Pages  │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │
│         │              │              │                         │
│    ┌────┴──────────────┴──────────────┴────────────────────┐    │
│    │              API Client (api.ts) + Cache Layer         │    │
│    │  localStorage cache · 4s polling · optimistic updates │    │
│    └────────────────────────┬──────────────────────────────┘    │
└─────────────────────────────┼───────────────────────────────────┘
                              │ HTTP + WebSocket
┌─────────────────────────────┼───────────────────────────────────┐
│                     Backend (Node 22 + Express 4)                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │ Auth     │ │ RBAC     │ │ Routes   │ │ Socket.IO Server │   │
│  │ JWT      │ │ Middleware│ │ REST API │ │ Real-time Events │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │
│         │              │              │                         │
│    ┌────┴──────────────┴──────────────┴────────────────────┐    │
│    │                 Services Layer                          │    │
│    │  Task · Auth · Admin · Approval · Notification · Org  │    │
│    │  Performance · Settings · Templates · Agent           │    │
│    └────────────────────────┬──────────────────────────────┘    │
│                             │                                   │
│    ┌────────────────────────┴──────────────────────────────┐    │
│    │              Data Layer (Mongoose ODM)                 │    │
│    │  11 Models · Aggregation Pipelines · Indexes          │    │
│    └────────────────────────┬──────────────────────────────┘    │
└─────────────────────────────┼───────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │   MongoDB 7        │
                    │  (Replica Set)     │
                    └───────────────────┘
```

Architecture Summary
- **React + Vite** provides the frontend UI with lazy-loaded code splitting
- **Express 4** exposes REST APIs with JWT authentication
- **MongoDB 7** stores all relational and document data
- **Socket.IO** handles real-time notifications
- **Docker Compose** orchestrates all 3 services
- **Render + MongoDB Atlas** for production hosting

Why this architecture?

| Component | Why Used |
|---|---|
| MongoDB 7 | Flexible schemas, aggregation pipelines, indexed queries |
| Mongoose 8 | ODM with schema validation, populate, indexes |
| Socket.IO | Per-user real-time notification routing |
| Express 4 | Middleware-based RBAC, rate limiting, async error handling |
| React 19 | Component-based UI with Suspense, lazy loading |
| Vite 8 | Fast dev server, optimized production builds |

🧩 Entity Relationship

Main MongoDB Collections

| Collection | Key Fields | Relationships |
|---|---|---|
| `users` | `_id`, `name`, `email`, `role`, `status`, `department`, `lastLogin` | References in tasks, logs, approvals |
| `tasks` | `_id`, `title`, `status`, `owner`, `assignedTo`, `dueDate` | `owner` → users, `assignedTo` → users/agents |
| `activitylogs` | `_id`, `userId`, `action`, `details`, `createdAt` | `userId` → users |
| `approvals` | `_id`, `task`, `approver`, `level`, `status`, `comment` | `task` → tasks, `approver` → users |
| `agents` | `_id`, `name`, `role`, `status`, `modelName` | `creator` → users |
| `notifications` | `_id`, `userId`, `type`, `title`, `message`, `read` | `userId` → users |
| `performancemetrics` | `_id`, `user`, `score`, `period`, `snapshotDate` | `user` → users |
| `tasktemplates` | `_id`, `name`, `checklistSteps`, `isRecurring` | `createdBy` → users |
| `departments` | `_id`, `name`, `parentId`, `head` | `parentId` → departments |
| `settings` | `_id`, `key`, `value`, `group` | Self-contained |

Relationships Demonstrated
- One-to-many (user → tasks, user → logs)
- Many-to-many (tasks ↔ approvals, users ↔ departments)
- Parent-child hierarchy (departments)
- Indexed text search (tasks title + description)
- Compound indexes (user status + role, activity action + createdAt)

⚡ Quick Start

```bash
# Option A: Docker (recommended)
docker compose up --build -d
docker compose exec backend npm run seed

# Option B: Manual Development
# Terminal 1 — Backend:
cd backend
cp .env.example .env
npm install
npm run seed
npm run dev

# Terminal 2 — Frontend:
cd frontend
npm install
npm run dev
```

🌐 Services (Local Docker)

| Service | URL |
|---|---|
| Frontend | http://localhost:5180 |
| Backend API | http://localhost:5050/api |
| Swagger Docs | http://localhost:5050/api-docs |
| MongoDB | localhost:27017 |

🔑 Demo Credentials

| Role | Name | Email | Password |
|---|---|---|---|
| Admin | Admin User | admin@example.com | Admin@123 |
| Employee | Alice Johnson | alice@demo.com | User@123 |
| Employee | Bob Williams | bob@demo.com | User@123 |
| Employee | Charlie Brown | charlie@demo.com | User@123 |
| Employee | Diana Prince | diana@demo.com | User@123 |
| Employee | Eve Martinez | eve@demo.com | User@123 |

Plus 100 seeded employees across departments — all use password `User@123`.

🧠 Enterprise Concepts Demonstrated

RBAC (Role-Based Access Control)
- Two roles: `admin` and `user`
- JWT authentication with token verification and expiry
- Middleware-level permission enforcement (`protect`, `adminOnly`, `checkPermission`)
- Role-based UI rendering (admin gets full control panel, employee gets personal workspace)
- Session guard with 30-second status polling
- Account deactivation detection and auto-logout

Real-Time Collaboration
- Socket.IO with per-user notification routing (`emitToUser`)
- Live 4-second auto-refresh on all dashboard data
- WebSocket events: `task.created`, `task.updated`, `task.deleted`, `user.status_changed`, `activity.created`
- Notification bell with unread count and dropdown
- Activity simulation endpoint randomly flips task statuses for live demo effect

ACID Transactions (MongoDB)
- Task creation and assignment in atomic operations
- Approval chain decisions update both approval and task status atomically
- Activity logging paired with mutations via `logActivity()`
- Aggregation pipelines with `$facet` for consistent analytics

N+1 Query Elimination
- Analytics: reduced from 2N+8 DB calls to 3 aggregation pipelines
- Metrics: replaced 7 `countDocuments` calls with 2 aggregations using `$facet`/`$group`
- Dashboard: batched endpoint (`GET /api/admin/dashboard`) combines 5 service calls into 1
- Performance: user metrics fetched via single `$group` + `$first` pipeline instead of N+1 loop

Performance Optimization
- **Frontend**: localStorage cache with version invalidation — instant data on page load
- **Code splitting**: `React.lazy()` for tab pages — 520 KB → 313 KB initial bundle (40% smaller)
- **Optimistic updates**: Approve/Reject reflects immediately in UI before API responds
- **Background refresh**: stale-while-revalidate pattern — shows cached data, refreshes silently
- **Error resilience**: `Array.isArray` guards on all `.filter()` / `.slice()` calls — never crashes on bad data

Indexing Strategy
- `User`: compound index on `status + role`, index on `role + name`
- `Agent`: index on `status`, compound on `role + status`
- `ActivityLog`: compound on `action + createdAt`, `userId + createdAt`
- `Task`: `$text` index on `title + description` for full-text search
- `Approval`: compound on `approver + status`

📊 Frontend Architecture

```
frontend/src/
├── components/
│   ├── common/          # ErrorBoundary, LoadingSpinner, Skeleton, ToastContainer
│   ├── dashboard/       # StatsGrid, WeeklyChart, ActivityFeed, Widgets
│   ├── layout/          # Sidebar, Topbar, AppLayout, NotificationBell
│   ├── tasks/           # KanbanBoard, KanbanColumn, TaskFormModal, TaskMonitorTable
│   └── users/           # UserTable
├── pages/               # Lazy-loaded: Dashboard, Analytics, Performance, Settings, etc.
├── contexts/            # AuthContext (JWT, user state, toast notifications)
├── hooks/               # useAdmin, useTasks (cache-first data loading)
├── services/            # api.ts (all HTTP client functions)
├── types/               # TypeScript interfaces (User, Task, Approval, etc.)
└── utils/               # cache.ts (localStorage), socket.ts
```

🔐 RBAC Implementation Detail

Database-Level
- `users.role` field: `'admin' | 'user'`
- `users.status` field: `'active' | 'inactive'`
- Permissions enforced via middleware chain

Middleware Chain
1. `protect` — verify JWT, attach user to request
2. `adminOnly` — restrict route to admin role
3. `checkPermission('scope:action')` — granular permission check

UI Enforcement
- Sidebar items filter by role (admin-only items hidden from employees)
- Admin gets full control panel with all tabs
- Employees see personal workspace with Kanban, analytics, performance, settings
- Department-based data scoping for employee widgets

🔌 API Surface

**Authentication**
| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/auth/login` | Public |
| POST | `/api/auth/register` | Public |
| GET | `/api/auth/me` | Authenticated |
| POST | `/api/auth/ensure-demo` | Public |
| GET | `/api/auth/credentials` | Public |

**Tasks**
| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/tasks` | Authenticated |
| POST | `/api/tasks` | Authenticated |
| GET | `/api/tasks/summary` | Authenticated |
| PUT | `/api/tasks/:id` | Authenticated |
| DELETE | `/api/tasks/:id` | Authenticated |
| POST | `/api/tasks/simulate` | Authenticated |

**Admin**
| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/admin/dashboard` | Admin (batched — 5 calls in 1) |
| GET | `/api/admin/users` | Authenticated |
| GET | `/api/admin/logs` | Authenticated |
| GET | `/api/admin/tasks` | Admin |
| PATCH | `/api/admin/users/:id/status` | Admin |
| DELETE | `/api/admin/users/:id` | Admin |

**Approvals**
| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/approvals/my` | Authenticated |
| POST | `/api/approvals/task/:taskId/decide` | Authenticated |

**Analytics**
| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/analytics` | Authenticated (public stats) |
| GET | `/api/admin/analytics` | Admin |
| GET | `/api/admin/metrics` | Admin |

**Organization**
| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/org/departments` | Authenticated |
| GET | `/api/org/designations` | Authenticated |
| GET | `/api/org/chart` | Authenticated |

**Performance**
| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/performance/me` | Authenticated |
| GET | `/api/performance/all` | Admin |
| POST | `/api/performance/snapshot` | Admin |

**Notifications, Templates, Settings**
| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/notifications` | Authenticated |
| GET | `/api/templates` | Admin |
| GET | `/api/settings` | Admin |
| GET | `/api/settings/integrations` | Admin |

Full spec available in `openapi.yml`

📦 Project Structure

```
avidus-rbac/
├── backend/src/
│   ├── config/           # DB connection, env vars, Winston logger
│   ├── controllers/      # Thin request/response handlers
│   ├── services/         # Business logic (11 modules)
│   ├── middleware/        # Auth (JWT), validation, error handler, rate limiter
│   ├── models/           # Mongoose schemas (11 collections)
│   ├── routes/           # API route definitions
│   ├── errors/           # Custom error classes (NotFound, Forbidden, etc.)
│   ├── utils/            # Socket.IO helpers, activity logger
│   ├── seed.ts           # 4-phase data seeding (100+ employees, 450+ tasks)
│   ├── server.ts         # Entry point with Socket.IO setup
│   └── types/            # TypeScript type definitions
├── frontend/src/
│   ├── components/       # UI components (layout, widgets, forms)
│   ├── pages/            # Page components (lazy-loaded)
│   ├── contexts/         # React context providers
│   ├── hooks/            # Custom hooks with cache integration
│   ├── services/         # API client
│   ├── utils/            # Cache utility, socket helpers
│   └── types/            # Shared interfaces
├── docker-compose.yml    # 3-service orchestration
├── render.yaml           # Render deployment config
└── openapi.yml           # API specification
```

🐳 Dockerized Deployment

All services are containerized using Docker Compose.

Benefits:
- One-command setup (`docker compose up --build`)
- Consistent environments across machines
- Service isolation with health checks
- Persistent MongoDB data volume

Deployment (Production)

Render (free tier) + MongoDB Atlas (free cluster):
- Backend spins down after 15 min idle: first visit ~30s cold start
- Auto-deploys from `main` branch on push
- Environment variables configured via Render dashboard

📈 Monitoring & Observability

The backend includes structured logging with Winston:
- Log levels: `debug`, `info`, `warn`, `error`
- HTTP request logging via Morgan
- Global error handlers with stack trace capture
- Unhandled rejection and uncaught exception handlers
- MongoDB connection event logging

Frontend includes:
- Global `window.onerror` and `unhandledrejection` listeners
- ErrorBoundary component around every widget
- Toast notification system for user feedback
- Console-error logging for debugging

🎯 Demo Highlights

During project demonstration:

1. **Login as Admin** — see full control panel with all 11 modules
2. **Login as Employee** — see personal workspace with Kanban board
3. **Dashboard** — live 4-second auto-refresh with changing numbers
4. **Kanban** — drag-and-drop tasks between columns
5. **Approvals** — create and decide multi-level approval chains
6. **Analytics** — real-time doughnut and bar charts
7. **Performance** — employee scoring with refresh snapshot
8. **Template Manager** — create task templates with checklist steps
9. **Audit Logs** — immutable activity stream with filters
10. **Activity Simulation** — tasks change status automatically every 4 seconds

🧪 Testing

- 27 white-box Vitest tests (authMiddleware, authService, adminService, rateLimiter)
- All tests pass with proper mock chains for Mongoose operations
- TypeScript strict mode enabled across the codebase

🏁 Conclusion

ADVIDUS demonstrates how enterprise RBAC concepts and real-time systems integrate into production software instead of isolated academic examples.

The project combines:
- Role-based access control with JWT authentication
- Real-time collaboration with WebSocket push
- Drag-and-drop Kanban task management
- Multi-level approval workflows
- N+1 query elimination via aggregation pipelines
- Optimized frontend with code splitting and caching
- Activity simulation for live demonstrations

making it ideal for:
- Enterprise architecture demonstrations
- RBAC system design presentations
- Full-stack portfolio showcases
- Technical viva and interview discussions

---

⭐ Built with React 19, Node 22, Express 4, MongoDB 7, Docker, and TypeScript.
