import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { hasPermission } from '../utils/permissions.js';
import { env } from '../config/env.js';
import { AuthenticatedRequest, Permission } from '../types/index.js';
import { UnauthorizedError, ForbiddenError } from '../errors/AppError.js';

export const protect = async (req: AuthenticatedRequest, _res: Response, next: NextFunction): Promise<void> => {
  try {
    let token: string | undefined;

    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new UnauthorizedError('Not authorized, no token'));
    }

    const decoded = jwt.verify(token, env.jwtSecret) as { id: string };
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return next(new UnauthorizedError('Not authorized, user not found'));
    }

    if (user.status === 'inactive') {
      return next(new ForbiddenError('Your account is deactivated. Please contact an admin.'));
    }

    req.user = user;
    next();
  } catch (error) {
    next(new UnauthorizedError('Not authorized, token failed'));
  }
};

export const adminOnly = (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    next(new ForbiddenError('Access denied: Admin role required'));
  }
};

export const checkPermission = (permission: Permission) => {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Not authorized, no user session'));
    }

    if (hasPermission(req.user.role, permission)) {
      next();
    } else {
      next(new ForbiddenError(
        `Access denied: You do not have the required permission (${permission})`
      ));
    }
  };
};
