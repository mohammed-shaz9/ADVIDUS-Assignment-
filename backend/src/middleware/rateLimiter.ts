import rateLimit from 'express-rate-limit';

// Limits are per client IP. Offices share one NAT IP, so both caps are env-tunable.
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.API_RATE_MAX || '', 10) || 2000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/analytics', // memoized, cheap; req.path is relative to the /api mount
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
    serverTime: new Date().toISOString(),
  },
});

// Only FAILED attempts count, so brute force is capped while 1000s of employees can sign in behind one IP.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.AUTH_RATE_MAX || '', 10) || 50,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts, please try again later.',
    serverTime: new Date().toISOString(),
  },
});
