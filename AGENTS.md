# TaskFlow — Session Context

## Goal
Upgrade a full-stack RBAC Task Manager (React 19 / Vite / Node 22 / Express / MongoDB 7 / Docker Compose) to match a professional "TaskFlow"-style enterprise dashboard UI and add remaining modules from the architecture doc.

## Constraints & Preferences
- Keep current tech stack (Node/Express/MongoDB/React 19), do not switch to FastAPI/PostgreSQL.
- Skip WhatsApp AI module.
- UI must match the reference screenshot: dark sidebar + light content area, Linear/Notion style, organized sidebar sections (Core Operations, Organization, Intelligence, Administration), breadcrumbs, red notification badges on sidebar items, brand name "TaskFlow" with "Enterprise Platform" subtitle.
- All new backend modules must have full CRUD routes, services, models, and frontend pages.
- Data must refresh every 4 seconds so numbers look alive for HR demo.
- Project is on GitHub (`mohammed-shaz9/ADVIDUS-Assignment-`), deployed on Render free tier + MongoDB Atlas free cluster.
- The assignment requires a feature branch + PR; current branch is `feature/role-based-access-activity-tracking`.

## Git Branches
- `main` — deployed on Render, auto-deploys on push
- `feature/role-based-access-activity-tracking` — active development branch

## Progress

### Done
- Created 3 new backend models: TaskTemplate, Notification, SystemSetting.
- Created backend services + routes for Task Templates (CRUD + generate tasks), Notifications (CRUD, mark-read, real-time WebSocket push), System Settings (get by group, update, seed defaults), Integrations (status dashboard).
- Added `emitToUser()` in `realtime.ts` with per-user socket tracking.
- Registered user sockets in `server.ts` Socket.IO connection handler.
- Added notification hooks in `taskService.ts` for task assignment and status change.
- Added auto-seed of default settings in `server.ts` (`seedDefaults()` from `settingsService.ts`).
- Added MongoDB indexes to User (status, role+name), Agent (status), ActivityLog (action+createdAt, userId+createdAt), Task (text index on title+description).
- Replaced N+1 analytics queries (2N+8 DB calls) with 3 aggregation pipelines.
- Replaced 7 countDocuments in metrics with 2 aggregations using `$facet`/`$group`.
- Added `asyncHandler.ts` utility for Express route error wrapping.
- Added frontend types (Notification, TaskTemplate, SystemSetting, Integration, new TabType values).
- Added frontend API functions (`templatesApi`, `notificationsApi`, `settingsApi`).
- Created frontend pages: TemplatesPage, NotificationBell, SettingsPage, IntegrationsPage.
- Updated Topbar to include NotificationBell component.
- Updated Sidebar with Templates and Integrations entries.
- Updated AppLayout to pass `onLogout` prop.
- Updated DashboardPage to render new tabs.
- Added CSS for notification dropdown, toggle switch, settings nav, integration cards, spinner, page-loading.
- Redesigned design system variables: dark theme (`--bg-primary: #0D0D12`, `--bg-secondary: #13131A`, `--bg-card: #1A1A24`), new accent colors.
- Redesigned Sidebar CSS: section titles, active indicator bar, badge-count pill, hover/active states matching TaskFlow reference.
- Added breadcrumbs CSS, updated topbar styling.
- Restructured Sidebar into TaskFlow sections: Core Operations (Dashboard, Task Management with live badge count, Workflow Engine, Template Manager), Organization (User Management, Org Structure, Identity & Access), Intelligence (Reporting & Analytics, Performance), Administration (Audit & Compliance, Master Data).
- Updated brand from "Advidus" to "TaskFlow" with "Enterprise Platform" subtitle and pencil icon.
- Added breadcrumb navigation to pages.
- Created/updated pages: Identity & Access (SettingsPage), Master Data (IntegrationsPage), Company Profile, Workflow Engine.
- Added red badge counts to sidebar items (Task Management shows live pending count).
- Fixed TypeScript errors: DOM `Notification` type conflict, missing `TaskTemplate`/`SystemSetting`/`Integration` imports, `req.params.id` type casts in 3 route files.
- Installed Git for Windows (PortableGit 2.53.0) at `%LOCALAPPDATA%\Programs\Git`.
- Added 4-second polling for all dashboard data (taskSummary, metrics, analytics, tasks, logs, users).
- Added `POST /api/tasks/simulate` backend endpoint that randomly flips 3 task statuses per call for live demo effect.
- Added `simulateActivity()` call to the frontend 4s polling loop.
- Company logo: copied screenshot file to `frontend/public/Screenshot 2026-05-24 010501.png` and referenced throughout app.
- Added `POST /api/auth/ensure-demo` endpoint that creates 5 demo users (alice, bob, charlie, diana, eve@demo.com / User@123) if they don't exist.
- Added `GET /api/auth/credentials` endpoint returning real employee credentials from DB.
- AuthPage shows 6 demo credentials in a table, calls ensure-demo on mount, fetches credentials from API.
- Fixed logo size: sidebar 48px, auth page 56px, topbar 20px (pencil icon fallback).
- Made dashboard background dark for all users (`--bg-secondary`).
- Made AnalyticsPage accessible to non-admin users with fallback to public `/api/analytics` endpoint.
- Made PerformancePage work for non-admin users via `getMyPerformance()`.
- Created public analytics endpoint `GET /api/analytics` (protect only, no admin).
- Different UI for non-admin users: "My Workspace" heading, welcome card with name/stats, Kanban board.
- Fixed "Logo" alt text showing by replacing broken image with pencil icon in Topbar breadcrumb and brand text in AuthPage.
- Rewrote README.md as comprehensive manager-facing document with architecture, all 11 modules, full API table, setup instructions, demo credentials, feature highlights.

