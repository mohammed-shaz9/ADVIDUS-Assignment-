import { Response, NextFunction } from 'express';
import * as adminService from '../services/adminService.js';
import { AuthenticatedRequest } from '../types/index.js';

export const getUsers = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const users = await adminService.getUsers();
    res.json({ success: true, data: users, serverTime: new Date().toISOString() });
  } catch (error) {
    next(error);
  }
};

export const toggleUserStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await adminService.toggleUserStatus(req.params.id as string, req.user!._id.toString());
    res.json({ success: true, data: user, serverTime: new Date().toISOString() });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await adminService.deleteUser(req.params.id as string, req.user!._id.toString());
    res.json({ success: true, ...result, serverTime: new Date().toISOString() });
  } catch (error) {
    next(error);
  }
};

export const getAdminTasks = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await adminService.getAdminTasks(req.query as Record<string, string>);
    res.json({ success: true, ...result, serverTime: new Date().toISOString() });
  } catch (error) {
    next(error);
  }
};

export const getActivityLogs = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await adminService.getActivityLogs(req.query as Record<string, string>);
    res.json({ success: true, ...result, serverTime: new Date().toISOString() });
  } catch (error) {
    next(error);
  }
};

export const getMetrics = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await adminService.getMetrics();
    res.json({ success: true, ...result, serverTime: new Date().toISOString() });
  } catch (error) {
    next(error);
  }
};

export const getAnalytics = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await adminService.getAnalytics();
    res.json({ success: true, data: result, serverTime: new Date().toISOString() });
  } catch (error) {
    next(error);
  }
};

export const getPublicAnalytics = async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await adminService.getPublicAnalytics();
    res.json({ success: true, data: result, serverTime: new Date().toISOString() });
  } catch (error) { next(error); }
};
