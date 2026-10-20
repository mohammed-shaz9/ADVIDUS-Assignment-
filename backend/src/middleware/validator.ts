import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { ValidationError } from '../errors/AppError.js';

// The old /\w+([.-]?\w+)*@/ form backtracks exponentially on long near-miss input (ReDoS) and rejected
// valid TLDs longer than 3 chars (.tech, .online). The lookahead caps the length at 254 (RFC 5321) first,
// so even the remaining quadratic backtracking is bounded to ~254 chars.
export const EMAIL_RE = /^(?=.{3,254}$)[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const validateRegister = (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
  const { name, email, password } = req.body;

  if (!name || typeof name !== 'string' || name.trim() === '') {
    throw new ValidationError('Full name is required');
  }

  if (!email || typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
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

  if (!email || typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
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
