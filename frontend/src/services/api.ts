import type {
  User, ApiResponse, Task, TaskSummary, Agent, Analytics, Metrics, ActivityLog,
  Department, Designation, TaskComment, Approval, PerformanceScore, ExtendedAnalytics,
  TaskTemplate, SystemSetting, Integration,
} from '../types';
import type { Notification as NotifType } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5050/api';

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data;
}

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    request<ApiResponse<{ _id: string; name: string; email: string; role: string; status: string; token: string; lastLogin?: string }>>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (name: string, email: string, password: string) =>
    request<ApiResponse<{ _id: string; name: string; email: string; role: string; status: string; token: string }>>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),

  getMe: () => request<ApiResponse<User>>('/auth/me'),
};

// Tasks
export const tasksApi = {
  getAll: () => request<ApiResponse<Task[]>>('/tasks'),

  getSummary: () => request<ApiResponse<TaskSummary>>('/tasks/summary'),

  create: (title: string, description?: string, assignedTo?: Record<string, unknown>) =>
    request<ApiResponse<Task>>('/tasks', {
      method: 'POST',
      body: JSON.stringify({ title, description, assignedTo }),
    }),

  update: (id: string, data: Partial<Task>) =>
    request<ApiResponse<Task>>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<ApiResponse<null>>(`/tasks/${id}`, {
      method: 'DELETE',
    }),
};

// Admin
export const adminApi = {
  // Batched dashboard endpoint - single call gets all admin data
  getDashboard: () => request<ApiResponse<{ users: User[]; tasks: Task[]; logs: ActivityLog[]; metrics: Metrics; analytics: Analytics }>>('/admin/dashboard'),

  getUsers: () => request<ApiResponse<User[]>>('/admin/users'),

  toggleUserStatus: (id: string) =>
    request<ApiResponse<User>>(`/admin/users/${id}/status`, { method: 'PATCH' }),

  deleteUser: (id: string) =>
    request<ApiResponse<null>>(`/admin/users/${id}`, { method: 'DELETE' }),

  getTasks: (params?: Record<string, string>) => {
    const search = params ? `?${new URLSearchParams(params)}` : '';
    return request<ApiResponse<Task[]>>(`/admin/tasks${search}`);
  },

  getLogs: (params?: Record<string, string>) => {
    const search = params ? `?${new URLSearchParams(params)}` : '';
    return request<ApiResponse<ActivityLog[]>>(`/admin/logs${search}`);
  },

  getMetrics: () => request<ApiResponse<Metrics>>('/admin/metrics'),

  getAnalytics: () => request<ApiResponse<Analytics>>('/admin/analytics'),
};

