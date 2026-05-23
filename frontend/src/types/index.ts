export type UserRole = 'admin' | 'user';
export type UserStatus = 'active' | 'inactive';
export type TaskStatus = 'pending' | 'in_progress' | 'completed';
export type AssigneeType = 'human' | 'agent';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  lastLogin?: string;
  token?: string;
}

export interface Agent {
  _id: string;
  name: string;
  role: string;
  systemPrompt: string;
  modelName: string;
  status: 'active' | 'inactive';
  creator?: Pick<User, '_id' | 'name' | 'email'>;
  createdAt: string;
}

export interface ExecutionLog {
  timestamp: string;
  step: string;
  description: string;
  status: 'info' | 'success' | 'warning' | 'error';
}

export interface AssignedTo {
  assigneeType: AssigneeType;
  user?: string | Pick<User, '_id' | 'name' | 'email'>;
  agent?: string | Pick<Agent, '_id' | 'name' | 'role' | 'modelName' | 'status'>;
}

export interface Task {
  _id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  owner: string | Pick<User, '_id' | 'name' | 'email' | 'role'>;
  assignedTo?: AssignedTo;
  executionLogs: ExecutionLog[];
  result?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  _id: string;
  userId: Pick<User, '_id' | 'name' | 'email' | 'role'>;
  action: string;
  details: string;
  createdAt: string;
}

export interface Metrics {
  counts: {
    tasks: { pending: number; in_progress: number; completed: number };
    users: { total: number; active: number; inactive: number };
    agents: { total: number; active: number; inactive: number };
  };
  serverTime: string;
}

export interface Analytics {
  users: { total: number; active: number; inactive: number };
  tasks: {
    total: number;
    completed: number;
    pending: number;
    inProgress: number;
    completionRate: number;
  };
  userTaskStats: Array<{
    _id: string;
    name: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    totalTasks: number;
    completedTasks: number;
  }>;
}

export interface TaskSummary {
  counts: { pending: number; in_progress: number; completed: number };
  total: number;
  serverTime: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  items?: T[];
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  serverTime: string;
}

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

export interface Department {
  _id: string;
  name: string;
  description?: string;
  parentId?: string;
  head?: Pick<User, '_id' | 'name' | 'email'>;
  organization: string;
  isActive: boolean;
  children?: Department[];
}

export interface Designation {
  _id: string;
  title: string;
  level: number;
  department?: Pick<Department, '_id' | 'name'>;
  description?: string;
  isActive: boolean;
}

export interface TaskComment {
  _id: string;
  task: string;
  author: Pick<User, '_id' | 'name' | 'email'>;
  content: string;
  attachments?: string[];
  createdAt: string;
}

export interface Approval {
  _id: string;
  task: Pick<Task, '_id' | 'title' | 'description' | 'status'>;
  level: number;
  approver: Pick<User, '_id' | 'name' | 'email'>;
  status: 'pending' | 'approved' | 'rejected';
  comment?: string;
  decidedAt?: string;
  createdAt: string;
}

export interface PerformanceScore {
  _id: string;
  user: Pick<User, '_id' | 'name' | 'email' | 'role'>;
  performance: {
    score: number;
    tasksCompleted: number;
    tasksAssigned: number;
    onTimeCompletion: number;
    overdueTasks: number;
    avgCompletionHours: number;
  };
}

export type ExtendedAnalytics = Analytics & {
  trends?: {
    date: string;
    completed: number;
    created: number;
  }[];
  departmentStats?: {
    name: string;
    totalTasks: number;
    completedTasks: number;
  }[];
};

export type TabType = 'dashboard' | 'users' | 'tasks' | 'activity' | 'org' | 'approvals' | 'performance' | 'analytics' | 'settings';
