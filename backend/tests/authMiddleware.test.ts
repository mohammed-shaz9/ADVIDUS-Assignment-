import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('jsonwebtoken', () => ({
  default: { verify: vi.fn() },
}));

vi.mock('../src/models/User.js', () => ({
  default: { findById: vi.fn() },
}));

vi.mock('../src/config/env.js', () => ({
  env: { jwtSecret: 'test-secret' },
}));

import { protect, adminOnly } from '../src/middleware/authMiddleware.js';
import jwt from 'jsonwebtoken';
import User from '../src/models/User.js';

describe('authMiddleware', () => {
  let mockReq: any;
  let mockRes: any;
  let mockNext: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockReq = { headers: {} };
    mockRes = {};
    mockNext = vi.fn();
  });

  describe('protect', () => {
    it('401 if no authorization header', async () => {
      await protect(mockReq, mockRes, mockNext);
      expect(mockNext.mock.calls[0][0].statusCode).toBe(401);
    });

    it('401 if token malformed (no Bearer)', async () => {
      mockReq.headers.authorization = 'InvalidToken';
      await protect(mockReq, mockRes, mockNext);
      expect(mockNext.mock.calls[0][0].statusCode).toBe(401);
    });

    it('401 if jwt verify fails', async () => {
      mockReq.headers.authorization = 'Bearer x.y.z';
      vi.mocked(jwt.verify).mockImplementation(() => { throw new Error('bad'); });
      await protect(mockReq, mockRes, mockNext);
      expect(mockNext.mock.calls[0][0].statusCode).toBe(401);
    });

    it('401 if user not found in DB', async () => {
      mockReq.headers.authorization = 'Bearer valid.jwt';
      vi.mocked(jwt.verify).mockReturnValue({ id: 'noid' } as any);
      vi.mocked(User.findById).mockReturnValue({ select: vi.fn().mockResolvedValue(null) } as any);
      await protect(mockReq, mockRes, mockNext);
      expect(mockNext.mock.calls[0][0].statusCode).toBe(401);
    });

    it('403 if user account is inactive', async () => {
      mockReq.headers.authorization = 'Bearer valid.jwt';
      vi.mocked(jwt.verify).mockReturnValue({ id: 'uid' } as any);
      vi.mocked(User.findById).mockReturnValue({ select: vi.fn().mockResolvedValue({ status: 'inactive', name: 'Test' }) } as any);
      await protect(mockReq, mockRes, mockNext);
      expect(mockNext.mock.calls[0][0].statusCode).toBe(403);
    });

    it('attaches user to req and calls next() on success', async () => {
      const mockUser = { _id: 'uid', name: 'Test', role: 'admin', status: 'active' };
      mockReq.headers.authorization = 'Bearer valid.jwt';
      vi.mocked(jwt.verify).mockReturnValue({ id: 'uid' } as any);
      vi.mocked(User.findById).mockReturnValue({ select: vi.fn().mockResolvedValue(mockUser) } as any);
      await protect(mockReq, mockRes, mockNext);
      expect(mockReq.user).toBeDefined();
      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('adminOnly', () => {
    it('allows admin', () => {
      mockReq.user = { role: 'admin' };
      adminOnly(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('blocks non-admin with 403', () => {
      mockReq.user = { role: 'user' };
      adminOnly(mockReq, mockRes, mockNext);
      expect(mockNext.mock.calls[0][0].statusCode).toBe(403);
    });

    it('blocks unauthenticated', () => {
      adminOnly(mockReq, mockRes, mockNext);
      expect(mockNext.mock.calls[0][0].statusCode).toBe(403);
    });
  });
});
