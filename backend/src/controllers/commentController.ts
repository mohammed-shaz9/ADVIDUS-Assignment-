import { Response, NextFunction } from 'express';
import TaskComment from '../models/TaskComment.js';
import Task from '../models/Task.js';
import { AuthenticatedRequest } from '../types/index.js';
import { NotFoundError } from '../errors/AppError.js';
import { emitEvent } from '../utils/realtime.js';

export const getComments = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const comments = await TaskComment.find({ task: req.params.taskId as string })
      .populate('author', 'name email')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: comments, serverTime: new Date().toISOString() });
  } catch (e) { next(e); }
};

export const createComment = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) throw new NotFoundError('Task');
    const comment = await TaskComment.create({
      task: req.params.taskId,
      author: req.user!._id,
      content: req.body.content,
      attachments: req.body.attachments,
    });
    const populated = await comment.populate('author', 'name email');
    emitEvent('comment.created', { taskId: req.params.taskId, commentId: comment._id.toString() });
    res.status(201).json({ success: true, data: populated, serverTime: new Date().toISOString() });
  } catch (e) { next(e); }
};

export const deleteComment = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const comment = await TaskComment.findById(req.params.commentId);
    if (!comment) throw new NotFoundError('Comment');
    if (comment.author.toString() !== req.user!._id.toString() && req.user!.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized', serverTime: new Date().toISOString() });
    }
    await comment.deleteOne();
    res.json({ success: true, data: { message: 'Comment deleted' }, serverTime: new Date().toISOString() });
  } catch (e) { next(e); }
};
