import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { ValidationError } from '../errors/AppError.js';

export const validateRegister = (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
  const { name, email, password } = req.body;

  if (!name || typeof name !== 'string' || name.trim() === '') {
    throw new ValidationError('Full name is required');
  }

  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
    throw new ValidationError('A valid email address is required');
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    throw new ValidationError('Password must be at least 6 characters long');
  }

  req.body.name = name.trim();
  req.body.email = email.trim().toLowerCase();

  next();
};

export const validateLogin = (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
  const { email, password } = req.body;

  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
    throw new ValidationError('A valid email address is required');
  }

  if (!password || typeof password !== 'string' || password.trim() === '') {
    throw new ValidationError('Password is required');
  }

  req.body.email = email.trim().toLowerCase();

  next();
};

export const validateTask = (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
  const { title, description } = req.body;

  if (!title || typeof title !== 'string' || title.trim() === '') {
    throw new ValidationError('Task title is required');
  }

  req.body.title = title.trim();
  if (description !== undefined && typeof description === 'string') {
    req.body.description = description.trim();
  }

  next();
};
