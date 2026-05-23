import { Response, NextFunction } from 'express';
import * as taskService from '../services/taskService.js';
import { AuthenticatedRequest } from '../types/index.js';

export const createTask = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { title, description, assignedTo } = req.body;
    const task = await taskService.createTask(title, description, req.user!._id.toString(), assignedTo);
    res.status(201).json({ success: true, data: task, serverTime: new Date().toISOString() });
  } catch (error) {
    next(error);
  }
};

export const getTasks = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tasks = await taskService.getTasks(req.user!._id.toString());
    res.json({ success: true, data: tasks, serverTime: new Date().toISOString() });
  } catch (error) {
    next(error);
  }
};

export const getTaskSummary = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const summary = await taskService.getTaskSummary(req.user!._id.toString());
    res.json({ success: true, data: summary, serverTime: new Date().toISOString() });
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const taskId = req.params.id as string;
    const { title, description, status, assignedTo } = req.body;
    const task = await taskService.updateTask(
      taskId,
      req.user!._id.toString(),
      req.user!.role,
      { title, description, status, assignedTo }
    );
    res.json({ success: true, data: task, serverTime: new Date().toISOString() });
  } catch (error) {
    next(error);
  }
};

export const simulateActivity = async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await taskService.simulateActivity();
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const taskId = req.params.id as string;
    const result = await taskService.deleteTask(taskId, req.user!._id.toString(), req.user!.role);
    res.json({ success: true, ...result, serverTime: new Date().toISOString() });
  } catch (error) {
    next(error);
  }
};
