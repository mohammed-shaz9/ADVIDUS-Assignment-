import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

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
import { invalidateUser } from '../src/utils/userCache.js';
import jwt from 'jsonwebtoken';
import User from '../src/models/User.js';

// findById(id).select(...).lean() -> result. The real userCache is shared across tests, so every
// test uses its own user id.
const dbReturns = (result: unknown) => {
  const lean = vi.fn().mockResolvedValue(result);
  const select = vi.fn().mockReturnValue({ lean });
  vi.mocked(User.findById).mockReturnValue({ select } as any);
  return { select, lean };
};

describe('authMiddleware', () => {
  let mockReq: any;
  let mockRes: any;
  let mockNext: ReturnType<typeof vi.fn>;

  const asUser = (id: string) => {
    mockReq.headers.authorization = 'Bearer valid.jwt';
    vi.mocked(jwt.verify).mockReturnValue({ id } as any);
  };

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

    it('401 if user not found in DB, and not cached', async () => {
      asUser('u-missing');
      dbReturns(null);
      await protect(mockReq, mockRes, mockNext);
      expect(mockNext.mock.calls[0][0].statusCode).toBe(401);
      await protect(mockReq, mockRes, mockNext);
      expect(User.findById).toHaveBeenCalledTimes(2);
    });

    it('403 if user account is inactive, and it is not cached', async () => {
      asUser('u-inactive');
      dbReturns({ _id: 'u-inactive', role: 'user', status: 'inactive' });
      await protect(mockReq, mockRes, mockNext);
      expect(mockNext.mock.calls[0][0].statusCode).toBe(403);
      expect(mockReq.user).toBeUndefined();

      // still inactive -> DB hit again, still 403
      await protect(mockReq, mockRes, mockNext);
      expect(User.findById).toHaveBeenCalledTimes(2);
      expect(mockNext.mock.calls[1][0].statusCode).toBe(403);

      // reactivated -> next request passes immediately (nothing stale was cached)
      dbReturns({ _id: 'u-inactive', role: 'user', status: 'active' });
      await protect(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenLastCalledWith();
      expect(mockReq.user.status).toBe('active');
    });

    it('attaches lean user to req and calls next() on success; reads only role/status', async () => {
      const mockUser = { _id: 'u-ok', role: 'admin', status: 'active' };
      asUser('u-ok');
      const { select, lean } = dbReturns(mockUser);
      await protect(mockReq, mockRes, mockNext);
      expect(User.findById).toHaveBeenCalledWith('u-ok');
      expect(select).toHaveBeenCalledWith('role status');
      expect(lean).toHaveBeenCalled();
      expect(mockReq.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('cache hit skips the DB', async () => {
      const mockUser = { _id: 'u-hit', role: 'user', status: 'active' };
      asUser('u-hit');
      dbReturns(mockUser);
      await protect(mockReq, mockRes, mockNext);

      const req2: any = { headers: { authorization: 'Bearer valid.jwt' } };
      const next2 = vi.fn();
      await protect(req2, mockRes, next2);

      expect(User.findById).toHaveBeenCalledTimes(1);
      expect(req2.user).toEqual(mockUser);
      expect(next2).toHaveBeenCalledWith();
    });

    it('invalidateUser forces a fresh DB read', async () => {
      asUser('u-inval');
      dbReturns({ _id: 'u-inval', role: 'user', status: 'active' });
      await protect(mockReq, mockRes, mockNext);
      await protect(mockReq, mockRes, mockNext);
      expect(User.findById).toHaveBeenCalledTimes(1);

      invalidateUser('u-inval');
      dbReturns({ _id: 'u-inval', role: 'user', status: 'inactive' });
      await protect(mockReq, mockRes, mockNext);
      expect(User.findById).toHaveBeenCalledTimes(2);
      expect(mockNext.mock.calls.at(-1)![0].statusCode).toBe(403);
    });

    describe('cache TTL', () => {
      beforeEach(() => vi.useFakeTimers({ toFake: ['Date'] }));
      afterEach(() => vi.useRealTimers());

      it('entry expires after 5s', async () => {
        asUser('u-ttl');
        dbReturns({ _id: 'u-ttl', role: 'user', status: 'active' });
        await protect(mockReq, mockRes, mockNext);

        vi.advanceTimersByTime(4999);
        await protect(mockReq, mockRes, mockNext);
        expect(User.findById).toHaveBeenCalledTimes(1);

        vi.advanceTimersByTime(1);
        await protect(mockReq, mockRes, mockNext);
        expect(User.findById).toHaveBeenCalledTimes(2);
      });
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
