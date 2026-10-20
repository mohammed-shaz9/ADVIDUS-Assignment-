import { Model } from 'mongoose';
import User from '../models/User.js';
import Task from '../models/Task.js';
import ActivityLog from '../models/ActivityLog.js';
import Agent from '../models/Agent.js';
import Notification from '../models/Notification.js';
import { logActivity } from '../utils/activityLogger.js';
import { emitEvent } from '../utils/realtime.js';
import { invalidateUser } from '../utils/userCache.js';
import { memo } from '../utils/memo.js';
import { parsePage, pageResult, escapeRegex, str, oneOf } from '../utils/paginate.js';
import { NotFoundError, ValidationError } from '../errors/AppError.js';
import { TaskCounts, PaginationQuery, UserRole } from '../types/index.js';

const TASK_STATUSES = ['pending', 'in_progress', 'completed'] as const;
const ROLES = ['admin', 'user'] as const;
const USER_STATUSES = ['active', 'inactive'] as const;

// Admins get full user rows; everyone else gets a name-only directory of active users (assignee picker),
// searchable by name only (an email prefix search would leak the address list).
export const getUsers = async (query: PaginationQuery, viewerRole: UserRole = 'admin') => {
  const { page, limit, skip } = parsePage(query, 50);
  const isAdmin = viewerRole === 'admin';
  const filter: Record<string, unknown> = isAdmin ? {} : { status: 'active' };

  if (isAdmin) {
    const role = oneOf(query.role, ROLES);
    const status = oneOf(query.status, USER_STATUSES);
    if (role) filter.role = role;
    if (status) filter.status = status;
  }

  const q = str(query.q);
  if (q) {
    const name = { name: new RegExp(`^${escapeRegex(q)}`, 'i') };
    filter.$or = isAdmin ? [name, { email: new RegExp(`^${escapeRegex(q.toLowerCase())}`) }] : [name];
  }

  const [items, total] = await Promise.all([
    User.find(filter, isAdmin ? '-password' : 'name designation')
      .sort(isAdmin ? { role: 1, name: 1 } : { name: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  return pageResult(items, total, page, limit);
};

export const toggleUserStatus = async (targetUserId: string, requestingUserId: string) => {
  if (targetUserId === requestingUserId) {
    throw new ValidationError('You cannot deactivate your own account');
  }

  const user = await User.findById(targetUserId);
  if (!user) {
    throw new NotFoundError('User');
  }

  const newStatus = user.status === 'active' ? 'inactive' : 'active';
  user.status = newStatus;
  await user.save();
  invalidateUser(targetUserId);

  await logActivity(
    requestingUserId,
    'USER_STATUS_UPDATED',
    `Toggled status of user "${user.name}" (${user.email}) to ${newStatus}`
  );

  emitEvent('user.status_changed', { userId: user._id.toString(), status: user.status }, [targetUserId]);

  return user;
};

export const deleteUser = async (targetUserId: string, requestingUserId: string) => {
  if (targetUserId === requestingUserId) {
    throw new ValidationError('You cannot delete your own account');
  }

  const user = await User.findById(targetUserId);
  if (!user) {
    throw new NotFoundError('User');
  }

  // Owned tasks go with the user; tasks other people assigned to this user just lose the assignee.
  const [deletedTasks] = await Promise.all([
    Task.deleteMany({ owner: user._id }),
    Task.updateMany({ 'assignedTo.user': user._id }, { $unset: { 'assignedTo.user': 1 } }),
    Notification.deleteMany({ userId: user._id }),
  ]);
  await User.findByIdAndDelete(targetUserId);
  invalidateUser(targetUserId);

  await logActivity(
    requestingUserId,
    'USER_DELETED',
    `Deleted user "${user.name}" (${user.email}) and their ${deletedTasks.deletedCount} tasks`
  );

  emitEvent('user.status_changed', { userId: targetUserId, status: 'deleted' }, [targetUserId]);

  return { message: `User and their ${deletedTasks.deletedCount} tasks deleted successfully` };
};

export const getAdminTasks = async (query: PaginationQuery) => {
  const { page, limit, skip } = parsePage(query, 25, 200);

  const filter: Record<string, unknown> = {};
  const status = oneOf(query.status, TASK_STATUSES);
  if (status) filter.status = status;
  const q = str(query.q);
  if (q) filter.$text = { $search: q };

  const [items, total] = await Promise.all([
    Task.find(filter)
      .populate('owner', 'name email role')
      .populate('assignedTo.user', 'name email')
      .populate('assignedTo.agent', 'name role modelName status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Task.countDocuments(filter),
  ]);

  return pageResult(items, total, page, limit);
};

// Admins see every log; anyone else only their own (this endpoint is reachable by non-admins).
export const getActivityLogs = async (query: PaginationQuery, viewer?: { id: string; role: UserRole }) => {
  const { page, limit, skip } = parsePage(query, 50);

  const filter: Record<string, unknown> = {};
  if (viewer && viewer.role !== 'admin') filter.userId = viewer.id;
  const action = str(query.action);
  if (action) filter.action = action;

  const [items, total] = await Promise.all([
    ActivityLog.find(filter)
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    ActivityLog.countDocuments(filter),
  ]);

  return pageResult(items, total, page, limit);
};

// { <status>: n } for a collection — one indexed scan; callers memoize it.
const countBy = async (model: Model<any>) => {
  const rows = await model.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
  const out: Record<string, number> = {};
  for (const r of rows) if (r?._id) out[r._id] = r.count;
  return out;
};

const taskCounts = memo(5000, async (): Promise<TaskCounts> => {
  const c = await countBy(Task);
  return { pending: c.pending ?? 0, in_progress: c.in_progress ?? 0, completed: c.completed ?? 0 };
});

const activeCounts = (c: Record<string, number>) => ({
  total: (c.active ?? 0) + (c.inactive ?? 0),
  active: c.active ?? 0,
  inactive: c.inactive ?? 0,
});

const userCounts = memo(5000, async () => activeCounts(await countBy(User)));
const agentCounts = memo(5000, async () => activeCounts(await countBy(Agent)));

export const getMetrics = async () => {
  const [tasks, users, agents] = await Promise.all([taskCounts(), userCounts(), agentCounts()]);
  return { counts: { tasks, users, agents }, serverTime: new Date().toISOString() };
};

// Top-N owners only: $limit runs before $lookup, so the join touches N users, not all of them.
const topOwners = memo(5000, async (top: number) =>
  Task.aggregate([
    {
      $group: {
        _id: '$owner',
        totalTasks: { $sum: 1 },
        completedTasks: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
      },
    },
    { $sort: { totalTasks: -1, _id: 1 } },
    { $limit: top },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
    { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 1,
        name: { $ifNull: ['$user.name', 'Deleted User'] },
        email: { $ifNull: ['$user.email', ''] },
        role: { $ifNull: ['$user.role', 'user'] },
        status: { $ifNull: ['$user.status', 'inactive'] },
        totalTasks: 1,
        completedTasks: 1,
      },
    },
  ])
);

export const getAnalytics = async (query: PaginationQuery = {}) => {
  const top = Math.min(Math.max(parseInt(String(query.top), 10) || 20, 1), 100);
  const [t, users, userTaskStats] = await Promise.all([taskCounts(), userCounts(), topOwners(top)]);
  const total = t.pending + t.in_progress + t.completed;

  return {
    users,
    tasks: {
      total,
      completed: t.completed,
      pending: t.pending,
      inProgress: t.in_progress,
      completionRate: total > 0 ? Math.round((t.completed / total) * 100) : 0,
    },
    userTaskStats,
  };
};

export const getPublicAnalytics = async () => {
  const t = await taskCounts();
  const total = t.pending + t.in_progress + t.completed;
  return {
    tasks: {
      total,
      pending: t.pending,
      inProgress: t.in_progress,
      completed: t.completed,
      completionRate: total > 0 ? Math.round((t.completed / total) * 100) : 0,
    },
    serverTime: new Date().toISOString(),
  };
};
