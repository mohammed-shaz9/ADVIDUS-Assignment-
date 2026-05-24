import rateLimit from 'express-rate-limit';
import { Response } from 'express';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // Increased from 100 to accommodate 4s polling (15 req/min per user * 5 users = 75 req/min baseline + headroom)
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health check and public endpoints
    return req.path === '/' || req.path === '/api/analytics';
  },
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
    serverTime: new Date().toISOString(),
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50, // Increased from 10 to allow multiple login attempts across users
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts, please try again later.',
    serverTime: new Date().toISOString(),
  },
});
