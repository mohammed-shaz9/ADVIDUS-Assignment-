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
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
      ];
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
  const [
    totalUsers,
    activeUsers,
    inactiveUsers,
    totalAgents,
    activeAgents,
    inactiveAgents,
    taskGrouped,
  ] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ status: 'active' }),
    User.countDocuments({ status: 'inactive' }),
    Agent.countDocuments({}),
    Agent.countDocuments({ status: 'active' }),
    Agent.countDocuments({ status: 'inactive' }),
    Task.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
  ]);

  const taskCounts: TaskCounts = { pending: 0, in_progress: 0, completed: 0 };
  for (const row of taskGrouped) {
    if (row?._id && Object.prototype.hasOwnProperty.call(taskCounts, row._id)) {
      taskCounts[row._id as keyof TaskCounts] = row.count;
    }
  }

  return {
    counts: {
      tasks: taskCounts,
      users: { total: totalUsers, active: activeUsers, inactive: inactiveUsers },
      agents: { total: totalAgents, active: activeAgents, inactive: inactiveAgents },
    },
    serverTime: new Date().toISOString(),
  };
};

export const getAnalytics = async () => {
  const [totalUsers, activeUsers, inactiveUsers, totalTasks, completedTasks, pendingTasks, inProgressTasks, usersList] =
    await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ status: 'active' }),
      User.countDocuments({ status: 'inactive' }),
      Task.countDocuments({}),
      Task.countDocuments({ status: 'completed' }),
      Task.countDocuments({ status: 'pending' }),
      Task.countDocuments({ status: 'in_progress' }),
      User.find({}),
    ]);

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const userTaskStats = await Promise.all(
    usersList.map(async (u) => {
      const uTotal = await Task.countDocuments({ owner: u._id });
      const uCompleted = await Task.countDocuments({ owner: u._id, status: 'completed' });
      return {
        _id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.status,
        totalTasks: uTotal,
        completedTasks: uCompleted,
      };
    })
  );

  return {
    users: { total: totalUsers, active: activeUsers, inactive: inactiveUsers },
    tasks: {
      total: totalTasks,
      completed: completedTasks,
      pending: pendingTasks,
      inProgress: inProgressTasks,
      completionRate,
    },
    userTaskStats,
  };
};
