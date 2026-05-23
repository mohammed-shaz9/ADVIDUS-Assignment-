# Role-Based Access & Activity Tracking
**Feature Branch:** `feature/role-based-access-activity-tracking`
**Stack:** Node.js · MongoDB · React.js

---

## Objective
Enhance the existing application with role-based access control (RBAC) and a comprehensive user activity tracking system.

---

## Git Workflow

| Step | Action |
|------|--------|
| 1 | Create a new branch: `git checkout -b feature/role-based-access-activity-tracking` |
| 2 | Commit all changes to this branch |
| 3 | Push and raise a Pull Request |
| 4 | Resolve all code review comments before merging |

---

## Backend Tasks (Node.js + MongoDB)

### 1. User Roles
- Add a `role` field to the User schema with enum values: `Admin`, `User`
- Default role: `User`

```js
// User Schema (addition)
role: {
  type: String,
  enum: ['Admin', 'User'],
  default: 'User',
}
```

---

### 2. Authorization Middleware

Create two middleware functions:

**`isAuthenticated`** – Validates JWT token; protects all private routes.

**`isAdmin`** – Checks if the authenticated user has the `Admin` role; restricts admin-only routes.

```
middlewares/
  ├── isAuthenticated.js
  └── isAdmin.js
```

---

### 3. Admin APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/users` | View all users |
| DELETE | `/api/admin/users/:id` | Delete a user |
| PATCH | `/api/admin/users/:id/status` | Update user status (Active/Inactive) |
| GET | `/api/admin/tasks` | View all tasks created by all users |
| DELETE | `/api/admin/tasks/:id` | Delete any task |

> All admin routes must be protected with `isAuthenticated` + `isAdmin` middleware.

---

### 4. User APIs (Permission-Scoped)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tasks` | Create own task |
| GET | `/api/tasks` | View own tasks only |
| PATCH | `/api/tasks/:id` | Update own task |
| DELETE | `/api/tasks/:id` | Delete own task |

> User routes must validate that the task belongs to the requesting user before any mutation.

---

### 5. Activity Log System

Track and store the following events in a dedicated `ActivityLog` collection:

| Event | Trigger |
|-------|---------|
| `LOGIN` | Successful user login |
| `TASK_CREATED` | New task created |
| `TASK_UPDATED` | Task updated |
| `TASK_DELETED` | Task deleted |

```js
// ActivityLog Schema
{
  userId:    ObjectId (ref: User),
  action:    String,  // 'LOGIN' | 'TASK_CREATED' | 'TASK_UPDATED' | 'TASK_DELETED'
  details:   String,  // Optional context (e.g., task title)
  timestamp: Date,    // Default: Date.now
}
```

---

### Folder Structure (Backend)

```
backend/
├── controllers/
│   ├── authController.js
│   ├── taskController.js
│   ├── adminController.js
│   └── activityController.js
├── middlewares/
│   ├── isAuthenticated.js
│   └── isAdmin.js
├── models/
│   ├── User.js
│   ├── Task.js
│   └── ActivityLog.js
├── routes/
│   ├── authRoutes.js
│   ├── taskRoutes.js
│   └── adminRoutes.js
└── server.js
```

---

## Frontend Tasks (React.js)

### 1. Role-Based UI
- Show **Admin Menu** (User Management, Task Monitoring, Logs) only when `role === 'Admin'`
- Redirect unauthorized users attempting to access admin pages to `/unauthorized` or `/dashboard`
- Use a `PrivateRoute` / `AdminRoute` wrapper component for route-level protection

---

### 2. Admin Dashboard Pages

| Page | Path | Features |
|------|------|----------|
| User Management | `/admin/users` | List users, update status (Active/Inactive), delete user |
| Task Monitoring | `/admin/tasks` | View all tasks across all users, delete any task |
| Activity Logs | `/admin/logs` | View login events, task activity with timestamps |

---

### 3. Analytics Section

Display the following stats on the Admin Dashboard home:

- **Total Users**
- **Total Tasks**
- **Completed Tasks**
- **Pending Tasks**

> Use card components with counts fetched from dedicated summary API endpoints.

---

### Folder Structure (Frontend)

```
frontend/src/
├── components/
│   ├── Navbar.jsx
│   ├── PrivateRoute.jsx
│   ├── AdminRoute.jsx
│   └── StatCard.jsx
├── pages/
│   ├── Login.jsx
│   ├── Dashboard.jsx
│   ├── admin/
│   │   ├── AdminDashboard.jsx
│   │   ├── UserManagement.jsx
│   │   ├── TaskMonitoring.jsx
│   │   └── ActivityLogs.jsx
├── context/
│   └── AuthContext.jsx
├── services/
│   └── api.js
└── App.jsx
```

---

## Permissions Summary

| Action | Admin | User |
|--------|-------|------|
| View all users | ✅ | ❌ |
| Delete any user | ✅ | ❌ |
| Update user status | ✅ | ❌ |
| View all tasks | ✅ | ❌ |
| Delete any task | ✅ | ❌ |
| View activity logs | ✅ | ❌ |
| Create own tasks | ✅ | ✅ |
| View own tasks | ✅ | ✅ |
| Update own tasks | ✅ | ✅ |
| Delete own tasks | ✅ | ✅ |

---

## Expected Deliverables

- [ ] Working role-based authentication (JWT + role checks)
- [ ] Admin dashboard with User Management, Task Monitoring, and Activity Logs
- [ ] Activity log collection populated on each tracked event
- [ ] Role-based UI rendering (admin menu hidden from regular users)
- [ ] Analytics section with live stats
- [ ] Clean, responsive UI
- [ ] Proper API integration (axios/fetch with auth headers)
- [ ] Feature branch created, changes committed, PR raised
- [ ] All code review comments resolved before merge

---

## Additional Notes
- Follow reusable component architecture in React
- Use environment variables for JWT secret and MongoDB URI
- Ensure all API responses follow a consistent format: `{ success, message, data }`
- Handle loading and error states in all frontend pages
