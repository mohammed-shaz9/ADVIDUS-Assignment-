import Approval from '../models/Approval.js';
import Task from '../models/Task.js';
import { logActivity } from '../utils/activityLogger.js';
import { emitEvent } from '../utils/realtime.js';
import { NotFoundError, ForbiddenError, ValidationError } from '../errors/AppError.js';

export const getApprovalsForUser = async (userId: string) => {
  return Approval.find({ approver: userId })
    .populate('task', 'title description status')
    .populate('approver', 'name email')
    .sort({ createdAt: -1 });
};

export const getApprovalsForTask = async (taskId: string) => {
  return Approval.find({ task: taskId })
    .populate('approver', 'name email')
    .sort({ level: 1 });
};

export const createApprovalChain = async (
  taskId: string,
  approvers: Array<{ approver: string; level: number }>,
) => {
  const task = await Task.findById(taskId);
  if (!task) throw new NotFoundError('Task');

  const approvals = await Approval.insertMany(
    approvers.map(a => ({ task: taskId, approver: a.approver, level: a.level }))
  );

  await logActivity(task.owner.toString(), 'APPROVAL_CHAIN_CREATED',
    `Approval chain created for task: "${task.title}"`);

  emitEvent('approval.created', { taskId });
  return approvals;
};

export const decideApproval = async (
  approvalId: string,
  userId: string,
  decision: 'approved' | 'rejected',
  comment?: string,
) => {
  const approval = await Approval.findById(approvalId).populate('task', 'title owner status');
  if (!approval) throw new NotFoundError('Approval');
  if (approval.approver.toString() !== userId) throw new ForbiddenError('Not your approval request');
  if (approval.status !== 'pending') throw new ValidationError('Already decided');

  approval.status = decision;
  approval.comment = comment || '';
  approval.decidedAt = new Date();
  await approval.save();

  const task = await Task.findById(approval.task);
  if (task) {
    const allApprovals = await Approval.find({ task: task._id });
    const pending = allApprovals.filter(a => a.status === 'pending');
    const rejected = allApprovals.filter(a => a.status === 'rejected');

    if (decision === 'rejected' || rejected.length > 0) {
      task.status = 'pending';
    } else if (pending.length === 0) {
      task.status = 'in_progress';
    }
    await task.save();
  }

  const action = decision === 'approved' ? 'APPROVAL_GRANTED' : 'APPROVAL_REJECTED';
  await logActivity(userId, action,
    `${decision} approval for task: "${(approval as any).task?.title || ''}"`);

  emitEvent('approval.decided', { approvalId: approval._id.toString(), decision });
  return approval;
};
