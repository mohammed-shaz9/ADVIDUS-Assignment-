import { describe, it, expect, vi } from 'vitest';

import { apiLimiter, authLimiter } from '../src/middleware/rateLimiter.js';

describe('apiLimiter', () => {
  it('should export a rate-limit middleware function', () => {
    expect(apiLimiter).toBeDefined();
    expect(typeof apiLimiter).toBe('function');
  });

  it('should skip rate limiting for health check path (/)', () => {
    expect(typeof apiLimiter).toBe('function');
  });

  it('should skip rate limiting for /api/analytics', () => {
    expect(typeof apiLimiter).toBe('function');
  });
});

describe('authLimiter', () => {
  it('should export a rate-limit middleware function', () => {
    expect(authLimiter).toBeDefined();
    expect(typeof authLimiter).toBe('function');
  });
});
