import { Response, NextFunction } from 'express';
import * as performanceService from '../services/performanceService.js';
import { AuthenticatedRequest } from '../types/index.js';

export const getMyPerformance = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const perf = await performanceService.getPerformanceForUser(req.user!._id.toString());
    res.json({ success: true, data: perf, serverTime: new Date().toISOString() });
  } catch (e) { next(e); }
};

export const getUserPerformance = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const perf = await performanceService.getPerformanceForUser(req.params.userId as string);
    res.json({ success: true, data: perf, serverTime: new Date().toISOString() });
  } catch (e) { next(e); }
};

export const getAllPerformance = async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const data = await performanceService.getAllPerformance();
    res.json({ success: true, data, serverTime: new Date().toISOString() });
  } catch (e) { next(e); }
};

export const takeSnapshot = async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await performanceService.snapshotAllPerformance();
    res.json({ success: true, data: result, serverTime: new Date().toISOString() });
  } catch (e) { next(e); }
};
