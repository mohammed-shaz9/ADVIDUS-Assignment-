import { Types } from 'mongoose';
import Task from '../models/Task.js';
import { logActivity } from '../utils/activityLogger.js';
import { executeAgentTask } from '../utils/agentExecutor.js';
import { emitEvent } from '../utils/realtime.js';
import { parsePage, oneOf } from '../utils/paginate.js';
import { NotFoundError, ForbiddenError } from '../errors/AppError.js';
import { TaskCounts, PaginationQuery } from '../types/index.js';
import { createNotification } from './notificationService.js';

const TASK_STATUSES = ['pending', 'in_progress', 'completed'] as const;

export const createTask = async (
  title: string,
  description: string | undefined,
  ownerId: string,
  assignedTo?: Record<string, unknown>
) => {
  const task = await Task.create({
    title,
    description,
    owner: ownerId,
    assignedTo: assignedTo || { assigneeType: 'human', user: ownerId },
  });

  await logActivity(ownerId, 'TASK_CREATED', `Created task: "${title}"`);
  emitEvent('task.created', { taskId: task._id.toString() }, [ownerId, task.assignedTo?.user?.toString()]);

  if (task.assignedTo?.user && task.assignedTo.user.toString() !== ownerId) {
    createNotification(
      task.assignedTo.user.toString(),
      'task_assigned',
      'New Task Assigned',
      `You have been assigned: "${title}"`,
      `/tasks/${task._id}`
    );
  }

  if (task.assignedTo?.assigneeType === 'agent' && task.assignedTo.agent) {
    executeAgentTask(task._id.toString());
  }

  return task;
};

// "Mine" = tasks I own or that were assigned to me.
export const getTasks = async (userId: string, query: PaginationQuery = {}) => {
  const { skip, limit } = parsePage(query, 200, 500);
  const filter: Record<string, unknown> = { $or: [{ owner: userId }, { 'assignedTo.user': userId }] };
  const status = oneOf(query.status, TASK_STATUSES);
  if (status) filter.status = status;

  return Task.find(filter)
    .populate('assignedTo.user', 'name email')
    .populate('assignedTo.agent', 'name role modelName status')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
};

export const getTaskSummary = async (userId: string) => {
  // aggregate() does not cast strings to ObjectId (find() does) — cast explicitly or nothing matches.
  const id = new Types.ObjectId(userId);
  const match = { $or: [{ owner: id }, { 'assignedTo.user': id }] };

  const grouped = await Task.aggregate([
    { $match: match },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const counts: TaskCounts = { pending: 0, in_progress: 0, completed: 0 };
  for (const row of grouped) {
    if (row?._id && Object.prototype.hasOwnProperty.call(counts, row._id)) {
      counts[row._id as keyof TaskCounts] = row.count;
    }
  }

  return {
    counts,
    total: counts.pending + counts.in_progress + counts.completed,
    serverTime: new Date().toISOString(),
  };
};

export const updateTask = async (
  taskId: string,
  userId: string,
  userRole: string,
  updates: {
    title?: string;
    description?: string;
    status?: string;
    assignedTo?: Record<string, unknown>;
  }
) => {
  const task = await Task.findById(taskId);
  if (!task) {
    throw new NotFoundError('Task');
  }

  const isOwner = task.owner.toString() === userId;
  const isAssignee = task.assignedTo?.user?.toString() === userId;
  if (!isOwner && !isAssignee && userRole !== 'admin') {
    throw new ForbiddenError('Not authorized to update this task');
  }
  // An assignee works the task (status) but cannot retitle, reassign or reopen scope.
  if (!isOwner && userRole !== 'admin') {
    updates = { status: updates.status };
  }

  const oldStatus = task.status;
  const oldAssigneeType = task.assignedTo?.assigneeType;
  const oldAgentId = task.assignedTo?.agent?.toString();
  const oldAssigneeId = task.assignedTo?.user?.toString();

  if (updates.title !== undefined) task.title = updates.title;
  if (updates.description !== undefined) task.description = updates.description;
  if (updates.status !== undefined) task.status = updates.status as typeof task.status;
  if (updates.assignedTo !== undefined) task.assignedTo = updates.assignedTo as typeof task.assignedTo;

  const isRerun = updates.status === 'pending' && oldStatus !== 'pending';
  const isNewAgent =
    updates.assignedTo?.assigneeType === 'agent' &&
    (oldAssigneeType !== 'agent' || updates.assignedTo.agent !== oldAgentId);

  if (isRerun || isNewAgent) {
    task.result = undefined;
    task.executionLogs = [];
  }

  const updatedTask = await task.save();

  let details = `Updated task: "${task.title}"`;
  if (updates.status !== undefined && updates.status !== oldStatus) {
    details += ` (Status changed to ${updates.status})`;
  }

  await logActivity(userId, 'TASK_UPDATED', details);

  if (
    updatedTask.assignedTo?.assigneeType === 'agent' &&
    updatedTask.assignedTo.agent &&
    updatedTask.status === 'pending'
  ) {
    executeAgentTask(updatedTask._id.toString());
  }

  const populated = await Task.findById(updatedTask._id)
    .populate('assignedTo.user', 'name email')
    .populate('assignedTo.agent', 'name role modelName status');

  emitEvent(
    'task.updated',
    { taskId: populated!._id.toString(), status: populated!.status },
    [task.owner.toString(), oldAssigneeId, task.assignedTo?.user?.toString()]
  );

  if (updates.status && updates.status !== oldStatus && task.owner.toString() !== userId) {
    createNotification(
      task.owner.toString(),
      'status_change',
      `Task ${updates.status === 'completed' ? 'Completed' : 'Status Updated'}`,
      `"${task.title}" is now ${updates.status.replace('_', ' ')}`,
      `/tasks/${task._id}`
    );
  }

  return populated;
};

export const deleteTask = async (taskId: string, userId: string, userRole: string) => {
  const task = await Task.findById(taskId);
  if (!task) {
    throw new NotFoundError('Task');
  }

  if (task.owner.toString() !== userId && userRole !== 'admin') {
    throw new ForbiddenError('Not authorized to delete this task');
  }

  await Task.findByIdAndDelete(taskId);

  await logActivity(userId, 'TASK_DELETED', `Deleted task: "${task.title}"`);
  emitEvent('task.deleted', { taskId: task._id.toString() }, [task.owner.toString(), task.assignedTo?.user?.toString()]);

  return { message: 'Task removed successfully' };
};

export const simulateActivity = async () => {
  const statuses: Array<'pending' | 'in_progress' | 'completed'> = ['pending', 'in_progress', 'completed'];
  const sample = await Task.aggregate([{ $sample: { size: 3 } }]);
  const results: string[] = [];

  for (const task of sample) {
    const nextStatuses = statuses.filter(s => s !== task.status);
    const newStatus = nextStatuses[Math.floor(Math.random() * nextStatuses.length)];

    await Task.findByIdAndUpdate(task._id, { status: newStatus });
    results.push(`${task._id}: ${task.status} → ${newStatus}`);

    emitEvent('task.updated', { taskId: task._id.toString(), status: newStatus, simulated: true });
  }

  return { message: 'Activity simulated', toggled: results.length, serverTime: new Date().toISOString() };
};