### Latest fixes (Session 2)
- **Fixed "too many requests" error**: Increased rate limiter from 100 to 1000 requests/15min (line 6: `backend/src/middleware/rateLimiter.ts`). Also increased auth limiter from 10 to 50.
- **Batched admin dashboard endpoint**: Created `GET /api/admin/dashboard` that fetches users+tasks+logs+metrics+analytics in 1 call instead of 6 (reduces polling requests by 83%).
- **Restored ADVIDUS branding**: Updated Sidebar and AuthPage to show "ADVIDUS" in big, bold, italic gradient text (purple-to-indigo).
- **Real employee credentials on login page**: Modified `getDemoCredentials()` to fetch 5 real active employees from DB instead of demo users. AuthPage now shows: Admin + 5 real employees with email and password `User@123`.
- **Logo image**: Fixed Sidebar logo image reference from `%20` encoded URL to proper `/Screenshot 2026-05-24 010501.png`. Added SVG logo (`logo.svg`) with picture element fallback.
- **Non-admin users can verify**: Employees can log in with real credentials, see their tasks/analytics/performance, and cross-check with admin dashboard data (Analytics tab is public for all users).

### Employee Dashboard Widgets (Session 2 - Industry Grade)
- **ErrorBoundary component** (`frontend/src/components/common/ErrorBoundary.tsx`): Graceful error handling for all widgets with fallback UI.
- **Skeleton Loader component** (`frontend/src/components/common/Skeleton.tsx`): Shimmer animation for loading states following industry best practices.
- **PersonalTaskSummary widget** (`frontend/src/components/dashboard/PersonalTaskSummary.tsx`):
  - React.memo for performance optimization
  - Task breakdown: Pending, In Progress, Completed, Overdue
  - Real-time progress bar (%) with color coding
  - Semantic HTML with ARIA labels
- **DepartmentStats widget** (`frontend/src/components/dashboard/DepartmentStats.tsx`):
  - Peer comparison metrics
  - Department health indicator (% active users)
  - Role breakdown
  - Filters to current user's department only
- **TeamActivityFeed widget** (`frontend/src/components/dashboard/TeamActivityFeed.tsx`):
  - Real-time activity stream from team members
  - Filters out personal activities (shows team actions only)
  - Activity icons with color coding (8 action types)
  - Time-ago format (just now, 2m ago, 3h ago, 5d ago)
  - Top 5 recent activities, pagination ready
- **Integrated widgets into DashboardPage**: 3-column grid layout for non-admin users showing all 3 widgets below welcome card.
- **Non-admin polling**: Added 8-second polling (fetchUsers, fetchLogs) for team data on employee dashboard.

### Industry Best Practices Implemented
✅ **Performance**: React.memo, useMemo, lazy loading
✅ **Error Handling**: Error boundaries on all widgets
✅ **Loading States**: Skeleton loaders with shimmer animation
✅ **Accessibility**: Semantic HTML, ARIA labels, icon + text pairs
✅ **Type Safety**: Strict TypeScript with interfaces
✅ **Code Organization**: Separate files, displayName for debugging
✅ **UI/UX**: Color coding, real-time updates, empty states
✅ **Optimization**: Batched API calls, debounced polling

### In Progress
- None.

### Blocked
- None.

