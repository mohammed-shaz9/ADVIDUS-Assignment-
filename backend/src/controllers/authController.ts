import { Response, NextFunction } from 'express';
import * as authService from '../services/authService.js';
import { AuthenticatedRequest } from '../types/index.js';

export const registerUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, password } = req.body;
    const result = await authService.registerUser(name, email, password);
    res.status(201).json({ success: true, data: result, serverTime: new Date().toISOString() });
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser(email, password);
    res.json({ success: true, data: result, serverTime: new Date().toISOString() });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await authService.getMe(req.user!._id.toString());
    res.json({ success: true, data: user, serverTime: new Date().toISOString() });
  } catch (error) {
    next(error);
  }
};

export const ensureDemo = async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await authService.ensureDemoUsers();
    res.json({ success: true, ...result, serverTime: new Date().toISOString() });
  } catch (error) {
    next(error);
  }
};
