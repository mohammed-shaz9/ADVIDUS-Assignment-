# ADVIDUS — Developer Handover

Everything a new developer needs to run, extend and operate this app at **~60,000 employees / 50,000+ tasks**.
Read this first, then `README.md` (feature tour) and `openapi.yml` (endpoint list — see "API changes" below for what moved).

## 1. What this is

RBAC task manager. Two roles (`admin`, `user`), JWT auth, Kanban tasks, approvals, activity audit log, org chart,
performance scores, real-time updates over Socket.IO. Monorepo, deployed from this folder:

| Part | Folder | Hosting (see `render.yaml`) |
|---|---|---|
| API (Node 22, Express 4, Mongoose 8, TS/ESM) | `backend/` | Render web service `avidus-backend` |
| SPA (React 19, Vite 8, TS) | `frontend/` | Render static site `avidus-frontend` |
| Database | — | MongoDB (Atlas in prod, `mongo:7` in `docker-compose.yml`) |

## 2. Run it

```bash
# backend
cd backend && cp .env.example .env     # set MONGO_URI + JWT_SECRET
npm install && npm run seed && npm run dev      # API :5050
# frontend
cd frontend && npm install && npm run dev       # UI  :5180
```

Quality gates (same as CI): `npm run typecheck && npm test && npm run build` in `backend/`;
`npm run typecheck && npm run lint && npm run build` in `frontend/`.

Scale rehearsal (needs a running MongoDB, never production):

```bash
cd backend
npm run seed:bulk -- --yes                 # 60,000 users + 50,000 tasks, then prints hot-query timings
npm run seed:bulk -- --users=10000 --tasks=8000 --reset --yes   # smaller, re-runnable
```
Bulk users are `u<N>@seed.local`, password `Seed@12345`. `--reset` deletes exactly those rows.
The script refuses `NODE_ENV=production` and requires `--yes`; it prints the target `host/db` first.

## 3. The scale rules (why the code looks the way it does)

1. **No unbounded list, ever.** Every list goes through `utils/paginate.ts` (`parsePage` clamps `page/limit`,
   `pageResult` builds `{items,page,limit,total,totalPages,serverTime}`). Defaults/caps: users 50/100, logs 50/100,
   admin tasks 25/200, my tasks 200/500, leaderboard 50/200, org-chart sample 500.
2. **`.lean()` + projection on reads** — plain objects, no Mongoose hydration for 50-row pages.
3. **Search inputs are untrusted.** `str()` drops arrays/objects (`?q[$ne]=x`), `oneOf()` whitelists enums,
   `escapeRegex()` before any `RegExp`. Non-admin user search matches **name prefix only** (an email-prefix search would leak the address list).
4. **Analytics = bounded.** `getAnalytics` returns the top-N owners (`?top=20`, max 100); `$limit` runs *before* `$lookup`.
   Counts use one grouped aggregate per collection, wrapped in `utils/memo.ts` (5 s TTL, shared in-flight promise).
5. **Auth is cached.** `protect` reads `{role,status}` lean and keeps it 5 s in `utils/userCache.ts`;
   `toggleUserStatus`/`deleteUser` call `invalidateUser()`. Deactivation bites immediately on the instance that handled it, ≤5 s elsewhere.
6. **Realtime is room-scoped.** Sockets join `user:<id>` (and `admins` for admins). `emitEvent(event, payload, userIds[])`
   sends to `admins` + those user rooms only. Never call `io.emit()` — at 60k sockets one task update would be 60k messages.
7. **Indexes are a deploy step.** `autoIndex` is off in production (`config/db.ts`). `npm run indexes`
   (`src/syncIndexes.ts`, additive `createIndexes()`) runs in `render.yaml` start command and the backend Dockerfile.
   Add an index to a schema → it is built on next deploy.
8. **Rate limits are per IP and env-tunable** (`API_RATE_MAX`, `AUTH_RATE_MAX`). Only *failed* logins count toward the auth limit,
   so thousands of employees behind one office IP can still sign in. Behind a proxy set `TRUST_PROXY=1` or everyone shares one bucket.

## 4. RBAC matrix (source of truth: `utils/permissions.ts` + route middleware)

| Capability | admin | user |
|---|---|---|
| Own + assigned tasks: list / create / edit | yes | yes |
| Task assigned to me but owned by someone else | yes | **status only** (other fields silently ignored) |
| Delete task | yes | no — `tasks:delete` is admin-only (route returns 403) |
| `GET /admin/users` | full rows, filters | active users, `{_id,name,designation}` only |
| `GET /admin/logs` | all | own entries only |
| `GET /admin/tasks`, `/metrics`, `/analytics`, `/dashboard` | yes | no |
| Toggle / delete users | yes (not yourself) | no |
| `GET /performance/user/:id` | any | own id only |
| Agents | read + write | read (active only) |

Product decision to confirm: employees cannot delete even their own tasks. To allow it, grant `tasks:delete` to `user`
in `permissions.ts` — `taskService.deleteTask` already restricts non-admins to tasks they own.

