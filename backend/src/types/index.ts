import { Request } from 'express';
import { Types } from 'mongoose';

export type UserRole = 'admin' | 'user';
export type UserStatus = 'active' | 'inactive';
export type TaskStatus = 'pending' | 'in_progress' | 'completed';
export type AssigneeType = 'human' | 'agent';

export type ActivityAction =
  | 'LOGIN'
  | 'REGISTER'
  | 'TASK_CREATED'
  | 'TASK_UPDATED'
  | 'TASK_DELETED'
  | 'USER_STATUS_UPDATED'
  | 'USER_DELETED'
  | 'AGENT_CREATED'
  | 'AGENT_DELETED'
  | 'AGENT_STATUS_UPDATED'
  | 'APPROVAL_CHAIN_CREATED'
  | 'APPROVAL_GRANTED'
  | 'APPROVAL_REJECTED'
  | 'COMMENT_CREATED'
  | 'PERFORMANCE_SNAPSHOT';

export type Permission =
  | 'tasks:read'
  | 'tasks:write'
  | 'tasks:delete'
  | 'users:read'
  | 'users:write'
  | 'logs:read'
  | 'analytics:read'
  | 'agents:read'
  | 'agents:write';

export interface IExecutionLog {
  timestamp: Date;
  step: string;
  description: string;
  status: 'info' | 'success' | 'warning' | 'error';
}

export interface TaskCounts {
  pending: number;
  in_progress: number;
  completed: number;
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
  status?: string;
  q?: string;
  role?: string;
  action?: string;
  top?: string;
}

// What `protect` attaches to req.user (lean, password-free). Routes only need id + role.
export interface AuthUser {
  _id: Types.ObjectId;
  role: UserRole;
  status: UserStatus;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}