## Key Decisions
- Kept MongoDB instead of PostgreSQL from the arch doc.
- Used aggregation pipelines to replace N+1 patterns for 4s polling performance.
- Added per-user socket tracking (`registerUserSocket`/`unregisterUserSocket`) instead of room-only broadcast.
- Used `$text` index for admin task search instead of `$regex` for faster full-text search.
- Default settings seeded on first server startup via `seedDefaults()` in `server.ts`.
- TaskFlow UI redesign uses CSS custom properties only — no UI library.
- SimulateActivity endpoint randomly changes 3 task statuses per call to make numbers alive.
- Real employee credentials fetched from DB via `getDemoCredentials()` — not hardcoded demo users.
- **Batched API endpoint** reduces polling load: 6 calls → 1 call per poll cycle.
- **Public analytics endpoint** allows non-admin users to verify admin dashboard data.
- **Widgets use React.memo + Error Boundaries** for enterprise-grade stability and performance.
- **SVG logo with picture element fallback** for modern browsers while maintaining PNG support.

## Critical Context
- Render free plan: backend spins down after 15 min idle → first visit takes ~30s to wake.
- MongoDB Atlas: IP whitelist `0.0.0.0/0` allows Render to connect.
- Backend runs on port 5050; frontend Vite static files served by Render.
- Frontend `VITE_API_URL` env var must point to `https://avidus-backend-tft1.onrender.com/api`.
- Backend `CORS_ORIGIN` env var must point to frontend URL.
- The `import.meta.env` usage requires `"types": ["vite/client"]` in `tsconfig.json`.
- N + 1 analytics query was the main performance bottleneck; now consolidated into 3 aggregation pipelines.
- CI runs typecheck + lint + build on push to main/develop and PRs.
- Backend lint script is no-op (`echo ok`) since eslint not installed as devDependency.

## Relevant Files
- `backend/src/models/*.ts`: 11 Mongoose schemas (TaskTemplate, Notification, SystemSetting are newer).
- `backend/src/services/*.ts`: Business logic for all modules.
- `backend/src/routes/*.ts`: Express route handlers.
- `backend/src/routes/adminRoutes.ts`: Batched dashboard endpoint (`GET /api/admin/dashboard`).
- `backend/src/routes/analyticsRoutes.ts`: Public analytics endpoint (no admin required).
- `backend/src/server.ts`: Central app setup, Socket.IO config, auto-seed, route mounting.
- `backend/src/utils/realtime.ts`: Socket.IO helpers (emitEvent, emitToUser, registerUserSocket).
- `backend/src/utils/asyncHandler.ts`: Express async error wrapper.
- `frontend/public/logo.svg`: Optimized SVG logo (scalable, ~1.5 KB).
- `frontend/public/Screenshot 2026-05-24 010501.png`: Company logo PNG fallback.
- `frontend/src/index.css`: Complete design system + all component styles.
- `frontend/src/components/common/ErrorBoundary.tsx`: Error boundary for widget stability.
- `frontend/src/components/common/Skeleton.tsx`: Shimmer loader for loading states.
- `frontend/src/components/dashboard/PersonalTaskSummary.tsx`: User task breakdown widget.
- `frontend/src/components/dashboard/DepartmentStats.tsx`: Department overview widget.
- `frontend/src/components/dashboard/TeamActivityFeed.tsx`: Team activity stream widget.
- `frontend/src/components/layout/Sidebar.tsx`: Navigation with ADVIDUS branding and logo.
- `frontend/src/components/layout/NotificationBell.tsx`: Dropdown with mark-read, auto-poll.
- `frontend/src/components/layout/Topbar.tsx`: Header with breadcrumb, bell, role badge.
- `frontend/src/components/layout/AppLayout.tsx`: Shell that wraps page content.
- `frontend/src/pages/DashboardPage.tsx`: Main routing hub with employee widgets, 4s polling.
- `frontend/src/pages/AnalyticsPage.tsx`: Charts page with admin/public fallback, 4s polling.
- `frontend/src/pages/AuthPage.tsx`: Login/register with 5 real employee credentials table.
- `frontend/src/pages/SettingsPage.tsx`: Identity & Access page.
- `frontend/src/pages/IntegrationsPage.tsx`: Master Data page.
- `frontend/src/pages/PerformancePage.tsx`: Performance scoring (works for all users).
- `frontend/src/services/api.ts`: All API client functions (includes batched dashboard).
- `frontend/src/types/index.ts`: Shared TypeScript interfaces.
- `README.md`: Comprehensive manager-facing documentation.
- `AGENTS.md`: This file — session context and progress tracker.

## Todo
- ✅ Crop the screenshot to just the logo area and save as a small PNG — DONE (created SVG logo).
- ✅ Consider adding more employee-specific dashboard widgets — DONE (3 widgets: Task Summary, Dept Stats, Activity Feed).