Deleting a user removes their owned tasks and notifications, and clears them as assignee on other people's tasks.

## 5. API changes in this release (frontend already updated)

| Endpoint | Before | Now |
|---|---|---|
| `GET /api/admin/users` | whole table, any logged-in user | paginated `{items,…}`; `?page&limit&q&role&status`; role-aware projection |
| `GET /api/admin/logs` | page/limit, any user saw all | adds `?action`; non-admin sees own only |
| `GET /api/admin/dashboard` | `users` = every user | `users` = first page (10) in paginated shape |
| `GET /api/admin/analytics` | per-owner stats for **all** owners | `?top=20` (max 100) |
| `GET /api/tasks` | owner's tasks, unbounded | owned **or assigned**, `?limit&status&page`, still a plain array |
| `GET /api/tasks/summary` | string id in `$match` → never matched ObjectId → always zeros | ObjectId cast; owned or assigned |
| `GET /api/performance/all` | every user | top-N leaderboard `?limit=50` (max 200) |
| `GET /api/org/chart` | every active user | 500-user sample + `departmentCounts` |
| `GET /api/org/my-department` | — (new) | `{total,active,inactive,roles}` for the caller's own department; feeds the employee "Department Overview" widget so employees never receive the user list |
| `POST /api/tasks/simulate` | any user could randomly flip real task statuses | removed unless `ENABLE_SIMULATION=true`, then admin-only |

## 6. Environment variables

| Var | Default | Purpose |
|---|---|---|
| `MONGO_URI`, `JWT_SECRET` | required | |
| `PORT`, `NODE_ENV`, `CORS_ORIGIN`, `JWT_EXPIRES_IN`, `LOG_LEVEL` | see `.env.example` | |
| `TRUST_PROXY` | `0` | proxy hops (Render/Nginx = `1`) |
| `API_RATE_MAX` / `AUTH_RATE_MAX` | `2000` / `50` | per-IP, per 15 min |
| `DEMO_MODE` | `true` | `false` disables public demo-credential endpoints (they publish a shared password) |
| `AUTO_SEED` | `true` | `false` stops the small demo seed on an empty DB |
| `ENABLE_SIMULATION` | `false` | demo-only random status flipper |

**Before a real rollout:** `DEMO_MODE=false`, `AUTO_SEED=false`, strong `JWT_SECRET`, `TRUST_PROXY=1`.

## 7. Fixed along the way (so nobody re-introduces them)

- Email regex was ReDoS-prone and rejected `.tech`/`.online` TLDs → `EMAIL_RE` in `middleware/validator.ts` (length-capped, tested).
- Global `io.emit` fan-out and per-socket Map bookkeeping → rooms.
- `uncaughtException` handler logged and kept running → now exits so the supervisor restarts a clean process.
- Render health check pointed at an authenticated route (`/api/auth/me`, always 401) → `/`.
- Graceful shutdown on SIGTERM/SIGINT; Mongo pool 50; 5 s server-selection timeout.
- `loginUser` no longer does a full-document `save()` just to stamp `lastLogin`.
- `snapshotAllPerformance`: 2 queries per user in a loop → one grouped scan + chunked `insertMany`.

## 8. Known ceilings (be honest with stakeholders)

- **Not load-tested against live MongoDB in the session that wrote this.** The unit suite is mock-based. Run `seed:bulk` and read the timings before promising numbers.
- **Login CPU.** `bcryptjs` is pure JS; 60k people signing in at 9:00 sharing one Node process is the first thing to saturate. Options: several instances, or swap to native `bcrypt` (same hash format, drop-in).
- **Multiple API instances** need the Socket.IO Redis adapter + sticky sessions (rooms and the two 5 s caches are per process).
- **Render free tier** sleeps and has ~512 MB RAM — fine for a demo, not for 60k live sockets.
- **Name search** is an anchored case-insensitive prefix regex: fine at 60k, add a lower-cased indexed field past ~1M users.
- **Performance snapshots** add one document per active owner per snapshot — add a retention/TTL policy before scheduling them.
- **JWT lifetime** is 30 days; revocation is only the status check (≤5 s lag), there is no token blocklist.

## 9. Where things live

```
backend/src
  server.ts            app + Socket.IO rooms + graceful shutdown
  config/              env.ts (typed env), db.ts (pool, autoIndex), logger.ts
  middleware/          authMiddleware (protect/adminOnly/checkPermission), validator, rateLimiter, errorHandler
  services/            business logic — controllers stay thin
  utils/               paginate.ts, memo.ts, userCache.ts, realtime.ts, permissions.ts, activityLogger.ts
  models/              Mongoose schemas + indexes (comment each index with the query it serves)
  seed.ts              small demo dataset      seedBulk.ts   60k load dataset      syncIndexes.ts   deploy-time indexes
backend/tests          vitest, mock-based (no DB needed)
```