// Agents
export const agentsApi = {
  getAll: () => request<ApiResponse<Agent[]>>('/agents'),

  create: (data: { name: string; role: string; systemPrompt: string; modelName?: string }) =>
    request<ApiResponse<Agent>>('/agents', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  toggleStatus: (id: string) =>
    request<ApiResponse<Agent>>(`/agents/${id}/status`, { method: 'PATCH' }),

  delete: (id: string) =>
    request<ApiResponse<null>>(`/agents/${id}`, { method: 'DELETE' }),
};

// Organization
export const orgApi = {
  getDepartments: () => request<ApiResponse<Department[]>>('/org/departments'),
  getDepartmentTree: () => request<ApiResponse<Department[]>>('/org/departments/tree'),
  createDepartment: (data: { name: string; description?: string; parentId?: string; head?: string }) =>
    request<ApiResponse<Department>>('/org/departments', { method: 'POST', body: JSON.stringify(data) }),
  updateDepartment: (id: string, data: Partial<Department>) =>
    request<ApiResponse<Department>>(`/org/departments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteDepartment: (id: string) =>
    request<ApiResponse<null>>(`/org/departments/${id}`, { method: 'DELETE' }),
  getDesignations: (department?: string) =>
    request<ApiResponse<Designation[]>>(`/org/designations${department ? `?department=${department}` : ''}`),
  createDesignation: (data: { title: string; level: number; department?: string; description?: string }) =>
    request<ApiResponse<Designation>>('/org/designations', { method: 'POST', body: JSON.stringify(data) }),
  updateDesignation: (id: string, data: Partial<Designation>) =>
    request<ApiResponse<Designation>>(`/org/designations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteDesignation: (id: string) =>
    request<ApiResponse<null>>(`/org/designations/${id}`, { method: 'DELETE' }),
  getOrgChart: () => request<ApiResponse<{ departments: Department[]; users: User[] }>>('/org/chart'),
};

// Comments
export const commentApi = {
  getByTask: (taskId: string) => request<ApiResponse<TaskComment[]>>(`/tasks/${taskId}/comments`),
  create: (taskId: string, content: string) =>
    request<ApiResponse<TaskComment>>(`/tasks/${taskId}/comments`, { method: 'POST', body: JSON.stringify({ content }) }),
  delete: (taskId: string, commentId: string) =>
    request<ApiResponse<null>>(`/tasks/${taskId}/comments/${commentId}`, { method: 'DELETE' }),
};

// Approvals
export const approvalApi = {
  getMyApprovals: () => request<ApiResponse<Approval[]>>('/approvals/my'),
  getTaskApprovals: (taskId: string) => request<ApiResponse<Approval[]>>(`/approvals/task/${taskId}`),
  createChain: (taskId: string, approvers: Array<{ approver: string; level: number }>) =>
    request<ApiResponse<Approval[]>>(`/approvals/task/${taskId}`, { method: 'POST', body: JSON.stringify({ approvers }) }),
  decide: (approvalId: string, decision: 'approved' | 'rejected', comment?: string) =>
    request<ApiResponse<Approval>>(`/approvals/${approvalId}/decide`, { method: 'POST', body: JSON.stringify({ decision, comment }) }),
};

// Performance
export const performanceApi = {
  getMyPerformance: () => request<ApiResponse<PerformanceScore>>('/performance/me'),
  getUserPerformance: (userId: string) => request<ApiResponse<PerformanceScore>>(`/performance/user/${userId}`),
  getAllPerformance: () => request<ApiResponse<PerformanceScore[]>>('/performance/all'),
  takeSnapshot: () => request<ApiResponse<{ message: string }>>('/performance/snapshot', { method: 'POST' }),
};

export const templatesApi = {
  getAll: (activeOnly = false) =>
    request<ApiResponse<TaskTemplate[]>>(`/templates${activeOnly ? '?active=true' : ''}`),
  get: (id: string) => request<ApiResponse<TaskTemplate>>(`/templates/${id}`),
  create: (data: Partial<TaskTemplate>) =>
    request<ApiResponse<TaskTemplate>>('/templates', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<TaskTemplate>) =>
    request<ApiResponse<TaskTemplate>>(`/templates/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) =>
    request<ApiResponse<null>>(`/templates/${id}`, { method: 'DELETE' }),
  generate: (templateId: string, assigneeId: string) =>
    request<ApiResponse<Task>>(`/templates/${templateId}/generate`, { method: 'POST', body: JSON.stringify({ assigneeId }) }),
};

export const notificationsApi = {
  getAll: () => request<ApiResponse<NotifType[]> & { unreadCount: number }>('/notifications'),
  getUnreadCount: () => request<ApiResponse<{ count: number }>>('/notifications/unread-count'),
  markAsRead: (id: string) =>
    request<ApiResponse<NotifType>>(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllAsRead: () =>
    request<ApiResponse<{ message: string }>>('/notifications/read-all', { method: 'POST' }),
};

export const settingsApi = {
  getAll: (group?: string) =>
    request<ApiResponse<SystemSetting[]>>(`/settings${group ? `?group=${group}` : ''}`),
  update: (key: string, value: string) =>
    request<ApiResponse<SystemSetting>>(`/settings/${key}`, { method: 'PUT', body: JSON.stringify({ value }) }),
  getIntegrations: () =>
    request<ApiResponse<Integration[]>>('/settings/integrations'),
};
