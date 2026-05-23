import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError.js';
import { logger } from '../config/logger.js';
import { env } from '../config/env.js';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    logger.warn('Operational error', {
      message: err.message,
      statusCode: err.statusCode,
    });

    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      stack: env.nodeEnv === 'production' ? null : err.stack,
      serverTime: new Date().toISOString(),
    });
    return;
  }

  logger.error('Unhandled error', {
    message: err.message,
    stack: err.stack,
  });

  res.status(500).json({
    success: false,
    message: env.nodeEnv === 'production' ? 'Internal server error' : err.message,
    stack: env.nodeEnv === 'production' ? null : err.stack,
    serverTime: new Date().toISOString(),
  });
};

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: `Route not found - ${req.originalUrl}`,
    serverTime: new Date().toISOString(),
  });
};
