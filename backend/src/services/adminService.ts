import User from '../models/User.js';
import Task from '../models/Task.js';
import ActivityLog from '../models/ActivityLog.js';
import Agent from '../models/Agent.js';
import { logActivity } from '../utils/activityLogger.js';
import { emitEvent } from '../utils/realtime.js';
import { NotFoundError, ValidationError } from '../errors/AppError.js';
import { TaskCounts, PaginationQuery } from '../types/index.js';

export const getUsers = async () => {
  return User.find({}).sort({ role: 1, name: 1 });
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

  await logActivity(
    requestingUserId,
    'USER_STATUS_UPDATED',
    `Toggled status of user "${user.name}" (${user.email}) to ${newStatus}`
  );

  emitEvent('user.status_changed', {
    userId: user._id.toString(),
    status: user.status,
  });

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

  const deletedTasks = await Task.deleteMany({ owner: user._id });
  await User.findByIdAndDelete(targetUserId);

  await logActivity(
    requestingUserId,
    'USER_DELETED',
    `Deleted user "${user.name}" (${user.email}) and their ${deletedTasks.deletedCount} tasks`
  );

  return { message: `User and their ${deletedTasks.deletedCount} tasks deleted successfully` };
};

export const getAdminTasks = async (query: PaginationQuery) => {
  const page = Math.max(parseInt(query.page || '1', 10), 1);
  const limit = Math.min(Math.max(parseInt(query.limit || '25', 10), 1), 200);
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};
  if (query.status) filter.status = query.status;
  if (query.q) {
    const q = String(query.q).trim();
    if (q) {
      filter.$text = { $search: q };
    }
  }

  const [items, total] = await Promise.all([
    Task.find(filter)
      .populate('owner', 'name email role')
      .populate('assignedTo.user', 'name email')
      .populate('assignedTo.agent', 'name role modelName status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Task.countDocuments(filter),
  ]);

  return {
    items,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
    serverTime: new Date().toISOString(),
  };
};

export const getActivityLogs = async (query: PaginationQuery) => {
  const page = Math.max(parseInt(query.page || '1', 10), 1);
  const limit = Math.min(Math.max(parseInt(query.limit || '50', 10), 1), 200);
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    ActivityLog.find({})
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    ActivityLog.countDocuments({}),
  ]);

  return {
    items,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
    serverTime: new Date().toISOString(),
  };
};

export const getMetrics = async () => {
  const [result] = await Task.aggregate([
    {
      $facet: {
        taskCounts: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
      },
    },
  ]);

  const taskCounts: TaskCounts = { pending: 0, in_progress: 0, completed: 0 };
  if (result?.taskCounts) {
    for (const row of result.taskCounts) {
      if (row?._id && Object.prototype.hasOwnProperty.call(taskCounts, row._id)) {
        taskCounts[row._id as keyof TaskCounts] = row.count;
      }
    }
  }

  const [usersResult, agentsResult] = await Promise.all([
    User.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
          inactive: { $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] } },
        },
      },
    ]),
    Agent.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
          inactive: { $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] } },
        },
      },
    ]),
  ]);

  const u = usersResult[0] || { total: 0, active: 0, inactive: 0 };
  const a = agentsResult[0] || { total: 0, active: 0, inactive: 0 };

  return {
    counts: {
      tasks: taskCounts,
      users: { total: u.total, active: u.active, inactive: u.inactive },
      agents: { total: a.total, active: a.active, inactive: a.inactive },
    },
    serverTime: new Date().toISOString(),
  };
};

export const getAnalytics = async () => {
  const [taskStats, userStats, userTaskStats] = await Promise.all([
    Task.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
        },
      },
    ]),
    User.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
          inactive: { $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] } },
        },
      },
    ]),
    Task.aggregate([
      {
        $group: {
          _id: '$owner',
          totalTasks: { $sum: 1 },
          completedTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
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
      { $sort: { totalTasks: -1 } },
    ]),
  ]);

  const t = taskStats[0] || { total: 0, completed: 0, pending: 0, inProgress: 0 };
  const u = userStats[0] || { total: 0, active: 0, inactive: 0 };
  const completionRate = t.total > 0 ? Math.round((t.completed / t.total) * 100) : 0;

  return {
    users: { total: u.total, active: u.active, inactive: u.inactive },
    tasks: {
      total: t.total,
      completed: t.completed,
      pending: t.pending,
      inProgress: t.inProgress,
      completionRate,
    },
    userTaskStats,
  };
};

export const getPublicAnalytics = async () => {
  const total = await Task.countDocuments({});
  const pending = await Task.countDocuments({ status: 'pending' });
  const inProgress = await Task.countDocuments({ status: 'in_progress' });
  const completed = await Task.countDocuments({ status: 'completed' });
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    tasks: { total, pending, inProgress, completed, completionRate },
    serverTime: new Date().toISOString(),
  };
};
